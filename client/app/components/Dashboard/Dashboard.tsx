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

// Try to import DateTimePicker, fallback to null if not available
let DateTimePicker: any = null;
let datePickerAvailable = false;

try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
  datePickerAvailable = true;
  console.log("DateTimePicker loaded successfully");
} catch (error) {
  console.warn("DateTimePicker not available, using fallback");
  datePickerAvailable = false;
}

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
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Mark as paid animation states
  const [markingAsPaid, setMarkingAsPaid] = useState<Set<number>>(new Set());
  const [recentlyPaid, setRecentlyPaid] = useState<Set<number>>(new Set());

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
    setShowDatePicker(false);
    setSelectedDate(new Date());
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

  // Handle date picker change
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false); // Close picker on Android after selection
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      setSelectedDate(selectedDate);
      // Format date as DD-MM-YYYY
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear().toString();
      const formattedDate = `${day}-${month}-${year}`;
      
      setForm(prev => ({ ...prev, due_date: formattedDate }));
      setError("");
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  // Show date picker or fallback to quick date selection
  const showDatepicker = () => {
    console.log("Attempting to show date picker, available:", datePickerAvailable);
    
    try {
      if (DateTimePicker && datePickerAvailable) {
        console.log("Opening native date picker");
        setShowDatePicker(true);
      } else {
        console.log("Using fallback date selection");
        // Fallback: set tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onDateChange({ type: 'set' }, tomorrow);
      }
    } catch (error) {
      console.warn("DateTimePicker error:", error);
      // If there's an error, fall back to tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      onDateChange({ type: 'set' }, tomorrow);
    }
  };

  // Extended quick date options including months
  const getQuickDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const formattedDate = `${day}-${month}-${year}`;
      
      options.push({
        label: i === 1 ? 'Tomorrow' : `${i} days`,
        value: formattedDate,
        date: date
      });
    }
    
    // Weeks
    for (let i = 2; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i * 7));
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const formattedDate = `${day}-${month}-${year}`;
      
      options.push({
        label: `${i} weeks`,
        value: formattedDate,
        date: date
      });
    }
    
    // Months
    for (let i = 1; i <= 6; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() + i);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const formattedDate = `${day}-${month}-${year}`;
      
      options.push({
        label: `${i} month${i > 1 ? 's' : ''}`,
        value: formattedDate,
        date: date
      });
    }
    
    return options;
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

  const handleMarkAsPaid = async (id: number) => {
    try {
      // Add to marking state to show loading/tick animation
      setMarkingAsPaid(prev => new Set(prev).add(id));
      
      const response = await fetch(`${BASE_URL}/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: true }),
      });
      
      console.log(`PATCH /api/transactions/${id} status:`, response.status);
      const data = await response.json();
      console.log(`PATCH response for transaction ${id}:`, data);
      
      if (response.ok) {
        // Add to recently paid to show tick mark
        setRecentlyPaid(prev => new Set(prev).add(id));
        
        // Remove from marking state
        setMarkingAsPaid(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        // Show tick mark for 2 seconds before removing the transaction
        setTimeout(() => {
          // Refetch transactions from API to remove the paid transaction
          fetch(`${BASE_URL}/api/transactions`)
            .then((res) => res.json())
            .then((data) => {
              setTransactions(data);
              // Clean up the recently paid state
              setRecentlyPaid(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            });
        }, 2000);
      } else {
        // Remove from marking state on error
        setMarkingAsPaid(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        throw new Error('Failed to mark as paid');
      }
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
      // Remove from marking state on error
      setMarkingAsPaid(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handlePartialPayment = async () => {
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

    try {
      // Add to marking state for visual feedback
      setMarkingAsPaid(prev => new Set(prev).add(selectedTransactionId));

      const response = await fetch(`${BASE_URL}/api/transactions/${selectedTransactionId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setPartialPaymentModalVisible(false);
        
        // Remove from marking state
        setMarkingAsPaid(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedTransactionId);
          return newSet;
        });
        
        // If this payment completes the transaction, show tick mark
        const newPaidAmount = transaction.paid_amount + amount;
        if (newPaidAmount >= transaction.amount) {
          setRecentlyPaid(prev => new Set(prev).add(selectedTransactionId));
          setTimeout(() => {
            // Refetch transactions and clean up
            fetch(`${BASE_URL}/api/transactions`)
              .then((res) => res.json())
              .then((data) => {
                setTransactions(data);
                setRecentlyPaid(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(selectedTransactionId);
                  return newSet;
                });
              });
          }, 2000);
        } else {
          // Just refetch to update the amount
          fetch(`${BASE_URL}/api/transactions`)
            .then((res) => res.json())
            .then((data) => setTransactions(data));
        }
      } else {
        setPartialPaymentError("Failed to process payment");
        setMarkingAsPaid(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedTransactionId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error processing partial payment:', error);
      setPartialPaymentError("Network error occurred");
      setMarkingAsPaid(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedTransactionId);
        return newSet;
      });
    }
  };

  const openPartialPaymentModal = (id: number) => {
    setSelectedTransactionId(id);
    setPartialPaymentModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    if (item.status && !recentlyPaid.has(item.transaction_id)) return null; // Don't render paid transactions unless recently paid
    
    const isMarkingAsPaid = markingAsPaid.has(item.transaction_id);
    const isRecentlyPaid = recentlyPaid.has(item.transaction_id);
    
    return (
      <View style={[
        styles.transactionCard,
        isRecentlyPaid && styles.paidTransactionCard
      ]}>
        {/* Tick mark overlay for recently paid transactions */}
        {isRecentlyPaid && (
          <View style={styles.tickMarkOverlay}>
            <View style={styles.tickMarkContainer}>
              <Text style={styles.tickMark}>✅</Text>
              <Text style={styles.paidText}>PAID!</Text>
            </View>
          </View>
        )}
        
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Person: {item.person_name}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Event: {item.event_name}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Amount: ${item.amount.toFixed(2)}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Pending: ${(item.amount - item.paid_amount).toFixed(2)}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Reason: {item.reason}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Due: {item.due_date}
        </Text>
        <Text style={[styles.transactionText, isRecentlyPaid && styles.paidTransactionText]}>
          Status: {isRecentlyPaid ? 'Paid' : 'Pending'}
        </Text>
        
        {!isRecentlyPaid && (
          <View style={styles.transactionButtons}>
            <TouchableOpacity
              style={[
                styles.markPaidButton,
                isMarkingAsPaid && styles.markPaidButtonLoading
              ]}
              onPress={() => handleMarkAsPaid(item.transaction_id)}
              accessibilityLabel={`Mark transaction for ${item.person_name} as paid`}
              disabled={isMarkingAsPaid}
            >
              <Text style={styles.buttonText}>
                {isMarkingAsPaid ? 'Marking...' : 'Mark as Paid'}
              </Text>
              {isMarkingAsPaid && (
                <Text style={styles.loadingSpinner}>⏳</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.partialPaymentButton,
                isMarkingAsPaid && styles.partialPaymentButtonLoading
              ]}
              onPress={() => openPartialPaymentModal(item.transaction_id)}
              accessibilityLabel={`Mark partial payment for ${item.person_name}`}
              disabled={isMarkingAsPaid}
            >
              <Text style={styles.buttonText}>
                {isMarkingAsPaid ? 'Processing...' : 'Mark Partial Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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

              {/* Due Date Input with Date Picker */}
              <View style={styles.dateInputContainer}>
                <Text style={styles.inputLabel}>Due Date</Text>
                <View style={styles.dateInputRow}>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="Due Date (DD-MM-YYYY)"
                    placeholderTextColor="#999"
                    value={form.due_date}
                    onChangeText={(text) => {
                      setForm({ ...form, due_date: text });
                      setError("");
                    }}
                    accessibilityLabel="Enter transaction due date"
                  />
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      !datePickerAvailable && styles.datePickerButtonDisabled
                    ]}
                    onPress={showDatepicker}
                    accessibilityLabel="Open calendar to select date"
                  >
                    <Text style={styles.datePickerButtonText}>
                      {datePickerAvailable ? '📅' : '📝'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Show status message */}
                <Text style={styles.datePickerStatus}>
                  {datePickerAvailable 
                    ? "Tap 📅 for calendar or select from options below" 
                    : "Calendar not available - use quick select or type manually"}
                </Text>
                
                {/* Quick date options - always show for convenience */}
                <View style={styles.quickDateContainer}>
                  <Text style={styles.quickDateLabel}>Quick select:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.quickDateOptions}>
                      {getQuickDateOptions().map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.quickDateButton}
                          onPress={() => {
                            setForm(prev => ({ ...prev, due_date: option.value }));
                            setSelectedDate(option.date);
                            setError("");
                          }}
                        >
                          <Text style={styles.quickDateButtonText}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()} // Prevent selecting past dates
                />
              )}




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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
  dateInputContainer: {
    width: "100%",
    marginVertical: 6,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  datePickerButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    height: 40,
  },
  datePickerButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  quickDateContainer: {
    marginTop: 8,
  },
  quickDateLabel: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 4,
  },
  quickDateOptions: {
    flexDirection: "row",
    gap: 8,
  },
  quickDateButton: {
    backgroundColor: "#F8F9FA",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  quickDateButtonText: {
    fontSize: 12,
    color: "#495057",
    fontWeight: "500",
  },
  datePickerButtonDisabled: {
    backgroundColor: "#6C757D",
  },
  datePickerStatus: {
    fontSize: 11,
    color: "#6C757D",
    marginTop: 4,
    fontStyle: "italic",
  },
  // Tick mark animation styles
  paidTransactionCard: {
    backgroundColor: "#D4EDDA",
    borderColor: "#28A745",
    borderWidth: 2,
  },
  tickMarkOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    zIndex: 1,
  },
  tickMarkContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tickMark: {
    fontSize: 48,
    marginBottom: 8,
  },
  paidText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28A745",
    textAlign: "center",
  },
  paidTransactionText: {
    color: "#155724",
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  markPaidButtonLoading: {
    backgroundColor: "#6C757D",
    opacity: 0.7,
  },
  loadingSpinner: {
    marginLeft: 8,
    fontSize: 16,
  },
  partialPaymentButtonLoading: {
    backgroundColor: "#DC8500",
    opacity: 0.7,
  },
});

export default Dashboard;