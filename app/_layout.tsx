import {
  Kanit_400Regular,
  Kanit_700Bold,
  useFonts,
} from "@expo-google-fonts/kanit";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Kanit_400Bold: Kanit_400Regular,
    Kanit_700Bold,
  });
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1893da",
        },
        headerTitleStyle: {
          fontFamily: "Kanit_700Bold",
          fontSize: 20,
          color: "#fff",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="run"
        options={{
          title: "Run Tracker",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "เข้าสู่ระบบ",
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "เพิ่มรายการวิ่ง",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "รายละเอียดรายการวิ่ง",
        }}
      />
    </Stack>
  );
}
