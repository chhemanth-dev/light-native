/**
 * Contacts Management Screen
 * Add, import, and manage contacts for voice calling
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  getAllContacts,
  addContact,
  deleteContact,
  importContactsFromVCF,
  exportContactsToVCF,
  type Contact,
} from '../src/lib/contacts';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setLoading(true);
      const allContacts = await getAllContacts();
      setContacts(allContacts);
    } catch (error) {
      console.error('[Contacts] Load error:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContact() {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number');
      return;
    }

    try {
      await addContact(newName.trim(), newPhone.trim(), newEmail.trim() || undefined);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setShowAddModal(false);
      await loadContacts();
      Alert.alert('Success', `Added ${newName} to contacts!`);
    } catch (error) {
      console.error('[Contacts] Add error:', error);
      Alert.alert('Error', 'Failed to add contact');
    }
  }

  async function handleDeleteContact(contact: Contact) {
    Alert.alert(
      'Delete Contact?',
      `Remove ${contact.name} from contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contact.id);
              await loadContacts();
              Alert.alert('Deleted', `${contact.name} removed from contacts`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  }

  async function handleImportVCF() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/vcard',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const vcfContent = await FileSystem.readAsStringAsync(fileUri);
      const imported = await importContactsFromVCF(vcfContent);
      
      await loadContacts();
      Alert.alert('Success!', `Imported ${imported} contact${imported !== 1 ? 's' : ''} from VCF file`);
    } catch (error) {
      console.error('[Contacts] Import error:', error);
      Alert.alert('Error', 'Failed to import contacts. Make sure the file is a valid VCF file.');
    }
  }

  async function handleExportVCF() {
    try {
      const vcfContent = await exportContactsToVCF();
      const fileUri = FileSystem.cacheDirectory + 'light_contacts.vcf';
      
      await FileSystem.writeAsStringAsync(fileUri, vcfContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/vcard',
          dialogTitle: 'Export Contacts',
        });
      } else {
        Alert.alert('Exported', `Contacts exported to: ${fileUri}`);
      }
    } catch (error) {
      console.error('[Contacts] Export error:', error);
      Alert.alert('Error', 'Failed to export contacts');
    }
  }

  const renderItem = ({ item }: { item: Contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactIcon}>👤</Text>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
          {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
        </View>
      </View>
      <Pressable
        style={styles.deleteBtn}
        onPress={() => handleDeleteContact(item)}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Contacts</Text>
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.actionsBar}>
        <Pressable style={styles.actionBtn} onPress={handleImportVCF}>
          <Text style={styles.actionBtnText}>📥 Import VCF</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleExportVCF}>
          <Text style={styles.actionBtnText}>📤 Export VCF</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Add contacts to call by name: "Hey Light, call Mom"
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📇</Text>
          <Text style={styles.emptyText}>No contacts yet</Text>
          <Text style={styles.emptySubText}>
            Add contacts manually or import from VCF file
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <FlatList
            data={contacts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        </>
      )}

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g., Mom, John Smith"
                placeholderTextColor="#64748B"
                autoFocus
              />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="e.g., +1234567890"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="e.g., name@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable style={styles.saveBtn} onPress={handleAddContact}>
                <Text style={styles.saveBtnText}>Save Contact</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050810' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 8 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { 
    color: '#E2E8F0', 
    fontSize: 20, 
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  actionsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0A0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: { color: '#93C5FD', fontSize: 13, fontWeight: '500' },

  infoBox: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#0A1829',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },

  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#0A0F1E',
  },
  statsText: { color: '#64748B', fontSize: 13 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#64748B', fontSize: 16 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { 
    color: '#E2E8F0', 
    fontSize: 18, 
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: { 
    color: '#64748B', 
    fontSize: 14, 
    textAlign: 'center',
  },

  list: { 
    padding: 16, 
    paddingBottom: 100,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A0F1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  contactIcon: { fontSize: 32 },
  contactDetails: { flex: 1 },
  contactName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    color: '#3B82F6',
    fontSize: 14,
    marginBottom: 2,
  },
  contactEmail: {
    color: '#64748B',
    fontSize: 12,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FEE2E2',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: { color: '#E2E8F0', fontSize: 20, fontWeight: '600' },
  modalClose: { color: '#64748B', fontSize: 24 },
  modalBody: { padding: 20 },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#E2E8F0',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
