# Savey

Savey is an Expo 54 subscription-management app with a custom, cross-platform Clerk authentication experience. The auth UI follows Savey's cream, navy, and coral design system and renders consistently on iOS, Android, and web.

## Authentication included

- Email/password sign-up with local and Clerk validation
- Email verification with resend cooldown and safe retry handling
- Google and Apple OAuth for both sign-up and sign-in
- Native and web passkey sign-in, plus passkey creation/removal in Settings
- Face ID, Touch ID, or fingerprint sign-in for returning password users
- Required Clerk profile fields and legal consent without phone collection
- Idempotent handling for already-verified codes
- Explicit Clerk session finalization and protected Expo Router groups
- Email/password sign-in with email, TOTP, and backup-code MFA
- Email-code password recovery that signs out other sessions
- Encrypted native token persistence through `expo-secure-store`
- Real Clerk user identity on Home and Settings, plus sign out
- Web CAPTCHA mount point for Clerk bot protection
- Visible configuration and session-task screens instead of blank states

## Local setup

1. Use a current Node 20 release and install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. In Clerk Dashboard, copy the publishable key from **API keys** into `.env`:

   ```dotenv
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

4. In Clerk Dashboard, enable:

   - Native API
   - Email address as an identifier
   - Password authentication
   - Email verification code for sign-up
   - Google and Apple as social connections
   - Passkeys

   Keep phone number optional or disabled. Savey intentionally does not collect a phone number
   during sign-up.

   The custom flow also adapts when first name, last name, username, legal acceptance, or MFA are
   required.

5. Restart Expo after changing environment variables:

   ```bash
   npx expo start --clear
   ```

The `.env` file is intentionally ignored. Never commit environment-specific keys; use `.env.example` as the shared template.

## Run

```bash
npm run ios
npm run android
npm run web
```

The native identifiers are configured as `com.hasnainmughal.savey`. Google and Apple use Clerk's
browser SSO flow and the `savey` URL scheme. Allowlist the production redirect URL in Clerk before
release. Face ID and native passkeys require a development build; Expo Go cannot test them.

## Native passkey setup

The current development Clerk Frontend API domain is
`model-locust-75.clerk.accounts.dev`. If the app moves to a different Clerk instance, update both
the iOS associated domains and Android intent-filter host in `app.json`.

### iOS

1. In Apple Developer, create or open the explicit App ID for `com.hasnainmughal.savey`, enable
   **Associated Domains**, and copy its 10-character App ID Prefix.
2. In Clerk Dashboard, open **Configure > Native applications**, enable **Native API**, select
   **iOS**, and add an application using that App ID Prefix and the exact bundle ID
   `com.hasnainmughal.savey`.
3. Keep these entries in `ios.associatedDomains`:
   `applinks:model-locust-75.clerk.accounts.dev` and
   `webcredentials:model-locust-75.clerk.accounts.dev`.
4. Rebuild the native app after changing entitlements:

   ```bash
   npx expo prebuild
   npx expo run:ios --device
   ```

Use iOS 17 or later. The installed Clerk Expo SDK currently raises the native deployment target to
iOS 17.

### Android

1. Get the SHA-256 fingerprint for every signing key used by Savey (development and production).
2. In Clerk Dashboard, open **Configure > Native applications**, select **Android**, and add an
   application with namespace `android_app`, package name `com.hasnainmughal.savey`, and the
   SHA-256 fingerprint.
3. Keep the verified HTTPS intent filter in `app.json`, then rebuild:

   ```bash
   npx expo prebuild
   npx expo run:android --device
   ```

Use a physical Android 9 or later device. Native passkeys are not available in Android emulators.

## Verify changes

```bash
npm run check
npx expo-doctor
npx expo export --platform web
```

## Important auth routes

- `/(auth)/sign-in`
- `/(auth)/sign-up`
- `/(auth)/forgot-password`
- `/session-task`

Expo Router protected routes ensure signed-out users stay in auth, signed-in users enter the tabs, and pending Clerk session tasks cannot be bypassed.
