import { AuthButton, AuthNotice } from '@/components/auth/AuthUI';
import { colors, spacing } from '@/constants/theme';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { getErrorMessage } from '@/lib/auth';
import { useClerk, useUser } from '@clerk/expo';
import { useLocalCredentials } from '@clerk/expo/local-credentials';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const { clearCredentials, userOwnsCredentials } = useLocalCredentials();
  const { isRunning, run } = useAsyncAction();
  const [error, setError] = useState<string>();

  if (!isLoaded || !user) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  const displayName = user.fullName || user.username || 'Savey member';
  const email = user.primaryEmailAddress?.emailAddress ?? 'No primary email';
  const isEmailVerified = user.primaryEmailAddress?.verification.status === 'verified';

  const handleSignOut = () =>
    run(async () => {
      setError(undefined);
      try {
        await signOut();
        router.replace('/');
      } catch (signOutError) {
        setError(getErrorMessage(signOutError, 'We could not sign you out. Please try again.'));
      }
    });

  const handleRemoveBiometrics = () =>
    run(async () => {
      setError(undefined);
      try {
        await clearCredentials();
      } catch (credentialError) {
        setError(
          getErrorMessage(credentialError, 'We could not remove biometric sign-in right now.'),
        );
      }
    });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.eyebrow}>Your Savey account</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage the identity protecting your subscription data.</Text>
        </View>

        <View style={styles.profileCard}>
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          <View style={styles.profileCopy}>
            <Text numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.email}>
              {email}
            </Text>
          </View>
          {isEmailVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            </View>
          ) : null}
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={styles.securityIcon}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Secured by Clerk</Text>
              <Text style={styles.securityDescription}>
                Your session token is encrypted in the device secure store.
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Primary email</Text>
            <Text numberOfLines={1} style={styles.detailValue}>
              {email}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email status</Text>
            <Text style={[styles.detailValue, isEmailVerified ? styles.verifiedText : undefined]}>
              {isEmailVerified ? 'Verified' : 'Needs verification'}
            </Text>
          </View>
        </View>

        <AuthNotice message={error} />
        {userOwnsCredentials ? (
          <AuthButton
            label="Remove biometric sign-in"
            loading={isRunning}
            onPress={handleRemoveBiometrics}
            variant="secondary"
          />
        ) : null}
        <AuthButton label="Sign out of Savey" loading={isRunning} onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: spacing[5],
    padding: spacing[5],
    paddingBottom: spacing[30],
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: 'sans-bold',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing[1],
    color: colors.primary,
    fontFamily: 'sans-extrabold',
    fontSize: 34,
    lineHeight: 42,
  },
  subtitle: {
    marginTop: spacing[2],
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 15,
    lineHeight: 23,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.muted,
  },
  profileCopy: {
    minWidth: 0,
    flex: 1,
  },
  name: {
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 18,
  },
  email: {
    marginTop: 3,
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 13,
  },
  verifiedBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  securityCard: {
    gap: spacing[4],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.card,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  securityIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(234, 122, 83, 0.13)',
  },
  securityCopy: {
    minWidth: 0,
    flex: 1,
  },
  securityTitle: {
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 16,
  },
  securityDescription: {
    marginTop: 3,
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 12,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  detailLabel: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 13,
  },
  detailValue: {
    minWidth: 0,
    flex: 1,
    color: colors.primary,
    fontFamily: 'sans-semibold',
    fontSize: 13,
    textAlign: 'right',
  },
  verifiedText: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
