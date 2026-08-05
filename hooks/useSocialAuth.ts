import { useSSO } from '@clerk/expo/experimental';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';

WebBrowser.maybeCompleteAuthSession();

export type SocialAuthStrategy = 'oauth_google' | 'oauth_apple';

export function useSocialAuth() {
  const { startSSOFlow } = useSSO();

  return useCallback(
    async (strategy: SocialAuthStrategy) => {
      const result = await startSSOFlow({ strategy });

      if (result.authSessionResult && result.authSessionResult.type !== 'success') return;

      if (
        result.createdSessionId ||
        result.signIn?.existingSession ||
        result.signUp?.existingSession
      ) {
        // startSSOFlow finalizes/activates completed sessions. Protected route guards move the
        // user into the signed-in tree without dispatching across nested navigators.
        return;
      }

      if (result.signUp?.id && !result.signUp.canBeDiscarded) {
        router.replace('/(auth)/sign-up');
        return;
      }

      if (result.signIn?.id && !result.signIn.canBeDiscarded) {
        router.replace('/(auth)/sign-in');
        return;
      }

      throw new Error('The social sign-in flow did not return an active authentication attempt.');
    },
    [startSSOFlow],
  );
}
