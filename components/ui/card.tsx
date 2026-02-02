import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ViewProps, StyleProp, ViewStyle } from "react-native";

// Explicitly add style to CardProps to ensure TypeScript recognizes it from ViewProps
interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <ThemedView style={[styles.card, style]} {...props}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
});
