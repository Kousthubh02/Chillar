import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import config from '../../config'; // Adjust the path as necessary
export default function Login() {
  const [email, setEmail] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleChange = (text: string, index: number) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;

    const updatedMpin = [...mpin];
    updatedMpin[index] = text;
    setMpin(updatedMpin);

    if (text && index < 3 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1]?.current?.focus();
    }
    if (!text && index > 0 && inputRefs[index - 1]?.current) {
      if (inputRefs[index - 1]?.current) {
        inputRefs[index - 1]?.current?.focus();
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (mpin.includes('') || mpin.join('').length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit MPIN');
      return;
    }

    try {
      const requestBody = { email, mPin: mpin.join('') };
      const backendUrl = `${config.BACKEND_URL}/auth/login`; 
      console.log('Sending to backend:', {
        url: backendUrl,
        body: requestBody,
      });

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to login';
        try {
          const errorData = responseText ? JSON.parse(responseText) : {};
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          errorMessage = responseText || 'Invalid response from server';
        }
        throw new Error(errorMessage);
      }

      const responseData = responseText ? JSON.parse(responseText) : {};
      Alert.alert('Success', responseData.message || 'Login successful');
      setEmail('');
      setMpin(['', '', '', '']);
      // Navigate to a dashboard or home screen (adjust path as needed)
      router.replace('/components/Home/Homepage');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Network request failed. Please check your server or network.');
      console.error('Network Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        <Text style={styles.text}>Enter your email</Text>
        <TextInput
          placeholder="john@example.com"
          style={styles.inputText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.mpinBox}>
        <Text style={styles.text}>Enter your MPIN</Text>
        <View style={styles.mpinContainer}>
          {mpin.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={styles.mpinInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              secureTextEntry={true}
            />
          ))}
        </View>
      </View>
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/components/Login/VerifyOtp')}>
        <Text style={styles.forgotLink}>Forgot MPIN?</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotLink: {
    marginTop: 15,
    color: 'blue',
    textDecorationLine: 'underline'},
  inputBox: {
    padding: 10,
  },
  mpinBox: {
    padding: 10,
  },
  inputText: {
    height: 50,
    width: 300,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    margin: 2,
  },
  mpinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mpinInput: {
    width: 50,
    height: 50,
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: 'pink',
    padding: 10,
    borderRadius: 5,
    width: 200,
    alignItems: 'center',
    margin: 5,
  },
  buttonText: {
    fontSize: 20,
  },
  text: {
    fontSize: 15,
    margin: 3,
  },
});