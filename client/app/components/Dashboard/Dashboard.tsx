import React, { useState, useEffect, useCallback } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";

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
  name: string;
}

interface Event {
  event_id: number;
  name: string;
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
  { person_id: 1, name: "John Doe" },
  { person_id: 2, name: "Jane Smith" },
];

const mockEvents: Event[] = [
  { event_id: 1, name: "Birthday Party" },
  { event_id: 2, name: "Wedding" },
];

const Dashboard = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [partialPaymentModalVisible, setPartialPaymentModalVisible] =
    useState<boolean>(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    number | null
  >(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [partialPaymentError, setPartialPaymentError] = useState<string>("");
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [events, setEvents] = useState<Event[]>(mockEvents);
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
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

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

  const handleAddPerson = () => {
    const trimmedName = form.person_name.trim();
    if (!trimmedName) {
      setError("Person name is required");
      return;
    }
    if (
      people.find((p) => p.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Person already exists");
      return;
    }
    const newPerson: Person = { person_id: Date.now(), name: trimmedName };
    setPeople((prev) => [...prev, newPerson]);
    setPersonDropdownVisible(false);
    setForm({ ...form, person_name: trimmedName });
    setError("");
  };

  const handleAddEvent = () => {
    const trimmedName = form.event_name.trim();
    if (!trimmedName) {
      setError("Event name is required");
      return;
    }
    if (
      events.find((e) => e.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Event already exists");
      return;
    }
    const newEvent: Event = { event_id: Date.now(), name: trimmedName };
    setEvents((prev) => [...prev, newEvent]);
    setEventDropdownVisible(false);
    setForm({ ...form, event_name: trimmedName });
    setError("");
  };

  const handleCreateTransaction = () => {
    const trimmedPersonName = form.person_name.trim();
    const trimmedEventName = form.event_name.trim();
    const amount = parseFloat(form.amount);

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

    let person = people.find(
      (p) => p.name.toLowerCase() === trimmedPersonName.toLowerCase()
    );
    if (!person) {
      person = { person_id: Date.now(), name: trimmedPersonName };
      setPeople((prev) => [...prev, person]);
    }

    let event_id: number | null = null;
    let event_name = trimmedEventName || "N/A";
    let event: Event | undefined;
    if (trimmedEventName) {
      event = events.find(
        (e) => e.name.toLowerCase() === trimmedEventName.toLowerCase()
      );
      if (!event) {
        event = { event_id: Date.now(), name: trimmedEventName };
        setEvents((prev) => [...prev, event]);
      }
      event_id = event.event_id;
    }

    const newTx: Transaction = {
      transaction_id: Date.now(),
      person_id: person.person_id,
      person_name: person.name,
      event_id,
      event_name,
      amount,
      paid_amount: 0.0,
      reason: form.reason.trim(),
      due_date: form.due_date,
      status: false,
    };
    setTransactions((prev) => [...prev, newTx]);
    setModalVisible(false);
  };

  const handleMarkAsPaid = (id: number) => {
    setTransactions((txs) =>
      txs.map((t) => (t.transaction_id === id ? { ...t, status: true } : t))
    );
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

    setTransactions((txs) =>
      txs.map((t) =>
        t.transaction_id === selectedTransactionId
          ? {
              ...t,
              paid_amount: t.paid_amount + amount,
              status: t.paid_amount + amount >= t.amount,
            }
          : t
      )
    );
    setPartialPaymentModalVisible(false);
  };

  const openPartialPaymentModal = (id: number) => {
    setSelectedTransactionId(id);
    setPartialPaymentModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
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

  const isSubmitDisabled =
    !form.person_name.trim() ||
    !form.amount ||
    isNaN(Number(form.amount)) ||
    Number(form.amount) <= 0 ||
    !form.reason.trim() ||
    validateDate(form.due_date) !== "";

  const isPartialPaymentSubmitDisabled =
    !partialPaymentAmount ||
    isNaN(Number(partialPaymentAmount)) ||
    Number(partialPaymentAmount) <= 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions.filter((t) => !t.status)}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id.toString()}
        ListHeaderComponent={
          <Text style={styles.header}>Pending Transactions</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending transactions</Text>
        }
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={10}
        removeClippedSubviews={true}
      />

      <TouchableOpacity
        style={styles.openModalButton}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Open form to add new transaction"
      >
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback
          onPress={() => {
            setPersonDropdownVisible(false);
            setEventDropdownVisible(false);
            setShowDatePicker(false);
          }}
        >
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Transaction</Text>

              {/* Person Input and Dropdown */}
              <View style={styles.dropdownContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Select or Add Person"
                  placeholderTextColor="#999"
                  value={form.person_name}
                  onChangeText={(text) => {
                    setForm({ ...form, person_name: text });
                    setPersonDropdownVisible(true);
                    setError("");
                  }}
                  accessibilityLabel="Select or add person name"
                  onFocus={() => setPersonDropdownVisible(true)}
                />
                {personDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 120 }}>
                      {people
                        .filter((p) =>
                          p.name
                            .toLowerCase()
                            .startsWith(form.person_name.toLowerCase().trim())
                        )
                        .map((p) => (
                          <TouchableOpacity
                            key={p.person_id}
                            onPress={() => {
                              setForm({ ...form, person_name: p.name });
                              setPersonDropdownVisible(false);
                              setError("");
                            }}
                            accessibilityLabel={`Select person ${p.name}`}
                          >
                            <Text style={styles.dropdownItem}>{p.name}</Text>
                          </TouchableOpacity>
                        ))}
                      {form.person_name.trim() && (
                        <TouchableOpacity
                          onPress={handleAddPerson}
                          accessibilityLabel={`Add new person ${form.person_name}`}
                        >
                          <Text style={[styles.dropdownItem, styles.addNew]}>
                            + Add "{form.person_name.trim()}" as new person
                          </Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Event Input and Dropdown */}
              <View style={styles.dropdownContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Select or Add Event (optional)"
                  placeholderTextColor="#999"
                  value={form.event_name}
                  onChangeText={(text) => {
                    setForm({ ...form, event_name: text });
                    setEventDropdownVisible(true);
                    setError("");
                  }}
                  accessibilityLabel="Select or add event name"
                  onFocus={() => setEventDropdownVisible(true)}
                />
                {eventDropdownVisible && (
                  <View style={styles.dropdown}>
                    <ScrollView style={{ maxHeight: 120 }}>
                      {events
                        .filter((e) =>
                          e.name
                            .toLowerCase()
                            .startsWith(form.event_name.toLowerCase().trim())
                        )
                        .map((e) => (
                          <TouchableOpacity
                            key={e.event_id}
                            onPress={() => {
                              setForm({ ...form, event_name: e.name });
                              setEventDropdownVisible(false);
                              setError("");
                            }}
                            accessibilityLabel={`Select event ${e.name}`}
                          >
                            <Text style={styles.dropdownItem}>{e.name}</Text>
                          </TouchableOpacity>
                        ))}
                      {form.event_name.trim() && (
                        <TouchableOpacity
                          onPress={handleAddEvent}
                          accessibilityLabel={`Add new event ${form.event_name}`}
                        >
                          <Text style={[styles.dropdownItem, styles.addNew]}>
                            + Add "{form.event_name.trim()}" as new event
                          </Text>
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
                onChangeText={(text) => setForm({ ...form, amount: text })}
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
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                accessibilityLabel="Select transaction due date"
              >
                <Text style={[styles.inputText, !form.due_date && styles.placeholderText]}>
                  {form.due_date || "Due Date (DD-MM-YYYY)"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.due_date ? new Date(form.due_date.split("-").reverse().join("-")) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      const formattedDate = `${String(selectedDate.getDate()).padStart(2, "0")}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${selectedDate.getFullYear()}`;
                      setForm({ ...form, due_date: formattedDate });
                      setError("");
                    }
                  }}
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
                  setPartialPaymentAmount(text);
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
  openModalButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
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
});

export default Dashboard;