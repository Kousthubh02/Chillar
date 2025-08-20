import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { router } from "expo-router";

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
  created_date?: string;
}

interface HistoryProps {
  transactions: Transaction[];
}

const History: React.FC<HistoryProps> = ({ transactions }) => {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed' | 'partial'>('all');
  const [filterBy, setFilterBy] = React.useState<'status' | 'person' | 'event'>('status');
  const [selectedPersonFilter, setSelectedPersonFilter] = React.useState<string>('');
  const [selectedEventFilter, setSelectedEventFilter] = React.useState<string>('');

  const filteredTransactions = transactions.filter(transaction => {
    // First apply status filter if filterBy is 'status'
    if (filterBy === 'status') {
      if (filter === 'pending') return !transaction.status && transaction.paid_amount === 0;
      if (filter === 'completed') return transaction.status;
      if (filter === 'partial') return !transaction.status && transaction.paid_amount > 0;
      return true; // 'all'
    }
    
    // Apply person/event filters
    if (filterBy === 'person' && selectedPersonFilter) {
      return transaction.person_name.toLowerCase().includes(selectedPersonFilter.toLowerCase());
    }
    if (filterBy === 'event' && selectedEventFilter) {
      return transaction.event_name.toLowerCase().includes(selectedEventFilter.toLowerCase());
    }
    
    return true; // default case
  });
  const renderHistoryItem = ({ item }: { item: Transaction }) => {
    const isPartiallyPaid = !item.status && item.paid_amount > 0;
    const isFullyPaid = item.status;
    const isPending = !item.status && item.paid_amount === 0;
    
    let statusText = "Pending";
    let statusColor = "#DC3545";
    let cardBorderColor = "transparent";
    
    if (isFullyPaid) {
      statusText = "Paid";
      statusColor = "#28A745";
    } else if (isPartiallyPaid) {
      statusText = "Partial";
      statusColor = "#FF9500";
      cardBorderColor = "#FF9500";
    }
    
    const remainingAmount = item.amount - item.paid_amount;
    const paymentProgress = (item.paid_amount / item.amount) * 100;

    return (
      <View style={[styles.historyCard, { borderLeftWidth: isPartiallyPaid ? 4 : 0, borderLeftColor: cardBorderColor }]}>
        <View style={styles.historyHeader}>
          <Text style={styles.personName}>{item.person_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        
        {isPartiallyPaid && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${paymentProgress}%`, backgroundColor: statusColor }]} />
            </View>
            <Text style={styles.progressText}>{paymentProgress.toFixed(1)}% paid</Text>
          </View>
        )}
        
        <View style={styles.historyDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Event:</Text> {item.event_name}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Original Amount:</Text> ${item.amount.toFixed(2)}
          </Text>
          {item.paid_amount > 0 && (
            <Text style={[styles.detailText, { color: isPartiallyPaid ? "#FF9500" : "#28A745" }]}>
              <Text style={styles.detailLabel}>Paid Amount:</Text> ${item.paid_amount.toFixed(2)}
            </Text>
          )}
          {!item.status && (
            <Text style={[styles.detailText, { color: isPartiallyPaid ? "#DC3545" : "#6C757D" }]}>
              <Text style={styles.detailLabel}>Remaining:</Text> ${remainingAmount.toFixed(2)}
            </Text>
          )}
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Reason:</Text> {item.reason}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Due Date:</Text> {item.due_date}
          </Text>
          {item.created_date && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Created:</Text> {item.created_date}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Sort by status (pending first), then by transaction_id (newest first)
    if (a.status !== b.status) {
      return a.status ? 1 : -1;
    }
    return b.transaction_id - a.transaction_id;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back to dashboard"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{transactions.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{transactions.filter(t => !t.status && t.paid_amount === 0).length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{transactions.filter(t => !t.status && t.paid_amount > 0).length}</Text>
          <Text style={styles.summaryLabel}>Partial</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{transactions.filter(t => t.status).length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {/* Filter Type Selection */}
        <View style={styles.filterTypeRow}>
          <TouchableOpacity
            style={[styles.filterTypeButton, filterBy === 'status' && styles.activeFilterType]}
            onPress={() => {
              setFilterBy('status');
              setSelectedPersonFilter('');
              setSelectedEventFilter('');
            }}
          >
            <Text style={[styles.filterTypeText, filterBy === 'status' && styles.activeFilterTypeText]}>Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTypeButton, filterBy === 'person' && styles.activeFilterType]}
            onPress={() => {
              setFilterBy('person');
              setFilter('all');
            }}
          >
            <Text style={[styles.filterTypeText, filterBy === 'person' && styles.activeFilterTypeText]}>Person</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTypeButton, filterBy === 'event' && styles.activeFilterType]}
            onPress={() => {
              setFilterBy('event');
              setFilter('all');
            }}
          >
            <Text style={[styles.filterTypeText, filterBy === 'event' && styles.activeFilterTypeText]}>Event</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter (only show when filterBy is 'status') */}
        {filterBy === 'status' && (
          <>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>📄 All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
                onPress={() => setFilter('pending')}
              >
                <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>⏳ Pending</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.filterRow, { marginBottom: 0 }]}>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'partial' && styles.activeFilter]}
                onPress={() => setFilter('partial')}
              >
                <Text style={[styles.filterText, filter === 'partial' && styles.activeFilterText]}>🔄 Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
                onPress={() => setFilter('completed')}
              >
                <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>✅ Done</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Person Search Filter */}
        {filterBy === 'person' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search by person name..."
              value={selectedPersonFilter}
              onChangeText={setSelectedPersonFilter}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Event Search Filter */}
        {filterBy === 'event' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search by event name..."
              value={selectedEventFilter}
              onChangeText={setSelectedEventFilter}
              placeholderTextColor="#999"
            />
          </View>
        )}
      </View>

      <FlatList
        data={sortedTransactions}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.transaction_id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No transactions found' : 
               filter === 'pending' ? 'No pending transactions' : 
               filter === 'partial' ? 'No partial payments found' :
               'No completed transactions'}
            </Text>
            <Text style={styles.emptySubText}>
              {filter === 'all' ? 'Start by adding your first transaction!' : 
               filter === 'pending' ? 'All transactions have some payment!' : 
               filter === 'partial' ? 'No transactions have partial payments yet!' :
               'Complete some transactions to see them here!'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E5E9",
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A3C6E",
    flex: 1,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A3C6E",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "600",
  },
  summaryText: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "600",
    textAlign: "center",
  },
  flatListContent: {
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A3C6E",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  historyDetails: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#6C757D",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#ADB5BD",
    textAlign: "center",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    minHeight: 48, // Better touch target for mobile
  },
  activeFilter: {
    backgroundColor: "#007BFF",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C757D",
  },
  activeFilterText: {
    color: "#FFFFFF",
  },
  progressContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E9ECEF",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "600",
    textAlign: "right",
  },
  filterTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  filterTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  activeFilterType: {
    backgroundColor: "#28A745",
    borderColor: "#28A745",
  },
  filterTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
  },
  activeFilterTypeText: {
    color: "#FFFFFF",
  },
  searchContainer: {
    marginTop: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default History;
