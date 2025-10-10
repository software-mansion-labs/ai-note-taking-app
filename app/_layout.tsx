import { Stack } from "expo-router";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Notes" }} />
          <Stack.Screen name="note/[id]" options={{ title: "Note Editor" }} />
          <Stack.Screen name="ai-assistant" options={{ title: "AI Assistant", presentation: "modal" }} />
        </Stack>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
