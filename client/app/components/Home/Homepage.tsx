import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Homepage() {
  const handleLogin = () => {
    router.push('/components/Login/Login');
  };

  const handleRegister = () => {
    router.push('/components/Register/Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'pink',
    padding: 10,
    borderRadius: 5,
    width: 200,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 20,
    color: 'black',
  },
});