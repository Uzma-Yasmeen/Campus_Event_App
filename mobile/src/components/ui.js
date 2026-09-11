import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet
} from 'react-native';
import { theme } from '../theme';

export function Button({ title, onPress, disabled, loading, variant = 'primary', style }) {
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        s.btn,
        isSecondary && s.btnSecondary,
        isDanger && s.btnDanger,
        (disabled || loading) && s.btnDisabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary || isDanger ? theme.colors.text : '#fff'} size="small" />
      ) : (
        <Text style={[s.btnText, (isSecondary || isDanger) && s.btnTextDark, isDanger && s.btnTextDanger]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({ label, hint, ...props }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.muted}
        style={s.input}
        autoCapitalize="none"
        {...props}
      />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Note({ message, kind = 'error' }) {
  if (!message) return null;
  return (
    <View style={[s.note, kind === 'ok' ? s.noteOk : s.noteError]}>
      <Text style={[s.noteText, { color: kind === 'ok' ? theme.colors.ok : theme.colors.danger }]}>
        {message}
      </Text>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function Tag({ text }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.ink,
    borderWidth: 1,
    borderColor: theme.colors.ink,
    borderRadius: theme.radius,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSecondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
  btnDanger: { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnTextDark: { color: theme.colors.text },
  btnTextDanger: { color: theme.colors.danger },

  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', color: theme.colors.text, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 15,
    color: theme.colors.text
  },
  hint: { fontSize: 12, color: theme.colors.muted, marginTop: 5 },

  note: { borderWidth: 1, borderRadius: theme.radius, padding: 11, marginBottom: 14 },
  noteError: { backgroundColor: '#fbf3f1', borderColor: '#e0c4bd' },
  noteOk: { backgroundColor: '#f1f7f3', borderColor: '#c2d8cb' },
  noteText: { fontSize: 14 },

  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius,
    padding: 32,
    alignItems: 'center'
  },
  emptyText: { color: theme.colors.muted, fontSize: 14, textAlign: 'center' },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f2ef',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  tagText: { fontSize: 12, color: theme.colors.muted }
});
