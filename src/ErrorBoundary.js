import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Catches render errors so the app shows a message instead of a blank / white screen.
 * Check the browser console (F12) for the same error + stack.
 */
export default class ErrorBoundary extends React.Component {
  state = { err: null };

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    console.error('[EcoPop render error]', err, info?.componentStack);
  }

  render() {
    if (this.state.err) {
      const msg = String(this.state.err?.message ?? this.state.err);
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Open DevTools (F12) → Console for details.'
              : 'Check Metro / device logs for details.'}
          </Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
            <Text style={styles.detail} selectable>
              {msg}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0F1923',
    padding: 24,
    paddingTop: 48,
    justifyContent: 'flex-start',
  },
  title: { color: '#FF6E7F', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  hint: { color: '#8BA4B8', fontSize: 14, marginBottom: 16 },
  scroll: { flexGrow: 0, maxHeight: '50%' },
  scrollInner: { paddingBottom: 24 },
  detail: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace' },
});
