import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import config from '../../config'; 
export default function Mpin() {
  const [step, setStep] = useState(1);
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [confirmMpin, setConfirmMpin] = useState(['', '', '', '']);
  const { username, email } = useLocalSearchParams<{ username: string; email: string }>();

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleChange = (text: string, index: number, isConfirm: boolean) => {
    if (text.length > 1 || !/^\d*$/.test(text)) return;

    const updatedMpin = isConfirm ? [...confirmMpin] : [...mpin];
    updatedMpin[index] = text;

    if (isConfirm) {
      setConfirmMpin(updatedMpin);
    } else {
      setMpin(updatedMpin);
    }

    if (text && index < 3 && inputRefs[index + 1]?.current) {
      inputRefs[index + 1]?.current?.focus();
    }
    if (!text && index > 0 && inputRefs[index - 1]?.current) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const handleNext = () => {
    if (mpin.includes('') || mpin.join('').length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit MPIN');
      return;
    }
    setStep(2);
    setTimeout(() => {
      if (inputRefs[0]?.current) {
        inputRefs[0].current.focus();
      }
    }, 100);
  };

  const handleConfirm = async () => {
    if (confirmMpin.includes('') || confirmMpin.join('').length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit MPIN');
      return;
    }

    if (mpin.join('') === confirmMpin.join('')) {
      if (!username || !username.trim()) {
        Alert.alert('Error', 'Invalid username. Please go back and enter a valid username.');
        return;
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        Alert.alert('Error', 'Invalid email. Please go back and enter a valid email.');
        return;
      }

      try {
        const requestBody = { username, email, mPin: mpin.join('') };
        console.log('Sending to backend:',
          {body: requestBody });

        const response = await fetch(`${config.BACKEND_URL}/auth/signup`, {
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
          let errorMessage = 'Failed to register MPIN';
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
        Alert.alert(
          'Registration Successful!', 
          'Your account has been created successfully. You can now login with your email and MPIN.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                // Clear the form and redirect to login
                setMpin(['', '', '', '']);
                setConfirmMpin(['', '', '', '']);
                setStep(1);
                // Navigate to login page
                router.replace('/login');
              }
            }
          ]
        );
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Network request failed. Please check your server or network.');
        console.error('Network Error:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
    } else {
      Alert.alert('Error', 'MPIN does not match');
      setMpin(['', '', '', '']);
      setConfirmMpin(['', '', '', '']);
      setStep(1);
      setTimeout(() => {
        if (inputRefs[0]?.current) {
          inputRefs[0].current.focus();
        }
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{step === 1 ? 'Set MPIN' : 'Confirm MPIN'}</Text>
      <View style={styles.mpinContainer}>
        {(step === 1 ? mpin : confirmMpin).map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index, step === 2)}
            secureTextEntry={true}
          />
        ))}
      </View>
      <Pressable
        style={styles.button}
        onPress={step === 1 ? handleNext : handleConfirm}
      >
        <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Confirm'}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mpinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  input: {
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
  },
  buttonText: {
    fontSize: 20,
  },
});