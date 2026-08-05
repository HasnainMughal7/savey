import { useClerk, useSession } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton, AuthNotice } from '@/components/auth/AuthUI';
import { colors, spacing } from '@/constants/theme';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { getErrorMessage } from '@/lib/auth';

export default function SessionTaskScreen() {
  const { session } = useSession();
  const { client, signOut } = useClerk();
  const { isRunning, run } = useAsyncAction();
  const [error, setError] = useState<string>();
  const taskKey = session?.currentTask?.key;

  const handleSignOut = async () => {
    await signOut();
  };

  const handleCheckAgain = () =>
    run(async () => {
      setError(undefined);
      try {
        await client.reload();
      } catch (reloadError) {
        setError(getErrorMessage(reloadError, 'We could not refresh the security status.'));
      }
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark-outline" size={34} color={colors.accent} />
        </View>
        <Text style={styles.title}>One security step remains</Text>
        <Text style={styles.copy}>
          Clerk requires an account security task before Savey can open your subscription data.
          Complete it in your Clerk Account Portal, then reopen the app.
        </Text>
        {taskKey ? <Text style={styles.task}>Required task: {taskKey}</Text> : null}
        <AuthNotice message={error} />
        <AuthButton label="Check again" loading={isRunning} onPress={handleCheckAgain} />
        <AuthButton disabled={isRunning} label="Sign out" variant="secondary" onPress={handleSignOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing[4],
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: spacing[6],
  },
  iconCircle: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 34,
    backgroundColor: 'rgba(234, 122, 83, 0.15)',
  },
  title: {
    color: colors.primary,
    fontFamily: 'sans-extrabold',
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  copy: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  task: {
    padding: spacing[3],
    borderRadius: 14,
    color: colors.primary,
    backgroundColor: colors.muted,
    fontFamily: 'sans-semibold',
    fontSize: 13,
    textAlign: 'center',
  },
});
