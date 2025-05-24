import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
  <SafeAreaProvider>
    <SafeAreaView style={{flex:1}}>
    <Stack>
    
    <Stack.Screen name="index" options={{title:"Home"}}/>
    <Stack.Screen name="components/Register/Register" options={{title:"Register"}}/>
    <Stack.Screen name="components/Register/Mpin" options={{title:"Mpin"}}/>
  </Stack>
    </SafeAreaView>
  </SafeAreaProvider>  
  )
}

