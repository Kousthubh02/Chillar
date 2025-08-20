import React, { useState, useEffect, useCallback } from "react";
import config from "../../config";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { router } from "expo-router";
// import DateTimePicker from "@react-native-community/datetimepicker";

// Enhanced TypeScript interfaces for better type safety
interface Transaction {
  transaction_id: number;
  person_id: number;
  person_name: string;
  event_id: number | null;
  event_name: string;
  amount: number;
  paid_amount: number;
  reason: string;
  due_date: string;
  status: boolean;
}

interface Person {
  person_id: number;
  person_name: string;
}

interface Event {
  event_id: number;
  event_name: string;
}

interface FormState {
  person_name: string;
  event_name: string;
  amount: string;
  reason: string;
  due_date: string;
}

const mockTransactions: Transaction[] = [
  {
    transaction_id: 1,
    person_id: 1,
    person_name: "John Doe",
    event_id: 1,
    event_name: "Birthday Party",
    amount: 50.0,
    paid_amount: 0.0,
    reason: "Food Contribution",
    due_date: "01-06-2025",
    status: false,
  },
  {
    transaction_id: 2,
    person_id: 2,
    person_name: "Jane Smith",
    event_id: 2,
    event_name: "Wedding",
    amount: 100.0,
    paid_amount: 0.0,
    reason: "Gift",
    due_date: "01-07-2025",
    status: false,
  },
];

const mockPeople: Person[] = [
  { person_id: 1, person_name: "John Doe" },
  { person_id: 2, person_name: "Jane Smith" },
];

const mockEvents: Event[] = [
  { event_id: 1, event_name: "Birthday Party" },
  { event_id: 2, event_name: "Wedding" },
];

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [partialPaymentModalVisible, setPartialPaymentModalVisible] = useState<boolean>(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [partialPaymentError, setPartialPaymentError] = useState<string>("");
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  // Fetch transactions, people, and events from API
  // Replace with your computer's local IP address
  const BASE_URL = config.BACKEND_URL;
  useEffect(() => {
    fetch(`${BASE_URL}/api/transactions`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched transactions:", data);
        setTransactions(data);
      })
      .catch(() => setTransactions([]));
    fetch(`${BASE_URL}/api/people`)
      .then((res) => res.json())
      .then((data) => setPeople(data))
      .catch(() => setPeople([]));
    fetch(`${BASE_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => setEvents([]));
  }, []);
  const [form, setForm] = useState<FormState>({
    person_name: "",
    event_name: "",
    amount: "",
    reason: "",
    due_date: "",
  });
  const [error, setError] = useState<string>("");
  const [personDropdownVisible, setPersonDropdownVisible] =
    useState<boolean>(false);
  const [eventDropdownVisible, setEventDropdownVisible] =
    useState<boolean>(false);
  const [filterBy, setFilterBy] = useState<'all' | 'person' | 'event'>('all');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>('');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('');
  const [filterDropdownVisible, setFilterDropdownVisible] = useState<boolean>(false);

  // Memoized resetForm to prevent unnecessary re-renders
  const resetForm = useCallback(() => {
    setForm({
      person_name: "",
      event_name: "",
      amount: "",
      reason: "",
      due_date: "",
    });
    setError("");
    setPersonDropdownVisible(false);
    setEventDropdownVisible(false);
  }, []);

  // Reset partial payment form
  const resetPartialPaymentForm = useCallback(() => {
    setPartialPaymentAmount("");
    setPartialPaymentError("");
    setSelectedTransactionId(null);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!modalVisible) {
      resetForm();
    }
  }, [modalVisible, resetForm]);

  // Reset partial payment form when modal closes
  useEffect(() => {
    if (!partialPaymentModalVisible) {
      resetPartialPaymentForm();
    }
  }, [partialPaymentModalVisible, resetPartialPaymentForm]);

  // Handle back button press for Add Transaction Modal
  useEffect(() => {
    if (modalVisible) {
      const backAction = () => {
        setModalVisible(false);
        return true; // Prevent default back action
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }
  }, [modalVisible]);

  // Handle back button press for Partial Payment Modal
  useEffect(() => {
    if (partialPaymentModalVisible) {
      const backAction = () => {
        setPartialPaymentModalVisible(false);
        return true; // Prevent default back action
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }
  }, [partialPaymentModalVisible]);

  // Validate date format DD-MM-YYYY
  const validateDate = (date: string): string => {
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(date)) return "Enter date in DD-MM-YYYY format";
    const [d, m, y] = date.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (
      dateObj.getDate() !== d ||
      dateObj.getMonth() + 1 !== m ||
      dateObj.getFullYear() !== y ||
      y < 1900
    ) {
      return "Invalid date";
    }
    // Prevent past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return "Due date cannot be in the past";
    }
    return "";
  };

  const handleAddPerson = async () => {
    const trimmedName = form.person_name.trim();
    if (!trimmedName) {
      setError("Person name is required");
      return;
    }
    if (
      people.find((p) => p.person_name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Person already exists");
      return;
    }

    try {
      // Create person on the server
      const response = await fetch(`${BASE_URL}/api/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_name: trimmedName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create person: ${errorData.msg || response.statusText || 'Unknown error'}`);
      }

      const newPerson = await response.json() as Person;
      console.log('New person created:', newPerson);
      setPeople((prev) => [...prev, newPerson]);
      setPersonDropdownVisible(false);
      setForm((prev) => ({ ...prev, person_name: trimmedName }));
      setError("");
    } catch (err) {
      console.error('Error creating person:', err);
      setError(err instanceof Error ? err.message : 'Failed to create person');
    }
  };

  const handleAddEvent = async () => {
    const trimmedName = form.event_name.trim();
    if (!trimmedName) {
      setError("Event name is required");
      return;
    }
    if (
      events.find((e) => e.event_name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Event already exists");
      return;
    }

    try {
      // Create event on the server
      const response = await fetch(`${BASE_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: trimmedName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create event: ${errorData.msg || response.statusText || 'Unknown error'}`);
      }

      const newEvent = await response.json() as Event;
      console.log('New event created:', newEvent);
      setEvents((prev) => [...prev, newEvent]);
      setEventDropdownVisible(false);
      setForm((prev) => ({ ...prev, event_name: trimmedName }));
      setError("");
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleCreateTransaction = async () => {
    setError("");  // Clear any previous errors
    const trimmedPersonName = form.person_name.trim();
    const trimmedEventName = form.event_name.trim();
    const amount = parseFloat(form.amount);

    // Validate inputs
    if (!trimmedPersonName) {
      setError("Person name is required");
      return;
    }
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setError("Invalid amount");
      return;
    }
    if (!form.reason.trim()) {
      setError("Reason is required");
      return;
    }
    const dateErr = validateDate(form.due_date);
    if (dateErr) {
      setError(dateErr);
      return;
    }

    const createTransaction = async (personId: number, eventId: number | null): Promise<{ transaction_id?: number; msg?: string }> => {
      try {
        console.log('Creating transaction with:', { personId, eventId });
        const transactionData = {
          person_id: personId,
          event_id: eventId,
          amount,
          paid_amount: 0.0,
          reason: form.reason.trim(),
          due_date: form.due_date,
          status: false,
        };
      
        console.log('Sending transaction:', transactionData);
        
        // Make sure the request is going to the correct endpoint
        const url = `${BASE_URL}/api/transactions`;
        console.log('Request URL:', url);

        const response = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(transactionData),
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`Failed to create transaction: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        console.error('Error in createTransaction:', error);
        throw error;
      }
    };

    try {
      // Find person (should already exist from handleAddPerson)
      const currentPerson = people.find(
        (p) => p.person_name.toLowerCase() === trimmedPersonName.toLowerCase()
      );

      if (!currentPerson) {
        throw new Error('Person not found. Please use the "+" button to create a new person first.');
      }

      // Find event (should already exist from handleAddEvent if one was specified)
      let currentEvent: Event | null = null;
      if (trimmedEventName) {
        currentEvent = events.find(
          (e) => e.event_name.toLowerCase() === trimmedEventName.toLowerCase()
        ) || null;

        if (!currentEvent) {
          throw new Error('Event not found. Please use the "+" button to create a new event first.');
        }
      }

      // Create the transaction
      const transactionData = {
        person_id: currentPerson.person_id,
        event_id: currentEvent?.event_id ?? null,
        amount: parseFloat(form.amount),
        reason: form.reason.trim(),
        due_date: form.due_date,
        status: false,
        paid_amount: 0.0
      };

    // Removed duplicate transaction creation code
    // Now calling handleCreateTransaction directly from the submit handler      // Create the transaction
      console.log('Creating transaction with:', {
        person_id: currentPerson.person_id,
        event_id: currentEvent?.event_id ?? null,
        amount,
        reason: form.reason.trim(),
        due_date: form.due_date
      });
      
      const transactionResponse = await createTransaction(
        currentPerson.person_id,
        currentEvent?.event_id ?? null
      );

      if (!transactionResponse.transaction_id) {
        throw new Error(transactionResponse.msg || 'Failed to create transaction: No transaction ID returned');
      }

      console.log('Transaction created successfully:', transactionResponse);

      // Success - close modal and reset form
      setModalVisible(false);
      setForm({ person_name: "", event_name: "", amount: "", reason: "", due_date: "" });

      // Refresh transactions
      const transactionsResponse = await fetch(`${BASE_URL}/api/transactions`);
      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`);
      }
      const transactions = await transactionsResponse.json();
      setTransactions(transactions);

    } catch (err: unknown) {
      console.error('Error:', err);
      let errorMessage = 'Failed to create transaction';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error('Error message:', errorMessage);
      setError(errorMessage);

      // Clear form if there was an error
      setModalVisible(false);
      setForm({ person_name: "", event_name: "", amount: "", reason: "", due_date: "" });
    }
  };

  const handleMarkAsPaid = (id: number) => {
  fetch(`${BASE_URL}/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: true }),
    })
      .then((res) => {
        console.log(`PATCH /api/transactions/${id} status:`, res.status);
        return res.json();
      })
      .then((data) => {
        console.log(`PATCH response for transaction ${id}:`, data);
        // Refetch transactions from API
        fetch(`${BASE_URL}/api/transactions`)
          .then((res) => res.json())
          .then((data) => setTransactions(data));
      });
  };

  const handlePartialPayment = () => {
    if (!selectedTransactionId) return;

    const amount = parseFloat(partialPaymentAmount);
    const transaction = transactions.find(
      (t) => t.transaction_id === selectedTransactionId
    );

    if (!transaction) {
      setPartialPaymentError("Transaction not found");
      return;
    }

    if (!partialPaymentAmount || isNaN(amount) || amount <= 0) {
      setPartialPaymentError("Invalid amount");
      return;
    }

    if (amount > transaction.amount - transaction.paid_amount) {
      setPartialPaymentError("Payment exceeds pending amount");
      return;
    }

  fetch(`${BASE_URL}/api/transactions/${selectedTransactionId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then(() => {
        setPartialPaymentModalVisible(false);
        // Refetch transactions from API
  fetch(`${BASE_URL}/api/transactions`)
          .then((res) => res.json())
          .then((data) => setTransactions(data));
      });
  };

  const openPartialPaymentModal = (id: number) => {
    setSelectedTransactionId(id);
    setPartialPaymentModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    if (item.status) return null; // Don't render paid transactions
    
    return (
      <View style={styles.transactionCard}>
        <Text style={styles.transactionText}>Person: {item.person_name}</Text>
        <Text style={styles.transactionText}>Event: {item.event_name}</Text>
        <Text style={styles.transactionText}>
          Amount: ${item.amount.toFixed(2)}
        </Text>
        <Text style={styles.transactionText}>
          Pending: ${(item.amount - item.paid_amount).toFixed(2)}
        </Text>
        <Text style={styles.transactionText}>Reason: {item.reason}</Text>
        <Text style={styles.transactionText}>Due: {item.due_date}</Text>
        <Text style={styles.transactionText}>Status: Pending</Text>
        <View style={styles.transactionButtons}>
          <TouchableOpacity
            style={styles.markPaidButton}
            onPress={() => handleMarkAsPaid(item.transaction_id)}
            accessibilityLabel={`Mark transaction for ${item.person_name} as paid`}
          >
            <Text style={styles.buttonText}>Mark as Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.partialPaymentButton}
            onPress={() => openPartialPaymentModal(item.transaction_id)}
            accessibilityLabel={`Mark partial payment for ${item.person_name}`}
          >
            <Text style={styles.buttonText}>Mark Partial Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isSubmitDisabled =
    !form.person_name.trim() ||
    !form.amount ||
    isNaN(Number(form.amount)) ||
    Number(form.amount) <= 0 ||
    !form.reason.trim() ||
    !form.due_date ||
    validateDate(form.due_date) !== "";

  const isPartialPaymentSubmitDisabled =
    !partialPaymentAmount ||
    isNaN(Number(partialPaymentAmount)) ||
    Number(partialPaymentAmount) <= 0;

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    if (filterBy === 'person' && selectedPersonFilter) {
      return transaction.person_name.toLowerCase().includes(selectedPersonFilter.toLowerCase());
    }
    if (filterBy === 'event' && selectedEventFilter) {
      return transaction.event_name.toLowerCase().includes(selectedEventFilter.toLowerCase());
    }
    return true; // 'all' or no specific filter
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id.toString()}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>Pending Transactions</Text>
            
            {/* Filter Controls */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by:</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterButton, filterBy === 'all' && styles.activeFilterButton]}
                  onPress={() => {
                    setFilterBy('all');
                    setSelectedPersonFilter('');
                    setSelectedEventFilter('');
                  }}
                >
                  <Text style={[styles.filterButtonText, filterBy === 'all' && styles.activeFilterButtonText]}>All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.filterButton, filterBy === 'person' && styles.activeFilterButton]}
                  onPress={() => setFilterBy('person')}
                >
                  <Text style={[styles.filterButtonText, filterBy === 'person' && styles.activeFilterButtonText]}>Person</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.filterButton, filterBy === 'event' && styles.activeFilterButton]}
                  onPress={() => setFilterBy('event')}
                >
                  <Text style={[styles.filterButtonText, filterBy === 'event' && styles.activeFilterButtonText]}>Event</Text>
                </TouchableOpacity>
              </View>
              
              {filterBy === 'person' && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by person name..."
                    value={selectedPersonFilter}
                    onChangeText={setSelectedPersonFilter}
                  />
                </View>
              )}
              
              {filterBy === 'event' && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by event name..."
                    value={selectedEventFilter}
                    onChangeText={setSelectedEventFilter}
                  />
                </View>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending transactions</Text>
        }
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={10}
        removeClippedSubviews={true}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push("/mockdata")}
          accessibilityLabel="View transaction history"
        >
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Open form to add new transaction"
        >
          <Text style={styles.buttonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback
          onPress={() => {
            setPersonDropdownVisible(false);
            setEventDropdownVisible(false);
          }}
        >
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Transaction</Text>


              {/* Person Input and Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.inputLabel}>Select or Add Person</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type person name"
                  placeholderTextColor="#999"
                  value={form.person_name}
                  onChangeText={(text) => {
                    setForm(prev => ({ ...prev, person_name: text }));
                    setPersonDropdownVisible(true);
                  }}
                  onFocus={() => setPersonDropdownVisible(true)}
                />
                {personDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {Array.isArray(people) && people
                        .filter(p => p.person_name.toLowerCase().includes(form.person_name.toLowerCase()))
                        .map((p) => (
                          <TouchableOpacity
                            key={p.person_id}
                            onPress={() => {
                              console.log('Setting person:', p.person_name);
                              setForm(prevForm => ({
                                ...prevForm,
                                person_name: p.person_name
                              }));
                              setPersonDropdownVisible(false);
                              setError("");
                            }}
                            accessibilityLabel={`Select person ${p.person_name}`}
                          >
                            <Text style={styles.dropdownItem}>{p.person_name}</Text>
                          </TouchableOpacity>
                        ))
                      }
                      {form.person_name && !people.find(p => p.person_name.toLowerCase() === form.person_name.toLowerCase()) && (
                        <TouchableOpacity
                          onPress={handleAddPerson}
                          accessibilityLabel="Add new person"
                        >
                          <Text style={[styles.dropdownItem, styles.addNew]}>+ Add "{form.person_name}" as new person</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Event Input and Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.inputLabel}>Select or Add Event</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type event name"
                  placeholderTextColor="#999"
                  value={form.event_name}
                  onChangeText={(text) => {
                    setForm(prev => ({ ...prev, event_name: text }));
                    setEventDropdownVisible(true);
                  }}
                  onFocus={() => setEventDropdownVisible(true)}
                />
                {eventDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {Array.isArray(events) && events
                        .filter(e => e.event_name.toLowerCase().includes(form.event_name.toLowerCase()))
                        .map((e) => (
                          <TouchableOpacity
                            key={e.event_id}
                            onPress={() => {
                              setForm(prevForm => ({
                                ...prevForm,
                                event_name: e.event_name
                              }));
                              setEventDropdownVisible(false);
                              setError("");
                            }}
                            accessibilityLabel={`Select event ${e.event_name}`}
                          >
                            <Text style={styles.dropdownItem}>{e.event_name}</Text>
                          </TouchableOpacity>
                        ))
                      }
                      {form.event_name && !events.find(e => e.event_name.toLowerCase() === form.event_name.toLowerCase()) && (
                        <TouchableOpacity
                          onPress={handleAddEvent}
                          accessibilityLabel="Add new event"
                        >
                          <Text style={[styles.dropdownItem, styles.addNew]}>+ Add "{form.event_name}" as new event</Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Amount Input */}
              <TextInput
                style={styles.input}
                placeholder="Amount"
                placeholderTextColor="#999"
                value={form.amount}
                onChangeText={(text) => {
                  // Only allow numbers and one decimal point
                  const cleanedText = text.replace(/[^0-9.]/g, '');
                  const parts = cleanedText.split('.');
                  let formattedText = cleanedText;
                  if (parts.length > 2) {
                    formattedText = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setForm({ ...form, amount: formattedText });
                  setError("");
                }}
                keyboardType="numeric"
                accessibilityLabel="Enter transaction amount"
              />

              {/* Reason Input */}
              <TextInput
                style={styles.input}
                placeholder="Reason"
                placeholderTextColor="#999"
                value={form.reason}
                onChangeText={(text) => setForm({ ...form, reason: text })}
                accessibilityLabel="Enter transaction reason"
              />

              {/* Due Date Input */}
              <TextInput
                style={styles.input}
                placeholder="Due Date (DD-MM-YYYY)"
                placeholderTextColor="#999"
                value={form.due_date}
                onChangeText={(text) => {
                  setForm({ ...form, due_date: text });
                  setError("");
                }}
                accessibilityLabel="Enter transaction due date"
              />




              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitDisabled && styles.disabledButton,
                  ]}
                  disabled={isSubmitDisabled}
                  onPress={handleCreateTransaction}
                  accessibilityLabel="Submit new transaction"
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                  accessibilityLabel="Cancel adding new transaction"
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Partial Payment Modal */}
      <Modal
        visible={partialPaymentModalVisible}
        animationType="slide"
        transparent={true}
      >
        <TouchableWithoutFeedback
          onPress={() => setPartialPaymentModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Partial Payment</Text>
              <TextInput
                style={styles.input}
                placeholder="Payment Amount"
                placeholderTextColor="#999"
                value={partialPaymentAmount}
                onChangeText={(text) => {
                  // Only allow numbers and one decimal point
                  const cleanedText = text.replace(/[^0-9.]/g, '');
                  const parts = cleanedText.split('.');
                  let formattedText = cleanedText;
                  if (parts.length > 2) {
                    formattedText = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setPartialPaymentAmount(formattedText);
                  setPartialPaymentError("");
                }}
                keyboardType="numeric"
                accessibilityLabel="Enter partial payment amount"
              />
              {partialPaymentError ? (
                <Text style={styles.error}>{partialPaymentError}</Text>
              ) : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isPartialPaymentSubmitDisabled && styles.disabledButton,
                  ]}
                  disabled={isPartialPaymentSubmitDisabled}
                  onPress={handlePartialPayment}
                  accessibilityLabel="Submit partial payment"
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPartialPaymentModalVisible(false)}
                  accessibilityLabel="Cancel partial payment"
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
    marginTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A3C6E",
    marginBottom: 12,
    textAlign: "left",
  },
  flatListContent: {
    paddingBottom: 100,
    width: "100%",
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionText: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
    textAlign: "left",
  },
  transactionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  markPaidButton: {
    backgroundColor: "#28A745",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  partialPaymentButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "95%",
    maxWidth: 360,
    alignSelf: "center",
    flexShrink: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A3C6E",
    marginBottom: 12,
    textAlign: "left",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginVertical: 6,
    fontSize: 15,
    color: "#333",
    width: "100%",
    backgroundColor: "#F8F9FA",
    height: 40,
    justifyContent: "center",
  },
  inputText: {
    color: "#333",
    fontSize: 15,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownContainer: {
    width: "100%",
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 6,
    width: "100%",
    maxHeight: 120,
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownItem: {
    padding: 10,
    fontSize: 14,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
    textAlign: "left",
  },
  addNew: {
    color: "#007BFF",
    fontWeight: "600",
  },
  error: {
    color: "#DC3545",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 6,
    textAlign: "left",
  },
  modalButtons: {
    flexDirection: "column",
    marginTop: 16,
    width: "100%",
    gap: 8,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#6C757D",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#6C757D",
    textAlign: "left",
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    width: "100%",
  },
  historyButton: {
    backgroundColor: "#6C757D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  filterContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CED4DA",
    flex: 1,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#007BFF",
    borderColor: "#007BFF",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#495057",
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  searchContainer: {
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FFFFFF",
  },
});

export default Dashboard;