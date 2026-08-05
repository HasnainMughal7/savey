import { colors, spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type AuthScaffoldProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  helper?: string;
  icon: IoniconName;
  isPassword?: boolean;
};

type AuthButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  icon?: IoniconName;
};

type AuthNoticeProps = {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
};

export function AuthScaffold({ title, subtitle, footer, children }: AuthScaffoldProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View pointerEvents="none" style={[styles.decoration, styles.decorationTop]} />
          <View pointerEvents="none" style={[styles.decoration, styles.decorationBottom]} />

          <View style={styles.pageWidth}>
            <View style={styles.brandBlock}>
              <View style={styles.logoWrap} accessibilityLabel="Savey, smart subscriptions">
                <View style={styles.logoMark}>
                  <Text style={styles.logoMarkText}>S</Text>
                </View>
                <View>
                  <Text style={styles.wordmark}>Savey</Text>
                  <Text style={styles.wordmarkSub}>Smart subscriptions</Text>
                </View>
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.card}>{children}</View>
            {footer}

            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.mutedForeground} />
              <Text style={styles.trustText}>Secure authentication powered by Clerk</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthField({
  label,
  error,
  helper,
  icon,
  isPassword = false,
  secureTextEntry,
  ...inputProps
}: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shouldHideText = isPassword ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputShellError : undefined]}>
        <Ionicons name={icon} size={20} color={error ? colors.destructive : colors.mutedForeground} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.accent}
          secureTextEntry={shouldHideText}
          accessibilityLabel={label}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            hitSlop={12}
            onPress={() => setIsPasswordVisible((current) => !current)}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={21}
              color={colors.mutedForeground}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
}: AuthButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        isDisabled ? styles.buttonDisabled : undefined,
        pressed && !isDisabled ? styles.buttonPressed : undefined,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primary : colors.accent} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? (
            <Ionicons name={icon} size={20} color={isPrimary ? colors.primary : colors.accent} />
          ) : null}
          <Text style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function AuthDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <View accessibilityRole="text" style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function AuthNotice({ message, tone = 'error' }: AuthNoticeProps) {
  if (!message) return null;

  const toneStyles = {
    error: {
      container: styles.noticeError,
      color: colors.destructive,
      icon: 'alert-circle-outline' as const,
    },
    info: {
      container: styles.noticeInfo,
      color: colors.primary,
      icon: 'information-circle-outline' as const,
    },
    success: {
      container: styles.noticeSuccess,
      color: colors.success,
      icon: 'checkmark-circle-outline' as const,
    },
  }[tone];

  return (
    <View accessibilityRole="alert" style={[styles.notice, toneStyles.container]}>
      <Ionicons name={toneStyles.icon} size={20} color={toneStyles.color} />
      <Text style={[styles.noticeText, { color: toneStyles.color }]}>{message}</Text>
    </View>
  );
}

export function AuthRouteLink({ prompt, label, href }: { prompt: string; label: string; href: Href }) {
  return (
    <View style={styles.routeLinkRow}>
      <Text style={styles.routeLinkPrompt}>{prompt}</Text>
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" hitSlop={8}>
          <Text style={styles.routeLink}>{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export function AuthTextButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.textButton,
        disabled ? styles.textButtonDisabled : undefined,
        pressed && !disabled ? styles.buttonPressed : undefined,
      ]}
    >
      <Text style={styles.textButtonText}>{label}</Text>
    </Pressable>
  );
}

export function AuthCheckbox({
  checked,
  onPress,
  label,
  error,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
  error?: string;
}) {
  return (
    <View style={styles.checkboxField}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onPress}
        style={({ pressed }) => [styles.checkboxRow, pressed ? styles.buttonPressed : undefined]}
      >
        <View style={[styles.checkbox, checked ? styles.checkboxChecked : undefined]}>
          {checked ? <Ionicons name="checkmark" size={16} color={colors.background} /> : null}
        </View>
        <Text style={styles.checkboxLabel}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function AuthStepIntro({
  icon,
  title,
  children,
}: PropsWithChildren<{ icon: IoniconName; title: string }>) {
  return (
    <View style={styles.stepIntro}>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={29} color={colors.accent} />
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{children}</Text>
    </View>
  );
}

export function AuthForm({ children }: PropsWithChildren) {
  return <View style={styles.form}>{children}</View>;
}

export function ClerkCaptcha() {
  return <View nativeID="clerk-captcha" />;
}

export const authTextStyles = StyleSheet.create({
  accent: {
    color: colors.accent,
    fontFamily: 'sans-bold',
  },
  emphasis: {
    color: colors.primary,
    fontFamily: 'sans-bold',
  },
  muted: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    position: 'relative',
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
    overflow: 'hidden',
  },
  pageWidth: {
    width: '100%',
    maxWidth: 480,
  },
  decoration: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(234, 122, 83, 0.1)',
  },
  decorationTop: {
    width: 230,
    height: 230,
    top: -110,
    right: -100,
  },
  decorationBottom: {
    width: 270,
    height: 270,
    bottom: -155,
    left: -125,
  },
  brandBlock: {
    zIndex: 1,
    alignItems: 'center',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  logoMark: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 26,
    backgroundColor: colors.accent,
  },
  logoMarkText: {
    color: colors.background,
    fontFamily: 'sans-extrabold',
    fontSize: 32,
  },
  wordmark: {
    color: colors.primary,
    fontFamily: 'sans-extrabold',
    fontSize: 33,
    lineHeight: 37,
  },
  wordmarkSub: {
    color: colors.mutedForeground,
    fontFamily: 'sans-semibold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontFamily: 'sans-extrabold',
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 350,
    marginTop: spacing[2],
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    zIndex: 1,
    width: '100%',
    marginTop: spacing[8],
    padding: Platform.OS === 'web' ? spacing[6] : spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  form: {
    gap: spacing[4],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    color: colors.primary,
    fontFamily: 'sans-semibold',
    fontSize: 14,
  },
  inputShell: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    backgroundColor: colors.background,
  },
  inputShellError: {
    borderColor: colors.destructive,
  },
  input: {
    minWidth: 0,
    flex: 1,
    paddingVertical: spacing[4],
    color: colors.primary,
    fontFamily: 'sans-medium',
    fontSize: 16,
  },
  errorText: {
    color: colors.destructive,
    fontFamily: 'sans-medium',
    fontSize: 12,
    lineHeight: 18,
  },
  helperText: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderRadius: 17,
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(234, 122, 83, 0.35)',
    borderRadius: 17,
    backgroundColor: 'rgba(234, 122, 83, 0.1)',
  },
  primaryButtonText: {
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontFamily: 'sans-semibold',
    fontSize: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 12,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: 16,
  },
  noticeError: {
    borderColor: 'rgba(220, 38, 38, 0.24)',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  noticeInfo: {
    borderColor: 'rgba(8, 17, 38, 0.16)',
    backgroundColor: 'rgba(8, 17, 38, 0.04)',
  },
  noticeSuccess: {
    borderColor: 'rgba(22, 163, 74, 0.24)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  noticeText: {
    minWidth: 0,
    flex: 1,
    fontFamily: 'sans-medium',
    fontSize: 14,
    lineHeight: 20,
  },
  routeLinkRow: {
    zIndex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[5],
  },
  routeLinkPrompt: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 14,
  },
  routeLink: {
    color: colors.accent,
    fontFamily: 'sans-bold',
    fontSize: 14,
  },
  textButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  textButtonDisabled: {
    opacity: 0.45,
  },
  textButtonText: {
    color: colors.accent,
    fontFamily: 'sans-semibold',
    fontSize: 14,
    textAlign: 'center',
  },
  checkboxField: {
    gap: spacing[2],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  checkbox: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 7,
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 13,
    lineHeight: 21,
  },
  stepIntro: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  stepIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderRadius: 29,
    backgroundColor: 'rgba(234, 122, 83, 0.15)',
  },
  stepTitle: {
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 21,
    lineHeight: 28,
    textAlign: 'center',
  },
  stepDescription: {
    marginTop: spacing[2],
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  trustRow: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing[5],
  },
  trustText: {
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 12,
  },
});
