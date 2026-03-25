import GlobalProvider from "@/components/GlobalProvider";
import { bgEnd, divider, onMainColor, textPrimary } from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure reloading starts from the playlist home route.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const appTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: bgEnd,
      primary: onMainColor,
      text: textPrimary,
      border: divider,
      card: "transparent",
    },
  };

  return (
    <ThemeProvider value={appTheme}>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <GlobalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="[playlistId]" />
            </Stack>
          </GlobalProvider>
        </GestureHandlerRootView>
        <StatusBar style="light" translucent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
