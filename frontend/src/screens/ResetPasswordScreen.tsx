import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/person';
import AuthTextField from '../components/AuthTextField';
import PrimaryButton from '../components/PrimaryButton';
import AnimatedLogo from '../components/AnimatedLogo';
import { useThemeColors } from '../useThemeColors';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/authApi';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const colors = useThemeColors();
  const { email } = route.params;
  const { resetPassword, forgotPassword } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code we emailed you.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, code.trim(), newPassword);
      // On success, AppNavigator swaps to the main app stack automatically.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await forgotPassword(email);
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AnimatedLogo size={64} emoji="🔑" />
        <Text style={[styles.title, { color: colors.text }]}>Enter your reset code</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          We sent a 6-digit code to {email}. Enter it along with your new password.
        </Text>

        <AuthTextField
          label="Reset code"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
        />
        <AuthTextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          autoCapitalize="none"
        />
        <AuthTextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your new password"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={[styles.formError, { color: colors.danger }]}>{error}</Text> : null}
        {info ? <Text style={[styles.formInfo, { color: colors.success }]}>{info}</Text> : null}

        <PrimaryButton title="Reset Password" onPress={handleSubmit} disabled={submitting} />

        <Pressable onPress={handleResend} disabled={resending} style={styles.linkRow}>
          <Text style={[styles.link, { color: colors.primary, opacity: resending ? 0.5 : 1 }]}>
            Resend code
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={[styles.link, { color: colors.subtext }]}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 28 },
  formError: { fontSize: 14, marginBottom: 14, textAlign: 'center' },
  formInfo: { fontSize: 14, marginBottom: 14, textAlign: 'center' },
  linkRow: { alignItems: 'center', marginTop: 16 },
  link: { fontSize: 14, fontWeight: '700' },
});
