import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={{flex:1}}>
          <Stack>
            <Stack.Screen name="index" options={{title:"Home", headerShown: false}}/>
            <Stack.Screen name="login" options={{title:"Login", headerShown: false}}/>
            <Stack.Screen name="register" options={{title:"Register", headerShown: false}}/>
            <Stack.Screen name="mockdata" options={{title:"Transaction History", headerShown: false}}/>
            <Stack.Screen name="+not-found" options={{title:"Not Found"}}/>
          </Stack>
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>  
  );
}

