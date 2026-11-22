/**
 * Contacts Bridge - Access phone contacts for calls/messages
 */
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const ContactsModule = Platform.OS === 'android' ? NativeModules.ContactsModule : null;

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

/**
 * Request contacts permission
 */
export async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: 'Contacts Permission',
        message: 'Light needs access to your contacts to call people by name.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[Contacts] Permission request error:', err);
    return false;
  }
}

/**
 * Check if contacts permission is granted
 */
export async function hasContactsPermission(): Promise<boolean> {
  if (!ContactsModule) return false;

  try {
    return await ContactsModule.hasPermission();
  } catch (error) {
    console.error('[Contacts] Permission check failed:', error);
    return false;
  }
}

/**
 * Get all contacts
 */
export async function getAllContacts(): Promise<Contact[]> {
  if (!ContactsModule) return [];

  try {
    return await ContactsModule.getAllContacts();
  } catch (error) {
    console.error('[Contacts] Failed to get contacts:', error);
    return [];
  }
}

/**
 * Search contacts by name (fuzzy match)
 */
export async function searchContacts(query: string): Promise<Contact[]> {
  if (!ContactsModule) return [];

  try {
    return await ContactsModule.searchContacts(query);
  } catch (error) {
    console.error('[Contacts] Search failed:', error);
    return [];
  }
}

/**
 * Get phone number for a contact name
 */
export async function getPhoneNumber(name: string): Promise<string | null> {
  if (!ContactsModule) return null;

  try {
    return await ContactsModule.getPhoneNumber(name);
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return null;
    }
    console.error('[Contacts] Get phone number failed:', error);
    return null;
  }
}

/**
 * Smart contact lookup - handles "call mom", "message john", etc.
 */
export async function smartContactLookup(input: string): Promise<Contact | null> {
  // Extract name from phrases like:
  // - "call mom"
  // - "message john"
  // - "text sarah"
  // - "phone dad"
  
  const lower = input.toLowerCase().trim();
  
  // Remove common prefixes
  const prefixes = ['call', 'phone', 'message', 'text', 'sms', 'ring', 'dial'];
  let name = lower;
  
  for (const prefix of prefixes) {
    if (name.startsWith(prefix + ' ')) {
      name = name.substring(prefix.length + 1).trim();
      break;
    }
  }
  
  if (!name) return null;
  
  // Search contacts
  const results = await searchContacts(name);
  
  if (results.length === 0) return null;
  
  // Return best match (first result is usually best due to sorted query)
  return results[0];
}
