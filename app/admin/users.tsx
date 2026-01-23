import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { trpc } from '@/lib/trpc';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ManageUsers() {
  const colorScheme = useColorScheme();
  const utils = trpc.useUtils();
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries & Mutations
  const { data: users, isLoading, refetch } = trpc.users.listAll.useQuery();
  const createUserMutation = trpc.users.create.useMutation();
  const deleteUserMutation = trpc.users.delete.useMutation();

  const handleCreateUser = async () => {
    if (!name || !email) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم والبريد الإلكتروني');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserMutation.mutateAsync({
        name,
        email,
        role,
      });
      Alert.alert('نجاح', 'تم إضافة المستخدم بنجاح');
      setIsModalVisible(false);
      setName('');
      setEmail('');
      setRole('user');
      utils.users.listAll.invalidate();
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (id: number, userName: string) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المستخدم "${userName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserMutation.mutateAsync({ id });
              utils.users.listAll.invalidate();
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف المستخدم');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">إدارة المستخدمين</ThemedText>
        <Pressable 
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <ThemedText style={styles.addButtonText}>إضافة مستخدم</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.userList}>
        {users?.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? '#EF4444' : '#3B82F6' }]}>
                <ThemedText style={styles.roleText}>{user.role === 'admin' ? 'مسؤول' : 'طالب'}</ThemedText>
              </View>
              <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
              <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
            </View>
            <Pressable 
              style={styles.deleteButton}
              onPress={() => handleDeleteUser(user.id, user.name || '')}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>إضافة مستخدم جديد</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>الاسم</ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="اسم المستخدم"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>البريد الإلكتروني</ThemedText>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="example@mail.com"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>الدور</ThemedText>
              <View style={styles.roleSelector}>
                <Pressable 
                  style={[styles.roleOption, role === 'user' && styles.roleOptionActive]}
                  onPress={() => setRole('user')}
                >
                  <ThemedText style={[styles.roleOptionText, role === 'user' && styles.roleOptionTextActive]}>طالب</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.roleOption, role === 'admin' && styles.roleOptionActive]}
                  onPress={() => setRole('admin')}
                >
                  <ThemedText style={[styles.roleOptionText, role === 'admin' && styles.roleOptionTextActive]}>مسؤول</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <ThemedText>إلغاء</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreateUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>حفظ</ThemedText>
                )}
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row-reverse',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
