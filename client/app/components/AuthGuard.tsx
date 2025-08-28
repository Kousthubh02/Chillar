import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login/Login';
import Dashboard from '../components/Dashboard/Dashboard';

const AuthGuard: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('AuthGuard: Current state', { isAuthenticated, isLoading, user });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('AuthGuard: Not authenticated, showing Login');
    return <Login />;
  }

  console.log('AuthGuard: Authenticated, showing Dashboard');
  return <Dashboard />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '500',
  },
});

export default AuthGuard;
