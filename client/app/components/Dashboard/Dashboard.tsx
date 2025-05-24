import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Transaction {
  transaction_id: number;
  person_id: number;
  person_name: string;
  event_id: number | null;
  event_name: string;
  amount: number;
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
  { transaction_id: 1, person_id: 1, person_name: 'John Doe', event_id: 1, event_name: 'Birthday Party', amount: 50.0, reason: 'Food Contribution', due_date: '01-06-2025', status: false },
  { transaction_id: 2, person_id: 2, person_name: 'Jane Smith', event_id: 2, event_name: 'Wedding', amount: 100.0, reason: 'Gift', due_date: '01-07-2025', status: false },
];

const mockPeople: Person[] = [
  { person_id: 1, name: 'John Doe' },
  { person_id: 2, name: 'Jane Smith' },
];

const mockEvents: Event[] = [
  { event_id: 1, name: 'Birthday Party' },
  { event_id: 2, name: 'Wedding' },
];

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [form, setForm] = useState<FormState>({ 
    person_name: '', 
    event_name: '', 
    amount: '', 
    reason: '', 
    due_date: '' 
  });
  const [error, setError] = useState<string>('');
  const [personDropdownVisible, setPersonDropdownVisible] = useState<boolean>(false);
  const [eventDropdownVisible, setEventDropdownVisible] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const validateDate = (date: string): string => {
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(date)) return 'Enter date in DD-MM-YYYY format';
    const [d, m, y] = date.split('-').map(Number);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return 'Invalid date';
    return '';
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setForm({...form, due_date: formattedDate});
    }
  };

  const handleAddPerson = () => {
    if (!form.person_name) return setError('Person name required');
    if (people.find(p => p.name.toLowerCase() === form.person_name.toLowerCase())) 
      return setError('Person already exists');
    const newPerson: Person = { person_id: Date.now(), name: form.person_name };
    setPeople([...people, newPerson]);
    setPersonDropdownVisible(false);
    setError('');
  };

  const handleAddEvent = () => {
    if (!form.event_name) return setError('Event name required');
    if (events.find(e => e.name.toLowerCase() === form.event_name.toLowerCase())) 
      return setError('Event already exists');
    const newEvent: Event = { event_id: Date.now(), name: form.event_name };
    setEvents([...events, newEvent]);
    setEventDropdownVisible(false);
    setError('');
  };

  const handleCreateTransaction = () => {
    if (!form.person_name) return setError('Person required');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) 
      return setError('Invalid amount');
    if (!form.reason) return setError('Reason required');
    const dateErr = validateDate(form.due_date);
    if (dateErr) return setError(dateErr);

    let person = people.find(p => p.name.toLowerCase() === form.person_name.toLowerCase());
    if (!person) {
      person = { person_id: Date.now(), name: form.person_name };
      setPeople([...people, person]);
    }

    let event_id = null;
    let event_name = form.event_name || 'N/A';
    if (form.event_name) {
      let event = events.find(e => e.name.toLowerCase() === form.event_name.toLowerCase());
      if (!event) {
        event = { event_id: Date.now(), name: form.event_name };
        setEvents([...events, event]);
      }
      event_id = event.event_id;
    }

    const newTx: Transaction = {
      transaction_id: Date.now(),
      person_id: person.person_id,
      person_name: person.name,
      event_id,
      event_name,
      amount: parseFloat(form.amount),
      reason: form.reason,
      due_date: form.due_date,
      status: false,
    };
    setTransactions([...transactions, newTx]);
    setModalVisible(false);
    setForm({ person_name: '', event_name: '', amount: '', reason: '', due_date: '' });
    setError('');
  };

  const handleMarkAsPaid = (id: number) => {
    setTransactions(txs => txs.filter(t => t.transaction_id !== id));
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <Text style={styles.transactionText}>Person: {item.person_name}</Text>
      <Text style={styles.transactionText}>Event: {item.event_name}</Text>
      <Text style={styles.transactionText}>Amount: ${item.amount.toFixed(2)}</Text>
      <Text style={styles.transactionText}>Reason: {item.reason}</Text>
      <Text style={styles.transactionText}>Due: {item.due_date}</Text>
      <TouchableOpacity style={styles.markPaidButton} onPress={() => handleMarkAsPaid(item.transaction_id)}>
        <Text style={styles.buttonText}>Mark as Paid</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.transaction_id.toString()}
        ListHeaderComponent={<Text style={styles.header}>Pending Transactions</Text>}
      />
    
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.buttonText}>➕ New Transaction</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalHeader}>Create Transaction</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Person</Text>
          <TouchableOpacity style={styles.input} onPress={() => setPersonDropdownVisible(true)}>
            <Text style={styles.inputText}>{form.person_name || 'Select or enter name'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Event</Text>
          <TouchableOpacity style={styles.input} onPress={() => setEventDropdownVisible(true)}>
            <Text style={styles.inputText}>{form.event_name || 'Select or enter event'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.amount}
            onChangeText={text => setForm({ ...form, amount: text })}
          />

          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.input}
            value={form.reason}
            onChangeText={text => setForm({ ...form, reason: text })}
          />

          <Text style={styles.label}>Due Date (DD-MM-YYYY)</Text>
          <TouchableOpacity 
            style={styles.input} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {form.due_date || 'Select due date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={handleCreateTransaction}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setForm({ person_name: '', event_name: '', amount: '', reason: '', due_date: '' });
                setError('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Person Dropdown Modal */}
      <Modal visible={personDropdownVisible} animationType="slide" transparent>
        <View style={styles.dropdownModal}>
          <FlatList
            data={people}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setForm({ ...form, person_name: item.name });
                  setPersonDropdownVisible(false);
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.person_id.toString()}
          />
          <TextInput
            style={styles.input}
            placeholder="Add new person"
            value={form.person_name}
            onChangeText={text => setForm({ ...form, person_name: text })}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddPerson}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownCancelButton} onPress={() => setPersonDropdownVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Event Dropdown Modal */}
      <Modal visible={eventDropdownVisible} animationType="slide" transparent>
        <View style={styles.dropdownModal}>
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setForm({ ...form, event_name: item.name });
                  setEventDropdownVisible(false);
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.event_id.toString()}
          />
          <TextInput
            style={styles.input}
            placeholder="Add new event"
            value={form.event_name}
            onChangeText={text => setForm({ ...form, event_name: text })}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownCancelButton} onPress={() => setEventDropdownVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  bottomButtonContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  createButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', width: '60%' },
  buttonText: { color: '#fff', fontWeight: '600' },
  transactionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  transactionText: { fontSize: 16 },
  markPaidButton: { backgroundColor: '#34C759', padding: 10, borderRadius: 5, marginTop: 10, alignItems: 'center' },
  modalContainer: { padding: 20, backgroundColor: '#f5f5f5' },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600' },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 5, 
    padding: 10, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ccc',
    justifyContent: 'center',
    height: 44,
  },
  inputText: { color: '#333' },
  errorText: { color: '#FF3B30', textAlign: 'center', marginBottom: 10 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  submitButton: { backgroundColor: '#007AFF', flex: 1, padding: 15, borderRadius: 5, marginRight: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: '#FF3B30', flex: 1, padding: 15, borderRadius: 5, alignItems: 'center' },
  dropdownModal: { flex: 1, backgroundColor: 'white', padding: 20, justifyContent: 'center' },
  dropdownItem: { padding: 10, borderBottomColor: '#ccc', borderBottomWidth: 1 },
  addButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5, alignItems: 'center', marginVertical: 10 },
  dropdownCancelButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
});

export default Dashboard;