import React from "react";
import History from "./components/History/History";

// Enhanced mock data with more comprehensive transaction history including partial payments
const mockTransactions = [
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
    created_date: "15-05-2025",
  },
  {
    transaction_id: 2,
    person_id: 2,
    person_name: "Jane Smith",
    event_id: 2,
    event_name: "Wedding",
    amount: 100.0,
    paid_amount: 50.0, // Partial payment
    reason: "Gift",
    due_date: "01-07-2025",
    status: false,
    created_date: "10-05-2025",
  },
  {
    transaction_id: 3,
    person_id: 3,
    person_name: "Mike Johnson",
    event_id: 3,
    event_name: "Office Party",
    amount: 75.0,
    paid_amount: 75.0, // Fully paid
    reason: "Decoration expenses",
    due_date: "20-05-2025",
    status: true,
    created_date: "05-05-2025",
  },
  {
    transaction_id: 4,
    person_id: 4,
    person_name: "Sarah Wilson",
    event_id: 4,
    event_name: "Baby Shower",
    amount: 80.0,
    paid_amount: 80.0, // Fully paid
    reason: "Baby gifts and cake",
    due_date: "25-04-2025",
    status: true,
    created_date: "01-04-2025",
  },
  {
    transaction_id: 5,
    person_id: 5,
    person_name: "Alex Brown",
    event_id: null,
    event_name: "N/A",
    amount: 30.0,
    paid_amount: 15.0, // Partial payment (50%)
    reason: "Lunch money",
    due_date: "30-05-2025",
    status: false,
    created_date: "20-05-2025",
  },
  {
    transaction_id: 6,
    person_id: 6,
    person_name: "Emma Davis",
    event_id: 5,
    event_name: "Graduation Party",
    amount: 120.0,
    paid_amount: 0.0, // Pending payment
    reason: "Venue booking contribution",
    due_date: "15-06-2025",
    status: false,
    created_date: "12-05-2025",
  },
  {
    transaction_id: 7,
    person_id: 7,
    person_name: "David Lee",
    event_id: 6,
    event_name: "Christmas Party",
    amount: 90.0,
    paid_amount: 25.0, // Partial payment (27.8%)
    reason: "Secret Santa gifts",
    due_date: "20-12-2025",
    status: false,
    created_date: "01-05-2025",
  },
  {
    transaction_id: 8,
    person_id: 8,
    person_name: "Lisa Garcia",
    event_id: 7,
    event_name: "Housewarming",
    amount: 60.0,
    paid_amount: 45.0, // Partial payment (75%)
    reason: "Home decor and snacks",
    due_date: "10-06-2025",
    status: false,
    created_date: "25-04-2025",
  },
];

export default function MockDataPage() {
  return <History transactions={mockTransactions} />;
}
