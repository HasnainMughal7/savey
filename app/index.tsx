import { useAuth, useSession } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

export default function Index() {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const { isLoaded: isSessionLoaded, session } = useSession();

  if (!isAuthLoaded || !isSessionLoaded) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (session?.currentTask) return <Redirect href="/session-task" />;

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
