
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import History from "./components/History/History";
import config from "./config";

export default function MockDataPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${config.BACKEND_URL}/api/transactions`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching transactions (history):", err);
        setError(`Failed to fetch transactions: ${err.message}`);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <View>
      <History transactions={[]} />
      <Text>Loading...</Text>
    </View>
  );
  if (error) return (
    <View>
      <History transactions={[]} />
      <Text>{error}</Text>
    </View>
  );
  return <History transactions={transactions} />;
}
