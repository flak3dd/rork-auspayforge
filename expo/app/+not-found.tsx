import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>This route doesn't exist.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
