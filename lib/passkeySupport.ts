import type { passkeys as ClerkPasskeys } from '@clerk/expo/passkeys';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type PasskeyAdapter = typeof ClerkPasskeys;

const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';
const hasNativePasskeyModule =
  isNativePlatform && Boolean(requireOptionalNativeModule('ClerkExpoPasskeys'));

// Requiring the adapter without a development build makes Expo Go throw while loading the app.
// Only load it after confirming the native module is linked; web uses Clerk's browser WebAuthn.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const nativePasskeys: PasskeyAdapter | undefined = hasNativePasskeyModule
  ? require('@clerk/expo/passkeys').passkeys
  : undefined;

export const isPasskeySupported = () => {
  if (Platform.OS === 'web') return typeof globalThis.PublicKeyCredential !== 'undefined';
  return nativePasskeys?.isSupported() ?? false;
};
