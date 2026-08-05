import { useSignUp } from '@clerk/expo';
import type { SignUpField, SignUpFutureUpdateParams } from '@clerk/expo/types';
import { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';

import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthForm,
  AuthNotice,
  AuthRouteLink,
  AuthScaffold,
  AuthStepIntro,
  AuthTextButton,
  ClerkCaptcha,
  authTextStyles,
} from '@/components/auth/AuthUI';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useCooldown } from '@/hooks/useCooldown';
import { useFinalizeAuth } from '@/hooks/useFinalizeAuth';
import {
  type ProfileFieldErrors,
  type SignUpFieldErrors,
  getErrorMessage,
  getReadableFieldName,
  hasFieldErrors,
  isAlreadyVerifiedError,
  normalizeEmail,
  normalizePhoneNumber,
  validatePhoneNumber,
  validateSignUp,
  validateVerificationCode,
} from '@/lib/auth';
import { navigateAfterAuth } from '@/lib/authNavigation';

type SignUpStep =
  | 'credentials'
  | 'email-code'
  | 'phone'
  | 'phone-code'
  | 'profile'
  | 'unsupported'
  | 'finalizing';

const PROFILE_FIELDS = new Set<SignUpField>([
  'first_name',
  'last_name',
  'username',
  'legal_accepted',
]);

export default function SignUpScreen() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const { isRunning, run } = useAsyncAction();
  const resend = useCooldown(30);

  const [email, setEmail] = useState(signUp.emailAddress ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(signUp.phoneNumber ?? '');
  const [phoneCode, setPhoneCode] = useState('');
  const [firstName, setFirstName] = useState(signUp.firstName ?? '');
  const [lastName, setLastName] = useState(signUp.lastName ?? '');
  const [username, setUsername] = useState(signUp.username ?? '');
  const [legalAccepted, setLegalAccepted] = useState(Boolean(signUp.legalAcceptedAt));
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [profileErrors, setProfileErrors] = useState<ProfileFieldErrors>({});
  const [phoneError, setPhoneError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const missingFields = signUp.missingFields;
  const unverifiedFields = signUp.unverifiedFields;
  const hasAttempt = Boolean(signUp.id) && !signUp.canBeDiscarded;
  const missingProfileFields = useMemo(
    () => missingFields.filter((field) => PROFILE_FIELDS.has(field)),
    [missingFields],
  );
  const unsupportedFields = useMemo(
    () =>
      missingFields.filter(
        (field) =>
          !PROFILE_FIELDS.has(field) &&
          field !== 'phone_number' &&
          field !== 'email_address' &&
          field !== 'password',
      ),
    [missingFields],
  );

  let step: SignUpStep = 'credentials';
  if (signUp.status === 'complete') step = 'finalizing';
  else if (hasAttempt && unverifiedFields.includes('email_address')) step = 'email-code';
  else if (hasAttempt && missingFields.includes('phone_number') && !signUp.phoneNumber) step = 'phone';
  else if (hasAttempt && unverifiedFields.includes('phone_number')) step = 'phone-code';
  else if (hasAttempt && missingProfileFields.length > 0) step = 'profile';
  else if (hasAttempt && (unsupportedFields.length > 0 || signUp.protectCheck)) step = 'unsupported';
  else if (hasAttempt && missingFields.includes('password')) step = 'credentials';

  const handleFinalizeError = useCallback(
    (error: unknown) => {
      setFormError(getErrorMessage(error, 'Your account is ready, but the session could not start.'));
    },
    [],
  );
  const finalize = useFinalizeAuth(signUp, navigateAfterAuth, handleFinalizeError);
  const isFinalizing = finalize.isFinalizing;
  const busy = isRunning || fetchStatus === 'fetching' || isFinalizing;

  const clearMessages = () => {
    setFormError(undefined);
    setNotice(undefined);
  };

  const refreshVerifiedAttempt = async () => {
    const { error } = await signUp.update({});
    if (error) throw error;
  };

  const handleCreateAccount = () =>
    run(async () => {
      clearMessages();
      const validation = validateSignUp(email, password, confirmPassword);
      setFieldErrors(validation);
      if (hasFieldErrors(validation)) return;

      try {
        const { error } = await signUp.password({
          emailAddress: normalizeEmail(email),
          password,
        });
        if (error) throw error;

        const result = await signUp.verifications.sendEmailCode();
        if (result.error && !isAlreadyVerifiedError(result.error)) throw result.error;
        if (result.error) await refreshVerifiedAttempt();
        else resend.start();
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not create your account. Please try again.'));
      }
    });

  const handleVerifyEmail = () =>
    run(async () => {
      clearMessages();
      const validation = validateVerificationCode(emailCode);
      setCodeError(validation);
      if (validation) return;

      try {
        const { error } = await signUp.verifications.verifyEmailCode({ code: emailCode.trim() });
        if (error && !isAlreadyVerifiedError(error)) throw error;
        if (error) await refreshVerifiedAttempt();
      } catch (error) {
        setFormError(getErrorMessage(error, 'That code could not be verified.'));
      }
    });

  const handleResendEmail = () =>
    run(async () => {
      clearMessages();
      try {
        const { error } = await signUp.verifications.sendEmailCode();
        if (error && !isAlreadyVerifiedError(error)) throw error;
        if (error) await refreshVerifiedAttempt();
        else {
          resend.start();
          setNotice('A fresh verification code is on its way.');
        }
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not resend the code.'));
      }
    });

  const handleAddPhone = () =>
    run(async () => {
      clearMessages();
      const validation = validatePhoneNumber(phoneNumber);
      setPhoneError(validation);
      if (validation) return;

      try {
        const updateResult = await signUp.update({ phoneNumber: normalizePhoneNumber(phoneNumber) });
        if (updateResult.error) throw updateResult.error;

        const sendResult = await signUp.verifications.sendPhoneCode();
        if (sendResult.error && !isAlreadyVerifiedError(sendResult.error)) throw sendResult.error;
        if (sendResult.error) await refreshVerifiedAttempt();
        else resend.start();
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not add that phone number.'));
      }
    });

  const handleVerifyPhone = () =>
    run(async () => {
      clearMessages();
      const validation = validateVerificationCode(phoneCode);
      setCodeError(validation);
      if (validation) return;

      try {
        const { error } = await signUp.verifications.verifyPhoneCode({ code: phoneCode.trim() });
        if (error && !isAlreadyVerifiedError(error)) throw error;
        if (error) await refreshVerifiedAttempt();
      } catch (error) {
        setFormError(getErrorMessage(error, 'That phone code could not be verified.'));
      }
    });

  const handleResendPhone = () =>
    run(async () => {
      clearMessages();
      try {
        const { error } = await signUp.verifications.sendPhoneCode();
        if (error && !isAlreadyVerifiedError(error)) throw error;
        if (error) await refreshVerifiedAttempt();
        else {
          resend.start();
          setNotice('A fresh code has been sent to your phone.');
        }
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not resend the phone code.'));
      }
    });

  const handleCompleteProfile = () =>
    run(async () => {
      clearMessages();
      const validation: ProfileFieldErrors = {
        firstName:
          missingFields.includes('first_name') && !firstName.trim()
            ? 'First name is required.'
            : undefined,
        lastName:
          missingFields.includes('last_name') && !lastName.trim()
            ? 'Last name is required.'
            : undefined,
        username:
          missingFields.includes('username') && !username.trim()
            ? 'Username is required.'
            : undefined,
        legalAccepted:
          missingFields.includes('legal_accepted') && !legalAccepted
            ? 'Please accept the terms to continue.'
            : undefined,
      };
      setProfileErrors(validation);
      if (hasFieldErrors(validation)) return;

      const updates: SignUpFutureUpdateParams = {};
      if (missingFields.includes('first_name')) updates.firstName = firstName.trim();
      if (missingFields.includes('last_name')) updates.lastName = lastName.trim();
      if (missingFields.includes('username')) updates.username = username.trim();
      if (missingFields.includes('legal_accepted')) updates.legalAccepted = legalAccepted;

      try {
        const { error } = await signUp.update(updates);
        if (error) throw error;
      } catch (error) {
        setFormError(getErrorMessage(error, 'We could not finish your profile.'));
      }
    });

  const handleStartOver = () =>
    run(async () => {
      clearMessages();
      const { error } = await signUp.reset();
      if (error) {
        setFormError(getErrorMessage(error, 'We could not restart sign up.'));
        return;
      }
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setEmailCode('');
      setPhoneCode('');
      setFieldErrors({});
      setCodeError(undefined);
      resend.reset();
    });

  const renderCredentials = () => (
    <>
      <AuthForm>
        <AuthField
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email ?? clerkErrors.fields.emailAddress?.longMessage}
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
          autoComplete="new-password"
          error={fieldErrors.password ?? clerkErrors.fields.password?.longMessage}
          helper="At least 8 characters. A passphrase works best."
          icon="lock-closed-outline"
          isPassword
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="Create a strong password"
          value={password}
        />
        <AuthField
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          icon="shield-checkmark-outline"
          isPassword
          label="Confirm password"
          onChangeText={(value) => {
            setConfirmPassword(value);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
          onSubmitEditing={handleCreateAccount}
          placeholder="Enter it once more"
          returnKeyType="done"
          value={confirmPassword}
        />
        <ClerkCaptcha />
        <AuthNotice message={formError} />
        <AuthButton label="Create secure account" loading={busy} onPress={handleCreateAccount} />
      </AuthForm>
    </>
  );

  const renderEmailCode = () => (
    <AuthForm>
      <AuthStepIntro icon="mail-unread-outline" title="Check your inbox">
        We sent a 6-digit code to{' '}
        <Text style={authTextStyles.emphasis}>{signUp.emailAddress ?? normalizeEmail(email)}</Text>.
      </AuthStepIntro>
      <AuthField
        autoComplete="one-time-code"
        error={codeError ?? clerkErrors.fields.code?.longMessage}
        icon="keypad-outline"
        inputMode="numeric"
        keyboardType="number-pad"
        label="Verification code"
        maxLength={6}
        onChangeText={(value) => {
          setEmailCode(value.replace(/\D/g, ''));
          setCodeError(undefined);
        }}
        onSubmitEditing={handleVerifyEmail}
        placeholder="000000"
        returnKeyType="done"
        textContentType="oneTimeCode"
        value={emailCode}
      />
      <AuthNotice message={formError} />
      <AuthNotice message={notice} tone="success" />
      <AuthButton label="Verify email" loading={busy} onPress={handleVerifyEmail} />
      <AuthTextButton
        disabled={busy || resend.isCoolingDown}
        label={resend.isCoolingDown ? `Resend code in ${resend.seconds}s` : 'Resend code'}
        onPress={handleResendEmail}
      />
      <AuthTextButton disabled={busy} label="Use a different email" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderPhone = () => (
    <AuthForm>
      <AuthStepIntro icon="phone-portrait-outline" title="Add your phone number">
        Your account settings require a verified phone number for extra security.
      </AuthStepIntro>
      <AuthField
        autoComplete="tel"
        error={phoneError ?? clerkErrors.fields.phoneNumber?.longMessage}
        helper="Include the country code, for example +923001234567."
        icon="call-outline"
        inputMode="tel"
        keyboardType="phone-pad"
        label="Phone number"
        onChangeText={(value) => {
          setPhoneNumber(value);
          setPhoneError(undefined);
        }}
        onSubmitEditing={handleAddPhone}
        placeholder="+923001234567"
        returnKeyType="done"
        value={phoneNumber}
      />
      <AuthNotice message={formError} />
      <AuthButton label="Send phone code" loading={busy} onPress={handleAddPhone} />
      <AuthTextButton disabled={busy} label="Start over" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderPhoneCode = () => (
    <AuthForm>
      <AuthStepIntro icon="chatbox-ellipses-outline" title="Verify your phone">
        Enter the 6-digit code sent to{' '}
        <Text style={authTextStyles.emphasis}>{signUp.phoneNumber}</Text>.
      </AuthStepIntro>
      <AuthField
        autoComplete="one-time-code"
        error={codeError ?? clerkErrors.fields.code?.longMessage}
        icon="keypad-outline"
        inputMode="numeric"
        keyboardType="number-pad"
        label="Phone verification code"
        maxLength={6}
        onChangeText={(value) => {
          setPhoneCode(value.replace(/\D/g, ''));
          setCodeError(undefined);
        }}
        onSubmitEditing={handleVerifyPhone}
        placeholder="000000"
        returnKeyType="done"
        textContentType="oneTimeCode"
        value={phoneCode}
      />
      <AuthNotice message={formError} />
      <AuthNotice message={notice} tone="success" />
      <AuthButton label="Verify phone" loading={busy} onPress={handleVerifyPhone} />
      <AuthTextButton
        disabled={busy || resend.isCoolingDown}
        label={resend.isCoolingDown ? `Resend code in ${resend.seconds}s` : 'Resend code'}
        onPress={handleResendPhone}
      />
      <AuthTextButton disabled={busy} label="Start over" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderProfile = () => (
    <AuthForm>
      <AuthStepIntro icon="person-circle-outline" title="Almost there">
        Add the remaining details required by your account security settings.
      </AuthStepIntro>
      {missingFields.includes('first_name') ? (
        <AuthField
          autoComplete="given-name"
          error={profileErrors.firstName ?? clerkErrors.fields.firstName?.longMessage}
          icon="person-outline"
          label="First name"
          onChangeText={(value) => {
            setFirstName(value);
            setProfileErrors((current) => ({ ...current, firstName: undefined }));
          }}
          placeholder="Your first name"
          value={firstName}
        />
      ) : null}
      {missingFields.includes('last_name') ? (
        <AuthField
          autoComplete="family-name"
          error={profileErrors.lastName ?? clerkErrors.fields.lastName?.longMessage}
          icon="person-outline"
          label="Last name"
          onChangeText={(value) => {
            setLastName(value);
            setProfileErrors((current) => ({ ...current, lastName: undefined }));
          }}
          placeholder="Your last name"
          value={lastName}
        />
      ) : null}
      {missingFields.includes('username') ? (
        <AuthField
          autoCapitalize="none"
          autoComplete="username-new"
          error={profileErrors.username ?? clerkErrors.fields.username?.longMessage}
          icon="at-outline"
          label="Username"
          onChangeText={(value) => {
            setUsername(value.replace(/\s/g, ''));
            setProfileErrors((current) => ({ ...current, username: undefined }));
          }}
          placeholder="Choose a username"
          value={username}
        />
      ) : null}
      {missingFields.includes('legal_accepted') ? (
        <AuthCheckbox
          checked={legalAccepted}
          error={profileErrors.legalAccepted ?? clerkErrors.fields.legalAccepted?.longMessage}
          label="I agree to Savey's terms and privacy policy."
          onPress={() => {
            setLegalAccepted((current) => !current);
            setProfileErrors((current) => ({ ...current, legalAccepted: undefined }));
          }}
        />
      ) : null}
      <AuthNotice message={formError} />
      <AuthButton label="Finish creating account" loading={busy} onPress={handleCompleteProfile} />
      <AuthTextButton disabled={busy} label="Start over" onPress={handleStartOver} />
    </AuthForm>
  );

  const renderUnsupported = () => {
    const fields = unsupportedFields.map(getReadableFieldName).join(', ');
    const message = signUp.protectCheck
      ? 'Clerk Protect requested an advanced security challenge that this custom screen cannot display.'
      : `This Clerk instance requires additional fields: ${fields}.`;

    return (
      <AuthForm>
        <AuthStepIntro icon="options-outline" title="Account setting needs attention">
          Your account could not be completed with the enabled Clerk requirements.
        </AuthStepIntro>
        <AuthNotice message={message} tone="info" />
        <AuthNotice message={formError} />
        <AuthButton label="Start sign up again" loading={busy} onPress={handleStartOver} />
      </AuthForm>
    );
  };

  const renderFinalizing = () => (
    <AuthForm>
      <AuthStepIntro icon="checkmark-circle-outline" title="Your account is ready">
        We are securely starting your Savey session.
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
    credentials: renderCredentials,
    'email-code': renderEmailCode,
    phone: renderPhone,
    'phone-code': renderPhoneCode,
    profile: renderProfile,
    unsupported: renderUnsupported,
    finalizing: renderFinalizing,
  }[step]();

  return (
    <AuthScaffold
      footer={
        step === 'credentials' ? (
          <AuthRouteLink prompt="Already protecting your savings?" label="Sign in" href="/(auth)/sign-in" />
        ) : undefined
      }
      subtitle="Create one secure place for every subscription, renewal, and saving."
      title={step === 'credentials' ? 'Start saving smarter' : 'Secure your account'}
    >
      {content}
    </AuthScaffold>
  );
}
