import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import RootNavigator from "./src/navigation/RootNavigator"
import { AuthProvider } from "./src/contexts/AuthContext"
import { UserRoleProvider } from "./src/contexts/UserRoleContext"
import { ProfileFlowStepProvider } from "./src/contexts/ProfileFlowStepContext";
import { CurrentElderlyProvider } from "./src/contexts/CurrentElderlyContext";
import { AvatarPreloaderProvider } from "./src/contexts/AvatarPreloaderContext";
import { TTSProvider } from "./src/contexts/TTSContext";
// import { ThemeProvider } from "./src/contexts/ThemeContext"
// import { FontSizeProvider } from "./src/contexts/FontSizeContext"
import { registerGlobals } from '@livekit/react-native';
registerGlobals();

export default function App() {

  return (
    <SafeAreaProvider>
      {/* <ThemeProvider>
        <FontSizeProvider> */}
          <AuthProvider>
            <UserRoleProvider>
              <ProfileFlowStepProvider>
                <CurrentElderlyProvider>
                  <AvatarPreloaderProvider>
                    <TTSProvider>
                      <NavigationContainer>
                        <StatusBar style="auto" />
                        <RootNavigator />
                      </NavigationContainer>
                    </TTSProvider>
                  </AvatarPreloaderProvider>
                </CurrentElderlyProvider>
              </ProfileFlowStepProvider>
            </UserRoleProvider>
          </AuthProvider>
      {/*   </FontSizeProvider>
      </ThemeProvider> */}
    </SafeAreaProvider>
  )
}
