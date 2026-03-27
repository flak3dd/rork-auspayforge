import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface HTMLRendererProps {
  html: string;
  style?: object;
}

function HTMLRendererWeb({ html, style }: HTMLRendererProps) {
  return (
    <View style={[styles.container, style]}>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' } as any}
        sandbox="allow-same-origin"
      />
    </View>
  );
}

function HTMLRendererNative({ html, style }: HTMLRendererProps) {
  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scalesPageToFit={true}
        javaScriptEnabled={false}
        showsVerticalScrollIndicator={true}
        startInLoadingState={false}
      />
    </View>
  );
}

const HTMLRenderer = Platform.OS === 'web' ? HTMLRendererWeb : HTMLRendererNative;

export default React.memo(HTMLRenderer);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
