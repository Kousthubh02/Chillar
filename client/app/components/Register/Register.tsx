import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import { router, useNavigation } from 'expo-router';

export default function Register() {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleNext = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    // Optional: Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    // Navigate to MPIN screen
    router.push({pathname:'/components/Register/Mpin',params:{username, email}});
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        <Text style={styles.text}>Enter your username</Text>
        <TextInput
          placeholder="johndoe"
          style={styles.Inputtext}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputBox}>
        <Text style={styles.text}>Enter your email</Text>
        <TextInput
          placeholder="maniverse123@gmail.com"
          style={styles.Inputtext}
          value={email}
          onChangeText={setEmail} // Update email state
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      <Pressable style={styles.submit} onPress={handleNext}>
        <Text style={{ fontSize: 20 }}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  Inputtext: {
    height: 50,
    width: 300,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    margin: 2,
  },
  inputBox: {
    padding: 10,
  },
  submit: {
    backgroundColor: 'pink',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 5,
    width: 300,
  },
  text: {
    fontSize: 15,
    margin: 3,
  },
});