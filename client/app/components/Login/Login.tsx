import { View, Text, StyleSheet, Alert, TextInput, Pressable } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import config from '../../config';

// Try to import biometric modules, fallback if not available
let LocalAuthentication: any = null;
let SecureStore: any = null;
let biometricsAvailable = false;

try {
  LocalAuthentication = require('expo-local-authentication');
  SecureStore = require('expo-secure-store');
  biometricsAvailable = true;
  console.log('Biometric modules loaded successfully');
} catch (error) {
  console.warn('Biometric modules not available:', error);
  biometricsAvailable = false;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [mpin, setMpin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const { login: authLogin } = useAuth();
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (biometricsAvailable) {
      checkBiometricAvailability();
      checkStoredCredentials();
    }
  }, []);





  const requestBiometricPermissions = async (): Promise<boolean> => {
    try {
      // For most cases, no explicit permission request is needed for biometrics
      // The permission is requested automatically when authenticateAsync is called
      return true;
    } catch (error) {
      console.error('Error requesting biometric permissions:', error);
      return false;
    }
  };

  const checkBiometricAvailability = async () => {
    console.log('🔍 Checking biometric availability...');
    console.log('biometricsAvailable:', biometricsAvailable);
    console.log('LocalAuthentication:', !!LocalAuthentication);
    
    if (!biometricsAvailable || !LocalAuthentication) {
      console.log('❌ Biometric modules not available');
      setBiometricAvailable(false);
      return;
    }

    try {
      // First, request permissions
      console.log('� Requesting biometric permissions...');
      const hasPermission = await requestBiometricPermissions();
      
      if (!hasPermission) {
        console.log('❌ Biometric permissions not granted');
        setBiometricAvailable(false);
        return;
      }
      
      console.log('�🔐 Checking hardware and enrollment...');
      
      // Check if device has biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      console.log('Hardware available:', hasHardware);
      
      if (!hasHardware) {
        console.log('❌ No biometric hardware detected');
        setBiometricAvailable(false);
        Alert.alert(
          'Biometric Not Available',
          'Your device does not support biometric authentication.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if user has enrolled biometrics
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      console.log('User enrolled:', isEnrolled);
      
      if (!isEnrolled) {
        console.log('❌ No biometrics enrolled by user');
        setBiometricAvailable(false);
        Alert.alert(
          'Biometric Setup Required',
          'Please set up fingerprint or face recognition in your device settings to use biometric authentication.',
          [
            { text: 'Cancel' },
            { text: 'Open Settings', onPress: () => {
              // For Android, you could potentially open biometric settings
              console.log('User should go to device settings to set up biometrics');
            }}
          ]
        );
        return;
      }
      
      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('Supported types:', supportedTypes);
      
      // Check security level
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      console.log('Security level:', securityLevel);
      
      const isAvailable = hasHardware && isEnrolled;
      setBiometricAvailable(isAvailable);
      
      if (isAvailable) {
        const types = [];
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          types.push('Fingerprint');
        }
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          types.push('Face ID');
        }
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          types.push('Iris');
        }
        const biometricTypeString = types.join(' / ') || 'Biometric';
        setBiometricType(biometricTypeString);
        console.log('✅ Biometric available:', biometricTypeString);
        console.log('✅ Security level:', securityLevel);
        
        // Show success message
        Alert.alert(
          'Biometric Authentication Ready',
          `${biometricTypeString} authentication is now available for quick login.`,
          [{ text: 'Great!' }]
        );
      } else {
        console.log('❌ Biometric not available - hardware:', hasHardware, 'enrolled:', isEnrolled);
      }
    } catch (error) {
      console.log('❌ Error checking biometric availability:', error);
      console.error('Full error details:', error);
      setBiometricAvailable(false);
      Alert.alert(
        'Biometric Setup Error',
        'There was an error setting up biometric authentication. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const checkStoredCredentials = async () => {
    if (!biometricsAvailable || !SecureStore) {
      setUseBiometric(false);
      return;
    }

    try {
      const storedEmail = await SecureStore.getItemAsync('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        // Only enable biometric if available AND credentials exist
        if (biometricAvailable) {
          setUseBiometric(true);
        }
      } else {
        setUseBiometric(false);
      }
    } catch (error) {
      console.log('Error checking stored credentials:', error);
      setUseBiometric(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!biometricsAvailable || !LocalAuthentication || !SecureStore) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      setUseBiometric(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Chillar',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use MPIN',
      });

      if (result.success) {
        // Get stored credentials
        const storedEmail = await SecureStore.getItemAsync('userEmail');
        const storedToken = await SecureStore.getItemAsync('authToken');
        
        if (storedEmail && storedToken) {
          // Use stored token for quick login
          await authLogin(storedToken, {
            id: 'user_id',
            email: storedEmail,
          });
          console.log('Biometric login successful, AuthGuard will redirect to Dashboard');
        } else {
          // Fallback to manual login
          Alert.alert('Setup Required', 'Please login with email and MPIN first to enable biometric authentication.');
          setUseBiometric(false);
        }
      } else {
        // User cancelled or authentication failed
        if (result.error === 'user_cancel') {
          setUseBiometric(false); // Show manual login option
        } else {
          Alert.alert('Authentication Failed', 'Biometric authentication failed. Please try again or use MPIN.');
        }
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication error. Please use MPIN login.');
      setUseBiometric(false);
    } finally {
      setIsLoading(false);
    }
  };

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

      // Use direct fetch to avoid any API wrapper issues
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

      // Assuming the response contains a token and user data
      const { access_token, refresh_token, msg } = responseData;
      
      if (access_token) {
        // Use AuthContext login function with the actual user email
        await authLogin(access_token, {
          id: 'user_id', // The backend doesn't return user details in login, using placeholder
          email: email, // Use the actual email from the form
        });
        
        // Clear form data
        setEmail('');
        setMpin(['', '', '', '']);
        
        // AuthGuard will automatically navigate to Dashboard when isAuthenticated becomes true
        console.log('Login successful, AuthGuard will redirect to Dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Clear MPIN fields on login failure for security and UX
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
  text: {
    fontSize: 16,
    margin: 3,
    color: '#495057',
    fontWeight: '500',
  },
});