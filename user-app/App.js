import * as React from "react";
import { useFonts, NotoSansThai_400Regular, NotoSansThai_700Bold } from '@expo-google-fonts/noto-sans-thai';
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import MainContainer from "./src/navigation/MainContainer";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View />;
  }

  return <MainContainer />;
}
