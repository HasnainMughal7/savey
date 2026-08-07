import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

const extra = Constants.expoConfig?.extra;
const projectToken = extra?.posthogProjectToken as string | undefined;
const host = extra?.posthogHost as string | undefined;
const missingConfiguration = [
  !projectToken && 'EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN',
  !host && 'EXPO_PUBLIC_POSTHOG_HOST',
].filter(Boolean) as string[];

if (__DEV__) {
  missingConfiguration.forEach((variable) => {
    console.error(
      new Error(
        `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variable} is configured`,
      ),
    );
  });
}

export const posthog =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        captureAppLifecycleEvents: true,
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: false,
          },
        },
      })
    : null;
