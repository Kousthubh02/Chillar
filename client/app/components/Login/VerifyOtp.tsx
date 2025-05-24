import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import config from "../../config";

export default function VerifyOtp() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;
    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
    if (!text && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // New useEffect to watch otp array and trigger verifyOtp if filled
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === 6 && !otp.includes("")) {
      const timer = setTimeout(() => {
        verifyOtp();
      }, 100); // 100 ms delay
      return () => clearTimeout(timer); // cleanup on otp change
    }
  }, [otp]);
  
  
  const requestOtp = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`${config.BACKEND_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to send OTP");

      Alert.alert("Success", "OTP sent to your email");
      setOtpSent(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${config.BACKEND_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "OTP verification failed");

      Alert.alert("Success", "OTP verified. Proceeding to reset MPIN.");
      router.push({
        pathname: "/components/Login/ResetMpin",
        params: { email }, // Send only email
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Enter your email</Text>
      <TextInput
        style={styles.inputText}
        placeholder="john@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Pressable style={styles.button} onPress={requestOtp} disabled={otpSent || isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{otpSent ? "OTP Sent" : "Request OTP"}</Text>
        )}
      </Pressable>

      {otpSent && (
        <>
          <Text style={styles.text}>Enter OTP</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={otpRefs[idx]}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, idx)}
              />
            ))}
          </View>
          {/* <Pressable style={styles.button} onPress={verifyOtp} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </Pressable> */}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  text: { fontSize: 16, marginVertical: 8 },
  inputText: {
    width: 300,
    height: 50,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "pink",
    padding: 12,
    borderRadius: 5,
    width: 200,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: { fontSize: 18 },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  otpInput: {
    width: 40,
    height: 50,
    fontSize: 20,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "gray",
    borderRadius: 10,
    marginHorizontal: 4,
  },
});
