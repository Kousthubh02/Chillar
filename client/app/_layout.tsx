import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex:1}}>
        <Stack>
          <Stack.Screen name="index" options={{title:"Home", headerShown: false}}/>
          <Stack.Screen name="mockdata" options={{title:"Transaction History", headerShown: false}}/>
          <Stack.Screen name="+not-found" options={{title:"Not Found"}}/>
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>  
  );
}

