import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";

export default function DiscountsScreen() {
  const insets = useSafeAreaInsets();
  const { data: discounts, isLoading } = trpc.discounts.list.useQuery();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">العروض والحسومات</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>استفد من عروضنا الخاصة والحصرية</ThemedText>
      </ThemedView>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.discountsContainer}>
          {discounts?.map((discount) => (
            <View 
              key={discount.id}
              style={styles.discountCard}
            >
              <View style={styles.discountHeader}>
                <View style={styles.textContainer}>
                  <ThemedText type="defaultSemiBold" style={styles.company}>
                    {discount.company}
                  </ThemedText>
                  <ThemedText type="default" style={styles.description}>
                    {discount.description || discount.title}
                  </ThemedText>
                </View>
                <View style={[
                  styles.badgeContainer,
                  discount.discountType === "percentage" ? styles.percentageBadge : styles.fixedBadge
                ]}>
                  <ThemedText style={styles.badgeText}>
                    {discount.discountValue}{discount.discountType === "percentage" ? "%" : " ريال"}
                  </ThemedText>
                </View>
              </View>
              
              {discount.contactNumber && (
                <View style={styles.contactContainer}>
                  <ThemedText style={styles.contactLabel}>للمزيد من المعلومات تواصل مع هذا الرقم:</ThemedText>
                  <ThemedText style={styles.contactNumber}>{discount.contactNumber}</ThemedText>
                </View>
              )}
            </View>
          ))}

          {discounts?.length === 0 && (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>لا توجد عروض متوفرة حالياً</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Info Section */}
      <ThemedView style={styles.infoSection}>
        <ThemedText type="subtitle" style={styles.infoTitle}>💡 معلومة للطلاب</ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          جميع العروض المعروضة حصرية لطلاب منصتنا. يمكنك المطالبة بالحسم مباشرة عند زيارة المركز أو المعهد وتفعيل العرض من هاتفك.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right",
  },
  discountsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  discountCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#EEE",
    gap: 12,
  },
  discountCardPressed: {
    opacity: 0.8,
    backgroundColor: "#F0F0F0",
  },
  discountHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  company: {
    fontSize: 18,
    marginBottom: 2,
    color: "#000",
  },
  description: {
    fontSize: 13,
    color: "#666",
    textAlign: "right",
  },
  badgeContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  percentageBadge: {
    backgroundColor: "#FF9500",
  },
  fixedBadge: {
    backgroundColor: "#34C759",
  },
  badgeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  contactContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  contactNumber: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  infoTitle: {
    marginBottom: 8,
    textAlign: "right",
    color: "#0369A1",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#0C4A6E",
    textAlign: "right",
  },
});
