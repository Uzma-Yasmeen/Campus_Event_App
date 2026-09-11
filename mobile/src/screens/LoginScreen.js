import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Button, Field, Note } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Logo size={30} />
        <Text style={s.heading}>Campus Events</Text>
        <Text style={s.sub}>Sign in to browse and register for events at your institution.</Text>

        <View style={s.card}>
          <Note message={error} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@university.edu"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
          />
          <Button title="Sign in" onPress={submit} loading={busy} />
          <Button
            title="Create an account"
            variant="secondary"
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bg },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  heading: { fontSize: 20, fontWeight: '600', color: theme.colors.text, marginTop: 14 },
  sub: { fontSize: 14, color: theme.colors.muted, marginTop: 4, marginBottom: 22 },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: 18
  }
});
