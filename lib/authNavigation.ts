import type { SetActiveNavigate } from '@clerk/expo/types';
import { type Href, router } from 'expo-router';
import { Platform } from 'react-native';

export const navigateAfterAuth: SetActiveNavigate = ({ session, decorateUrl }) => {
  const destination = session.currentTask ? '/session-task' : '/';
  const decoratedUrl = decorateUrl(destination);

  if (Platform.OS === 'web' && /^https?:\/\//i.test(decoratedUrl)) {
    window.location.assign(decoratedUrl);
    return;
  }

  router.replace(decoratedUrl as Href);
};
