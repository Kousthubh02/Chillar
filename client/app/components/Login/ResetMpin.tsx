import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useRef, useState, useEffect } from "react";
import config from "../../config";

export default function ResetMpin() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [confirmMpin, setConfirmMpin] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  const mpinRefs = Array.from({ length: 4 }, () => useRef<TextInput>(null));
  const confirmMpinRefs = Array.from({ length: 4 }, () => useRef<TextInput>(null));

  useEffect(() => {
    if (typeof params.email === "string" && params.email.includes("@")) {
      setEmail(params.email);
    } else {
      Alert.alert("Error", "Email not found. Please verify OTP again.");
      router.replace("/components/Login/VerifyOtp");
    }
  }, [params]);

  const handleMpinChange = (text: string, index: number) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;
    const updated = [...mpin];
    updated[index] = text;
    setMpin(updated);

    if (text && index < 3) {
      mpinRefs[index + 1].current?.focus();
    } else if (!text && index > 0) {
      mpinRefs[index - 1].current?.focus();
    }
  };

  const handleConfirmMpinChange = (text: string, index: number) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;
    const updated = [...confirmMpin];
    updated[index] = text;
    setConfirmMpin(updated);

    if (text && index < 3) {
      confirmMpinRefs[index + 1].current?.focus();
    } else if (!text && index > 0) {
      confirmMpinRefs[index - 1].current?.focus();
    }
  };

  const resetMpin = async () => {
    const mpinCode = mpin.join("");
    const confirmCode = confirmMpin.join("");

    if (mpinCode.length !== 4 || confirmCode.length !== 4) {
      Alert.alert("Error", "Please enter a 4-digit MPIN and confirm it");
      return;
    }

    if (mpinCode !== confirmCode) {
      Alert.alert("Error", "MPIN and Confirm MPIN do not match");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email is missing. Please restart the process.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${config.BACKEND_URL}/auth/reset-mpin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_mPin: mpinCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to reset MPIN");

      Alert.alert("Success", "MPIN reset successfully");
      router.replace("/components/Login/Login");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
      setMpin(["", "", "", ""]);
      setConfirmMpin(["", "", "", ""]);
      mpinRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter New 4-digit MPIN</Text>
      <View style={styles.mpinContainer}>
        {mpin.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={mpinRefs[idx]}
            style={styles.mpinInput}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            value={digit}
            onChangeText={(text) => handleMpinChange(text, idx)}
          />
        ))}
      </View>

      <Text style={styles.title}>Confirm New MPIN</Text>
      <View style={styles.mpinContainer}>
        {confirmMpin.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={confirmMpinRefs[idx]}
            style={styles.mpinInput}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            value={digit}
            onChangeText={(text) => handleConfirmMpinChange(text, idx)}
          />
        ))}
      </View>

      <Pressable style={styles.button} onPress={resetMpin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Reset MPIN</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  mpinInput: {
    width: 50,
    height: 50,
    fontSize: 24,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 10,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: "pink",
    padding: 12,
    borderRadius: 5,
    width: 200,
    alignItems: "center",
  },
  buttonText: { fontSize: 18 },
});
