/**
 * Contacts Management System
 * Import contacts from VCF file and call by name (no AI needed!)
 */

import { getDb } from './db';
import * as Crypto from 'expo-crypto';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  createdAt: number;
}

/**
 * Initialize contacts table
 */
export async function initContactsTable(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      email TEXT,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name COLLATE NOCASE);
  `);
  console.log('[Contacts] Table initialized');
}

/**
 * Add a contact manually
 */
export async function addContact(name: string, phoneNumber: string, email?: string): Promise<string> {
  const db = await getDb();
  const id = await Crypto.randomUUID();
  
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  await db.runAsync(
    `INSERT INTO contacts (id, name, phoneNumber, email, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [id, name, cleanPhone, email || null, Date.now()]
  );
  
  console.log('[Contacts] Added:', name, cleanPhone);
  return id;
}

/**
 * Get all contacts
 */
export async function getAllContacts(): Promise<Contact[]> {
  const db = await getDb();
  return db.getAllAsync<Contact>(`SELECT * FROM contacts ORDER BY name COLLATE NOCASE`);
}

/**
 * Search contacts by name (fuzzy match)
 * Safe - returns empty array if database not ready
 */
export async function searchContactsByName(query: string): Promise<Contact[]> {
  try {
    const db = await getDb();
    const lowerQuery = query.toLowerCase();
    
    return db.getAllAsync<Contact>(
      `SELECT * FROM contacts WHERE LOWER(name) LIKE ? ORDER BY name COLLATE NOCASE LIMIT 10`,
      [`%${lowerQuery}%`]
    );
  } catch (error) {
    console.error('[Contacts] Search failed:', error);
    return []; // Safe fallback
  }
}

/**
 * Get contact by exact name
 */
export async function getContactByName(name: string): Promise<Contact | null> {
  const db = await getDb();
  const results = await db.getAllAsync<Contact>(
    `SELECT * FROM contacts WHERE LOWER(name) = ? LIMIT 1`,
    [name.toLowerCase()]
  );
  return results.length > 0 ? results[0] : null;
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM contacts WHERE id = ?`, [id]);
  console.log('[Contacts] Deleted:', id);
}

/**
 * Update a contact
 */
export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  const db = await getDb();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.phoneNumber !== undefined) {
    fields.push('phoneNumber = ?');
    values.push(updates.phoneNumber.replace(/[\s\-\(\)]/g, ''));
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.runAsync(
    `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  console.log('[Contacts] Updated:', id);
}

/**
 * Parse VCF (vCard) file and import contacts
 * Supports VCF 2.1, 3.0, and 4.0 formats
 */
export async function importContactsFromVCF(vcfContent: string): Promise<number> {
  const contacts = parseVCF(vcfContent);
  let imported = 0;
  
  for (const contact of contacts) {
    if (contact.name && contact.phoneNumber) {
      try {
        await addContact(contact.name, contact.phoneNumber, contact.email);
        imported++;
      } catch (error) {
        console.error('[Contacts] Failed to import:', contact.name, error);
      }
    }
  }
  
  console.log('[Contacts] Imported', imported, 'contacts from VCF');
  return imported;
}

/**
 * Parse VCF file content
 */
function parseVCF(vcfContent: string): Array<{ name: string; phoneNumber: string; email?: string }> {
  const contacts: Array<{ name: string; phoneNumber: string; email?: string }> = [];
  const vcards = vcfContent.split(/BEGIN:VCARD/i).slice(1);
  
  for (const vcard of vcards) {
    let name = '';
    let phoneNumber = '';
    let email = '';
    
    const lines = vcard.split(/\r?\n/);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Parse name (FN field)
      if (trimmedLine.match(/^FN[;:](.+)/i)) {
        name = trimmedLine.split(/[;:]/)[1].trim();
      }
      // Fallback to N field if FN not found
      else if (!name && trimmedLine.match(/^N[;:](.+)/i)) {
        const parts = trimmedLine.split(/[;:]/)[1].split(';');
        // Format: LastName;FirstName;MiddleName
        name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
      }
      
      // Parse phone number (TEL field)
      else if (trimmedLine.match(/^TEL[;:](.+)/i)) {
        const telParts = trimmedLine.split(':');
        phoneNumber = telParts[telParts.length - 1].trim();
        // If we already have a number, skip (use first one)
        if (!phoneNumber || phoneNumber === 'undefined') {
          phoneNumber = telParts[telParts.length - 1].trim();
        }
      }
      
      // Parse email (EMAIL field)
      else if (trimmedLine.match(/^EMAIL[;:](.+)/i)) {
        const emailParts = trimmedLine.split(':');
        email = emailParts[emailParts.length - 1].trim();
      }
    }
    
    if (name && phoneNumber) {
      contacts.push({ name, phoneNumber, email: email || undefined });
    }
  }
  
  return contacts;
}

/**
 * Export contacts to VCF format
 */
export async function exportContactsToVCF(): Promise<string> {
  const contacts = await getAllContacts();
  const vcfLines: string[] = [];
  
  for (const contact of contacts) {
    vcfLines.push('BEGIN:VCARD');
    vcfLines.push('VERSION:3.0');
    vcfLines.push(`FN:${contact.name}`);
    vcfLines.push(`TEL;TYPE=CELL:${contact.phoneNumber}`);
    if (contact.email) {
      vcfLines.push(`EMAIL:${contact.email}`);
    }
    vcfLines.push('END:VCARD');
    vcfLines.push('');
  }
  
  return vcfLines.join('\n');
}

/**
 * Call a contact by name (no AI needed!)
 */
export async function callContactByName(name: string): Promise<{ success: boolean; phoneNumber?: string; message: string }> {
  // Search for contact
  const results = await searchContactsByName(name);
  
  if (results.length === 0) {
    return {
      success: false,
      message: `I don't have a contact named "${name}" in your phonebook, sir.`,
    };
  }
  
  if (results.length > 1) {
    // Multiple matches - use first one but inform user
    const contact = results[0];
    return {
      success: true,
      phoneNumber: contact.phoneNumber,
      message: `Calling ${contact.name} at ${contact.phoneNumber}. Note: I found ${results.length} contacts matching "${name}".`,
    };
  }
  
  // Exact match
  const contact = results[0];
  return {
    success: true,
    phoneNumber: contact.phoneNumber,
    message: `Calling ${contact.name} at ${contact.phoneNumber}.`,
  };
}
