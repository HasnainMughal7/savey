import { AuthButton, AuthNotice } from '@/components/auth/AuthUI';
import { colors, spacing } from '@/constants/theme';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { getErrorMessage } from '@/lib/auth';
import { isPasskeySupported } from '@/lib/passkeySupport';
import { useClerk, useUser } from '@clerk/expo';
import { useLocalCredentials } from '@clerk/expo/local-credentials';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const { clearCredentials, userOwnsCredentials } = useLocalCredentials();
  const { isRunning, run } = useAsyncAction();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const passkeySupported = isPasskeySupported();

  if (!isLoaded || !user) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? 'No primary email';
  const profileName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const emailName = user.primaryEmailAddress?.emailAddress.split('@')[0];
  const displayName = user.fullName || profileName || user.username || emailName || 'Savey member';
  const isEmailVerified = user.primaryEmailAddress?.verification.status === 'verified';

  const handleSignOut = () =>
    run(async () => {
      setError(undefined);
      setNotice(undefined);
      try {
        await signOut();
      } catch (signOutError) {
        setError(getErrorMessage(signOutError, 'We could not sign you out. Please try again.'));
      }
    });

  const handleRemoveBiometrics = () =>
    run(async () => {
      setError(undefined);
      setNotice(undefined);
      try {
        await clearCredentials();
        setNotice('Biometric sign-in has been removed from this device.');
      } catch (credentialError) {
        setError(
          getErrorMessage(credentialError, 'We could not remove biometric sign-in right now.'),
        );
      }
    });

  const handleCreatePasskey = () =>
    run(async () => {
      setError(undefined);
      setNotice(undefined);
      if (!passkeySupported) {
        setError('Passkeys need a supported browser or a native Savey development build.');
        return;
      }

      try {
        await user.createPasskey();
        await user.reload();
        setNotice('Your passkey is ready. You can use it from the Savey sign-in screen.');
      } catch (passkeyError) {
        setError(getErrorMessage(passkeyError, 'We could not create a passkey on this device.'));
      }
    });

  const handleRemovePasskey = (passkeyId: string) =>
    run(async () => {
      setError(undefined);
      setNotice(undefined);
      const passkey = user.passkeys.find(({ id }) => id === passkeyId);
      if (!passkey) return;

      try {
        await passkey.delete();
        await user.reload();
        setNotice('The passkey was removed from your Savey account.');
      } catch (passkeyError) {
        setError(getErrorMessage(passkeyError, 'We could not remove that passkey.'));
      }
    });

  const confirmRemovePasskey = (passkeyId: string, passkeyName: string | null) => {
    Alert.alert(
      'Remove passkey?',
      `${passkeyName || 'This passkey'} will no longer sign in to Savey.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void handleRemovePasskey(passkeyId);
          },
        },
      ],
    );
  };

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

        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={styles.passkeyIcon}>
              <Ionicons name="key-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Passkeys</Text>
              <Text style={styles.securityDescription}>
                Sign in with Face ID, Touch ID, or your device screen lock—without a password.
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Saved passkeys</Text>
            <Text style={styles.detailValue}>{user.passkeys.length}</Text>
          </View>

          {user.passkeys.map((passkey) => (
            <View key={passkey.id} style={styles.passkeyRow}>
              <View style={styles.passkeyCopy}>
                <Text numberOfLines={1} style={styles.passkeyName}>
                  {passkey.name || 'Savey passkey'}
                </Text>
                <Text style={styles.passkeyDate}>
                  Added {passkey.createdAt.toLocaleDateString()}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${passkey.name || 'passkey'}`}
                disabled={isRunning}
                hitSlop={10}
                onPress={() => confirmRemovePasskey(passkey.id, passkey.name)}
                style={({ pressed }) => [
                  styles.removePasskey,
                  pressed ? styles.buttonPressed : undefined,
                ]}
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                <Text style={styles.removePasskeyText}>Remove</Text>
              </Pressable>
            </View>
          ))}

          {passkeySupported ? (
            <AuthButton
              label={user.passkeys.length > 0 ? 'Add another passkey' : 'Create a passkey'}
              loading={isRunning}
              onPress={handleCreatePasskey}
              variant="secondary"
            />
          ) : (
            <AuthNotice
              message="Passkeys are unavailable in this runtime. Install a fresh native development build; Expo Go cannot use them."
              tone="info"
            />
          )}
        </View>

        <AuthNotice message={error} />
        <AuthNotice message={notice} tone="success" />
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
  passkeyIcon: {
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
  passkeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  passkeyCopy: {
    minWidth: 0,
    flex: 1,
  },
  passkeyName: {
    color: colors.primary,
    fontFamily: 'sans-semibold',
    fontSize: 13,
  },
  passkeyDate: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 11,
  },
  removePasskey: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
  },
  removePasskeyText: {
    color: colors.destructive,
    fontFamily: 'sans-semibold',
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
