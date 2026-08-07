import '@/global.css';

import { colors } from '@/constants/theme';
import { ClerkProvider, useAuth, useSession, useUser } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { posthog } from '@/lib/posthog';

void SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function PostHogIdentitySync() {
  const { isLoaded, user } = useUser();
  const identifiedUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      if (identifiedUserId.current === user.id) return;

      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName;
      const properties = {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      };

      posthog?.identify(user.id, properties);
      identifiedUserId.current = user.id;
      return;
    }

    if (identifiedUserId.current) {
      posthog?.reset();
      identifiedUserId.current = undefined;
    }
  }, [isLoaded, user]);

  return null;
}

function AppNavigator() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const { isLoaded: isSessionLoaded, session } = useSession();

  if (!isAuthLoaded || !isSessionLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const hasSessionTask = Boolean(session?.currentTask);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(isSignedIn) && !hasSessionTask}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(isSignedIn) && hasSessionTask}>
        <Stack.Screen name="session-task" />
      </Stack.Protected>
    </Stack>
  );
}

function MissingClerkKey() {
  return (
    <View style={styles.configurationScreen}>
      <View style={styles.configurationCard}>
        <Text style={styles.configurationTitle}>Authentication needs one setting</Text>
        <Text style={styles.configurationCopy}>
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your local .env file, then restart Expo with a
          cleared cache.
        </Text>
        <Text selectable style={styles.configurationCommand}>
          npx expo start --clear
        </Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;
  if (!publishableKey) return <MissingClerkKey />;

  const app = (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <PostHogIdentitySync />
      <AppNavigator />
    </ClerkProvider>
  );

  return posthog ? (
    <PostHogProvider client={posthog} autocapture={{ captureScreens: false }}>
      {app}
    </PostHogProvider>
  ) : (
    app
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  configurationScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  configurationCard: {
    width: '100%',
    maxWidth: 460,
    gap: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.card,
  },
  configurationTitle: {
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 22,
    lineHeight: 30,
  },
  configurationCopy: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 15,
    lineHeight: 23,
  },
  configurationCommand: {
    padding: 12,
    borderRadius: 12,
    color: colors.primary,
    backgroundColor: colors.muted,
    fontFamily: 'sans-semibold',
  },
});
