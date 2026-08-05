import { useSignIn } from '@clerk/expo';
import type { SignInSecondFactor } from '@clerk/expo/types';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
  AuthButton,
  AuthField,
  AuthForm,
  AuthNotice,
  AuthRouteLink,
  AuthScaffold,
  AuthStepIntro,
  AuthTextButton,
} from '@/components/auth/AuthUI';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useCooldown } from '@/hooks/useCooldown';
import { useFinalizeAuth } from '@/hooks/useFinalizeAuth';
import {
  type SignInFieldErrors,
  getErrorMessage,
  hasFieldErrors,
  isAlreadyVerifiedError,
  normalizeEmail,
  validateSignIn,
  validateVerificationCode,
} from '@/lib/auth';
import { navigateAfterAuth } from '@/lib/authNavigation';

type MfaStrategy = 'email_code' | 'phone_code' | 'totp' | 'backup_code';

const MFA_LABELS: Record<MfaStrategy, string> = {
  email_code: 'Email verification code',
  phone_code: 'Text message code',
  totp: 'Authenticator app',
  backup_code: 'Backup code',
};

const isSupportedMfaStrategy = (strategy: string): strategy is MfaStrategy =>
  strategy === 'email_code' ||
  strategy === 'phone_code' ||
  strategy === 'totp' ||
  strategy === 'backup_code';

export default function SignInScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const { isRunning, run } = useAsyncAction();
  const resend = useCooldown(30);

  const [email, setEmail] = useState(signIn.identifier ?? '');
  const [password, setPassword] = useState('');
  const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy>();
  const [mfaDestination, setMfaDestination] = useState<string>();
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [codeError, setCodeError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const needsMfa =
    signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust';
  const mfaFactors = useMemo(() => {
    const seen = new Set<MfaStrategy>();
    return signIn.supportedSecondFactors.filter((factor) => {
      if (!isSupportedMfaStrategy(factor.strategy) || seen.has(factor.strategy)) return false;
      seen.add(factor.strategy);
      return true;
    });
  }, [signIn.supportedSecondFactors]);

  const handleFinalizeError = useCallback(
    (error: unknown) => {
      setFormError(getErrorMessage(error, 'You are signed in, but the session could not start.'));
    },
    [],
  );
  const finalize = useFinalizeAuth(signIn, navigateAfterAuth, handleFinalizeError);
  const isFinalizing = finalize.isFinalizing;
  const busy = isRunning || fetchStatus === 'fetching' || isFinalizing;

  const clearMessages = () => {
    setFormError(undefined);
    setNotice(undefined);
  };

  const handleSignIn = () =>
    run(async () => {
      clearMessages();
      const validation = validateSignIn(email, password);
      setFieldErrors(validation);
      if (hasFieldErrors(validation)) return;

      try {
        const { error } = await signIn.password({
          emailAddress: normalizeEmail(email),
          password,
        });
        if (error) throw error;
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not sign you in. Check your details.'));
      }
    });

  const beginMfa = (factor: SignInSecondFactor) =>
    run(async () => {
      clearMessages();
      if (!isSupportedMfaStrategy(factor.strategy)) {
        setFormError('That verification method is not supported by this screen.');
        return;
      }

      try {
        if (factor.strategy === 'email_code') {
          const { error } = await signIn.mfa.sendEmailCode();
          if (error && !isAlreadyVerifiedError(error)) throw error;
          setMfaDestination(factor.safeIdentifier);
          resend.start();
        } else if (factor.strategy === 'phone_code') {
          const { error } = await signIn.mfa.sendPhoneCode();
          if (error && !isAlreadyVerifiedError(error)) throw error;
          setMfaDestination(factor.safeIdentifier);
          resend.start();
        }

        setMfaStrategy(factor.strategy);
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not start that verification method.'));
      }
    });

  const handleVerifyMfa = () =>
    run(async () => {
      clearMessages();
      if (!mfaStrategy) return;

      const validation = validateVerificationCode(code, mfaStrategy === 'backup_code');
      setCodeError(validation);
      if (validation) return;

      try {
        let error: unknown | null = null;
        if (mfaStrategy === 'email_code') {
          ({ error } = await signIn.mfa.verifyEmailCode({ code: code.trim() }));
        } else if (mfaStrategy === 'phone_code') {
          ({ error } = await signIn.mfa.verifyPhoneCode({ code: code.trim() }));
        } else if (mfaStrategy === 'totp') {
          ({ error } = await signIn.mfa.verifyTOTP({ code: code.trim() }));
        } else {
          ({ error } = await signIn.mfa.verifyBackupCode({ code: code.trim() }));
        }

        if (error && !isAlreadyVerifiedError(error)) throw error;
      } catch (error) {
        setFormError(getErrorMessage(error, 'That verification code was not accepted.'));
      }
    });

  const handleResendMfa = () =>
    run(async () => {
      clearMessages();
      try {
        const result =
          mfaStrategy === 'email_code'
            ? await signIn.mfa.sendEmailCode()
            : await signIn.mfa.sendPhoneCode();
        if (result.error && !isAlreadyVerifiedError(result.error)) throw result.error;
        resend.start();
        setNotice('A fresh security code is on its way.');
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not resend the code.'));
      }
    });

  const handleStartOver = () =>
    run(async () => {
      clearMessages();
      const { error } = await signIn.reset();
      if (error) {
        setFormError(getErrorMessage(error, 'We could not restart sign in.'));
        return;
      }
      setEmail('');
      setPassword('');
      setCode('');
      setMfaStrategy(undefined);
      setMfaDestination(undefined);
      setFieldErrors({});
      setCodeError(undefined);
      resend.reset();
    });

  const renderCredentials = () => (
    <AuthForm>
      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        error={fieldErrors.email ?? clerkErrors.fields.identifier?.longMessage}
        icon="mail-outline"
        inputMode="email"
        keyboardType="email-address"
        label="Email address"
        onChangeText={(value) => {
          setEmail(value);
          setFieldErrors((current) => ({ ...current, email: undefined }));
        }}
        placeholder="you@example.com"
        returnKeyType="next"
        value={email}
      />
      <AuthField
        autoComplete="current-password"
        error={fieldErrors.password ?? clerkErrors.fields.password?.longMessage}
        icon="lock-closed-outline"
        isPassword
        label="Password"
        onChangeText={(value) => {
          setPassword(value);
          setFieldErrors((current) => ({ ...current, password: undefined }));
        }}
        onSubmitEditing={handleSignIn}
        placeholder="Enter your password"
        returnKeyType="done"
        value={password}
      />
      <AuthTextButton
        disabled={busy}
        label="Forgot your password?"
        onPress={() => router.push('/(auth)/forgot-password')}
      />
      <AuthNotice message={formError} />
      {signIn.status === 'needs_new_password' ? (
        <AuthNotice
          message="This account needs a new password. Use the recovery flow below."
          tone="info"
        />
      ) : null}
      {signIn.status === 'needs_protect_check' ? (
        <AuthNotice
          message="Clerk requested an advanced security check. Restart sign in and try again."
          tone="info"
        />
      ) : null}
      <AuthButton label="Sign in securely" loading={busy} onPress={handleSignIn} />
      {signIn.id ? <AuthTextButton disabled={busy} label="Restart sign in" onPress={handleStartOver} /> : null}
    </AuthForm>
  );

  const renderMfaChoice = () => (
    <AuthForm>
      <AuthStepIntro icon="shield-checkmark-outline" title="Confirm it is you">
        Choose a trusted verification method to finish signing in.
      </AuthStepIntro>
      {mfaFactors.map((factor) => (
        <AuthButton
          key={factor.strategy}
          label={MFA_LABELS[factor.strategy as MfaStrategy]}
          loading={busy}
          onPress={() => beginMfa(factor)}
          variant="secondary"
        />
      ))}
      {mfaFactors.length === 0 ? (
        <AuthNotice
          message="No compatible second-factor method is enabled for this account."
          tone="info"
        />
      ) : null}
      <AuthNotice message={formError} />
      <AuthTextButton disabled={busy} label="Use another account" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderMfaCode = () => {
    const isBackupCode = mfaStrategy === 'backup_code';
    const isCodeDelivery = mfaStrategy === 'email_code' || mfaStrategy === 'phone_code';
    const description = isCodeDelivery
      ? `Enter the security code sent to ${mfaDestination ?? 'your trusted contact'}.`
      : isBackupCode
        ? 'Enter one of the unused backup codes saved with your Clerk account.'
        : 'Enter the 6-digit code currently shown in your authenticator app.';

    return (
      <AuthForm>
        <AuthStepIntro icon="keypad-outline" title={MFA_LABELS[mfaStrategy!]}>
          {description}
        </AuthStepIntro>
        <AuthField
          autoCapitalize="none"
          autoComplete="one-time-code"
          error={codeError ?? clerkErrors.fields.code?.longMessage}
          icon="key-outline"
          inputMode={isBackupCode ? 'text' : 'numeric'}
          keyboardType={isBackupCode ? 'default' : 'number-pad'}
          label={isBackupCode ? 'Backup code' : 'Security code'}
          maxLength={isBackupCode ? 32 : 6}
          onChangeText={(value) => {
            setCode(isBackupCode ? value : value.replace(/\D/g, ''));
            setCodeError(undefined);
          }}
          onSubmitEditing={handleVerifyMfa}
          placeholder={isBackupCode ? 'Enter backup code' : '000000'}
          returnKeyType="done"
          textContentType="oneTimeCode"
          value={code}
        />
        <AuthNotice message={formError} />
        <AuthNotice message={notice} tone="success" />
        <AuthButton label="Confirm and continue" loading={busy} onPress={handleVerifyMfa} />
        {isCodeDelivery ? (
          <AuthTextButton
            disabled={busy || resend.isCoolingDown}
            label={resend.isCoolingDown ? `Resend code in ${resend.seconds}s` : 'Resend code'}
            onPress={handleResendMfa}
          />
        ) : null}
        <AuthTextButton
          disabled={busy}
          label="Choose another method"
          onPress={() => {
            setMfaStrategy(undefined);
            setCode('');
            setCodeError(undefined);
          }}
        />
      </AuthForm>
    );
  };

  const renderFinalizing = () => (
    <AuthForm>
      <AuthStepIntro icon="checkmark-circle-outline" title="Welcome back">
        Your identity is confirmed. We are opening Savey now.
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

  const content = finalize.isComplete
    ? renderFinalizing()
    : needsMfa
      ? mfaStrategy
        ? renderMfaCode()
        : renderMfaChoice()
      : renderCredentials();

  return (
    <AuthScaffold
      footer={
        !needsMfa && !finalize.isComplete ? (
          <AuthRouteLink
            prompt="New to Savey?"
            label="Create an account"
            href="/(auth)/sign-up"
          />
        ) : undefined
      }
      subtitle="Sign in to keep every subscription, renewal, and saving in one calm place."
      title={needsMfa ? 'Secure sign in' : 'Welcome back'}
    >
      {content}
    </AuthScaffold>
  );
}
