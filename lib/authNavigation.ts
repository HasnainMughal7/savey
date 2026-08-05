import type { SetActiveNavigate } from '@clerk/expo/types';
import { Platform } from 'react-native';

export const navigateAfterAuth: SetActiveNavigate = ({ session, decorateUrl }) => {
  // Native routing is driven by the protected route guards in app/_layout.tsx. Calling
  // router.replace('/') from inside the nested auth navigator produces an unhandled
  // `REPLACE index` action before Expo Router has switched to the signed-in route tree.
  if (Platform.OS !== 'web') return;

  const destination = session.currentTask ? '/session-task' : '/';
  const decoratedUrl = decorateUrl(destination);

  window.location.assign(decoratedUrl);
};
