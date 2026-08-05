import { useSignIn } from '@clerk/expo';
import { useLocalCredentials } from '@clerk/expo/local-credentials';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import {
  AuthButton,
  AuthField,
  AuthForm,
  AuthNotice,
  AuthScaffold,
  AuthStepIntro,
  AuthTextButton,
  authTextStyles,
} from '@/components/auth/AuthUI';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useCooldown } from '@/hooks/useCooldown';
import { useFinalizeAuth } from '@/hooks/useFinalizeAuth';
import {
  getErrorMessage,
  isAlreadyVerifiedError,
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateVerificationCode,
} from '@/lib/auth';
import { navigateAfterAuth } from '@/lib/authNavigation';

type RecoveryStep = 'email' | 'code' | 'new-password' | 'finalizing';

export default function ForgotPasswordScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const { biometricType, clearCredentials, setCredentials } = useLocalCredentials();
  const { isRunning, run } = useAsyncAction();
  const resend = useCooldown(30);
  const emailEditedRef = useRef(false);

  const [step, setStep] = useState<RecoveryStep>(
    signIn.status === 'needs_new_password' ? 'new-password' : 'email',
  );
  const [email, setEmail] = useState(signIn.identifier ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    if (signIn.identifier && !emailEditedRef.current) setEmail(signIn.identifier);
  }, [signIn.identifier]);

  const handleFinalizeError = useCallback(
    (error: unknown) => {
      setFormError(
        getErrorMessage(error, 'Your password changed, but the new session could not start.'),
      );
    },
    [],
  );
  const finalize = useFinalizeAuth(signIn, navigateAfterAuth, handleFinalizeError);
  const isFinalizing = finalize.isFinalizing;
  const activeStep: RecoveryStep = finalize.isComplete ? 'finalizing' : step;
  const busy = isRunning || fetchStatus === 'fetching' || isFinalizing;

  const clearMessages = () => {
    setFormError(undefined);
    setNotice(undefined);
  };

  const handleSendCode = () =>
    run(async () => {
      clearMessages();
      const validation = validateEmail(email);
      setEmailError(validation);
      if (validation) return;

      try {
        const resetResult = await signIn.reset();
        if (resetResult.error) throw resetResult.error;

        const createResult = await signIn.create({ identifier: normalizeEmail(email) });
        if (createResult.error) throw createResult.error;

        const sendResult = await signIn.resetPasswordEmailCode.sendCode();
        if (sendResult.error && !isAlreadyVerifiedError(sendResult.error)) throw sendResult.error;

        setStep(sendResult.error ? 'new-password' : 'code');
        if (!sendResult.error) resend.start();
      } catch (error) {
        setFormError(
          getErrorMessage(error, 'We could not send a recovery code for that account.'),
        );
      }
    });

  const handleVerifyCode = () =>
    run(async () => {
      clearMessages();
      const validation = validateVerificationCode(code);
      setCodeError(validation);
      if (validation) return;

      try {
        const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
        if (error && !isAlreadyVerifiedError(error)) throw error;
        setStep('new-password');
      } catch (error) {
        setFormError(getErrorMessage(error, 'That recovery code was not accepted.'));
      }
    });

  const handleResendCode = () =>
    run(async () => {
      clearMessages();
      try {
        const { error } = await signIn.resetPasswordEmailCode.sendCode();
        if (error && !isAlreadyVerifiedError(error)) throw error;
        if (error) setStep('new-password');
        else {
          resend.start();
          setNotice('A fresh recovery code is on its way.');
        }
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not resend the recovery code.'));
      }
    });

  const handleSavePassword = () =>
    run(async () => {
      clearMessages();
      const nextPasswordError = validatePassword(password);
      const nextConfirmError =
        !confirmPassword
          ? 'Confirm your new password.'
          : password !== confirmPassword
            ? 'Passwords do not match.'
            : undefined;
      setPasswordError(nextPasswordError);
      setConfirmPasswordError(nextConfirmError);
      if (nextPasswordError || nextConfirmError) return;

      try {
        const { error } = await signIn.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        });
        if (error) throw error;

        if (biometricType) {
          try {
            await setCredentials({ identifier: normalizeEmail(email), password });
          } catch {
            try {
              await clearCredentials();
            } catch {
              // Updating local biometrics must not invalidate a successful password reset.
            }
          }
        }

        if (
          signIn.status === 'needs_second_factor' ||
          signIn.status === 'needs_client_trust'
        ) {
          router.replace('/(auth)/sign-in');
          return;
        }

        if (signIn.status !== 'complete') {
          setFormError('Your password was updated. Sign in again to finish securing this device.');
        }
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not update your password.'));
      }
    });

  const handleStartOver = () =>
    run(async () => {
      clearMessages();
      const { error } = await signIn.reset();
      if (error) {
        setFormError(getErrorMessage(error, 'We could not restart password recovery.'));
        return;
      }
      setStep('email');
      setCode('');
      setPassword('');
      setConfirmPassword('');
      setCodeError(undefined);
      setPasswordError(undefined);
      setConfirmPasswordError(undefined);
      emailEditedRef.current = false;
      resend.reset();
    });

  const handleBackToSignIn = () =>
    run(async () => {
      await signIn.reset();
      router.replace('/(auth)/sign-in');
    });

  const renderEmail = () => (
    <AuthForm>
      <AuthStepIntro icon="key-outline" title="Recover your account">
        Enter your account email and Clerk will send a secure one-time code.
      </AuthStepIntro>
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        error={emailError ?? clerkErrors.fields.identifier?.longMessage}
        icon="mail-outline"
        inputMode="email"
        keyboardType="email-address"
        label="Email address"
        onChangeText={(value) => {
          emailEditedRef.current = true;
          setEmail(value);
          setEmailError(undefined);
        }}
        onSubmitEditing={handleSendCode}
        placeholder="you@example.com"
        returnKeyType="done"
        value={email}
      />
      <AuthNotice message={formError} />
      <AuthButton label="Send recovery code" loading={busy} onPress={handleSendCode} />
      <AuthTextButton disabled={busy} label="Back to sign in" onPress={handleBackToSignIn} />
    </AuthForm>
  );

  const renderCode = () => (
    <AuthForm>
      <AuthStepIntro icon="mail-unread-outline" title="Check your inbox">
        We sent a 6-digit recovery code to{' '}
        <Text style={authTextStyles.emphasis}>{normalizeEmail(email)}</Text>.
      </AuthStepIntro>
      <AuthField
        autoComplete="one-time-code"
        error={codeError ?? clerkErrors.fields.code?.longMessage}
        icon="keypad-outline"
        inputMode="numeric"
        keyboardType="number-pad"
        label="Recovery code"
        maxLength={6}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, ''));
          setCodeError(undefined);
        }}
        onSubmitEditing={handleVerifyCode}
        placeholder="000000"
        returnKeyType="done"
        textContentType="oneTimeCode"
        value={code}
      />
      <AuthNotice message={formError} />
      <AuthNotice message={notice} tone="success" />
      <AuthButton label="Verify recovery code" loading={busy} onPress={handleVerifyCode} />
      <AuthTextButton
        disabled={busy || resend.isCoolingDown}
        label={resend.isCoolingDown ? `Resend code in ${resend.seconds}s` : 'Resend code'}
        onPress={handleResendCode}
      />
      <AuthTextButton disabled={busy} label="Use a different email" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderNewPassword = () => (
    <AuthForm>
      <AuthStepIntro icon="lock-open-outline" title="Create a new password">
        Choose a strong password you have not used for this account before.
      </AuthStepIntro>
      <AuthField
        autoComplete="new-password"
        error={passwordError ?? clerkErrors.fields.password?.longMessage}
        helper="At least 8 characters. A memorable passphrase is ideal."
        icon="lock-closed-outline"
        isPassword
        label="New password"
        onChangeText={(value) => {
          setPassword(value);
          setPasswordError(undefined);
        }}
        placeholder="Enter a strong password"
        value={password}
      />
      <AuthField
        autoComplete="new-password"
        error={confirmPasswordError}
        icon="shield-checkmark-outline"
        isPassword
        label="Confirm new password"
        onChangeText={(value) => {
          setConfirmPassword(value);
          setConfirmPasswordError(undefined);
        }}
        onSubmitEditing={handleSavePassword}
        placeholder="Enter it once more"
        returnKeyType="done"
        value={confirmPassword}
      />
      <AuthNotice message={formError} />
      <AuthButton label="Save new password" loading={busy} onPress={handleSavePassword} />
      <AuthTextButton disabled={busy} label="Restart recovery" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderFinalizing = () => (
    <AuthForm>
      <AuthStepIntro icon="checkmark-circle-outline" title="Password updated">
        Your other sessions are signed out. We are opening Savey securely.
      </AuthStepIntro>
      <AuthNotice message={formError} />
      <AuthButton
        disabled={!finalize.hasFailed}
        label={finalize.hasFailed ? 'Retry secure sign in' : 'Opening Savey…'}
        loading={isFinalizing}
        onPress={() => {
          setFormError(undefined);
          finalize.retry();
        }}
      />
    </AuthForm>
  );

  const content = {
    email: renderEmail,
    code: renderCode,
    'new-password': renderNewPassword,
    finalizing: renderFinalizing,
  }[activeStep]();

  return (
    <AuthScaffold
      subtitle="Reset access without compromising your subscription data."
      title="Forgot your password?"
    >
      {content}
    </AuthScaffold>
  );
}
