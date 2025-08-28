import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();
  
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

    setIsLoading(true);
    try {
      const mpinString = mpin.join('');
      console.log('Attempting login with:', { email, mPin: mpinString });

      const response = await fetch(`${config.BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, mPin: mpinString }),
      });

      const responseData = await response.json();
      console.log('Login response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.msg || 'Login failed');
      }

      const { access_token, refresh_token, msg } = responseData;
      
      if (access_token) {
        await authLogin(access_token, {
          id: 'user_id',
          email: email,
        });
        
        setEmail('');
        setMpin(['', '', '', '']);
        
        console.log('Login successful, AuthGuard will redirect to Dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Clear MPIN fields on login failure
      setMpin(['', '', '', '']);
      
      // Focus back to first MPIN input for easier retry
      setTimeout(() => {
        if (inputRefs[0]?.current) {
          inputRefs[0].current.focus();
        }
      }, 100);
      
      Alert.alert(
        'Login Failed', 
        error.message || 'Invalid credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Chillar</Text>
      
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
      
      <Pressable 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/components/Login/VerifyOtp')}>
        <Text style={styles.forgotLink}>Forgot MPIN?</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/register')}>
        <Text style={styles.registerLink}>Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputBox: {
    padding: 10,
    width: '100%',
  },
  mpinBox: {
    padding: 10,
    width: '100%',
  },
  inputText: {
    height: 50,
    width: '100%',
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
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
    borderColor: '#CED4DA',
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
    margin: 5,
  },
  disabledButton: {
    backgroundColor: '#6C757D',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  forgotLink: {
    marginTop: 15,
    color: '#007BFF',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  registerLink: {
    marginTop: 20,
    color: '#28A745',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontWeight: '500',
  },
  text: {
    fontSize: 16,
    margin: 3,
    color: '#495057',
    fontWeight: '500',
  },
});
