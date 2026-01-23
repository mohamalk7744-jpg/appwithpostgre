import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, ScrollView, Pressable, TextInput, View, Modal, Alert, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function DiscountsScreen() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const utils = trpc.useUtils();
  const { data: discounts, isLoading } = trpc.discounts.list.useQuery();

  const createDiscount = trpc.discounts.create.useMutation({
    onSuccess: () => {
      utils.discounts.list.invalidate();
      setIsAdding(false);
      resetForm();
      Alert.alert("تم بنجاح", "تم إضافة العرض الجديد");
    },
  });

  const deleteDiscount = trpc.discounts.delete.useMutation({
    onSuccess: () => {
      utils.discounts.list.invalidate();
      Alert.alert("تم بنجاح", "تم حذف العرض");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCompany("");
    setDiscountType("percentage");
    setDiscountValue("");
  };

  const handleAdd = () => {
    if (!title || !company || !discountValue) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    createDiscount.mutate({
      title,
      description,
      company,
      discountType,
      discountValue: parseInt(discountValue),
    });
  };

  const handleDelete = (id: number) => {
    Alert.alert("تأكيد الحذف", "هل أنت متأكد من حذف هذا العرض؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => deleteDiscount.mutate({ id }) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">إدارة العروض والخصومات</ThemedText>
        <Pressable style={styles.addButton} onPress={() => setIsAdding(true)}>
          <ThemedText style={styles.addButtonText}>+ إضافة عرض</ThemedText>
        </Pressable>
      </ThemedView>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF9500" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={styles.listContainer}>
          {discounts?.map((discount) => (
            <View key={discount.id} style={styles.card}>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{discount.title}</ThemedText>
                <ThemedText style={styles.cardSubtitle}>{discount.company}</ThemedText>
                <ThemedText style={styles.cardDescription}>{discount.description}</ThemedText>
                <View style={[styles.badge, discount.discountType === "percentage" ? styles.percentageBadge : styles.fixedBadge]}>
                  <ThemedText style={styles.badgeText}>
                    {discount.discountValue} {discount.discountType === "percentage" ? "%" : "ريال"}
                  </ThemedText>
                </View>
              </View>
              <Pressable style={styles.deleteButton} onPress={() => handleDelete(discount.id)}>
                <ThemedText style={styles.deleteButtonText}>حذف</ThemedText>
              </Pressable>
            </View>
          ))}
          {discounts?.length === 0 && (
            <ThemedText style={styles.emptyText}>لا توجد عروض حالياً</ThemedText>
          )}
        </ScrollView>
      )}

      <Modal visible={isAdding} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>إضافة عرض جديد</ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="عنوان العرض (مثلاً: خصم صيفي)"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
            
            <TextInput
              style={styles.input}
              placeholder="اسم الشركة أو الجهة"
              placeholderTextColor="#888"
              value={company}
              onChangeText={setCompany}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="وصف العرض"
              placeholderTextColor="#888"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.row}>
              <ThemedText style={{ flex: 1 }}>نوع الخصم:</ThemedText>
              <Pressable 
                style={[styles.typeBtn, discountType === "percentage" && styles.activeTypeBtn]} 
                onPress={() => setDiscountType("percentage")}
              >
                <ThemedText style={discountType === "percentage" && styles.activeTypeText}>نسبة %</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.typeBtn, discountType === "fixed" && styles.activeTypeBtn]} 
                onPress={() => setDiscountType("fixed")}
              >
                <ThemedText style={discountType === "fixed" && styles.activeTypeText}>مبلغ ثابت</ThemedText>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="القيمة (رقم فقط)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={discountValue}
              onChangeText={setDiscountValue}
            />

            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleAdd}
                disabled={createDiscount.isPending}
              >
                {createDiscount.isPending ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveBtnText}>حفظ العرض</ThemedText>}
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setIsAdding(false)}>
                <ThemedText style={styles.cancelBtnText}>إلغاء</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  addButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  cardTitle: {
    fontSize: 18,
    textAlign: "right",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#FF9500",
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  badge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  percentageBadge: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
  },
  fixedBadge: {
    backgroundColor: "rgba(52, 199, 89, 0.1)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  deleteButton: {
    marginLeft: 12,
    padding: 8,
  },
  deleteButtonText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: "right",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  activeTypeBtn: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
  },
  activeTypeText: {
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#FF9500",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelBtn: {
    backgroundColor: "#eee",
  },
  cancelBtnText: {
    color: "#333",
  },
});
