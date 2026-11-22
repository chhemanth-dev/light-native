package com.lightnative.app

import android.content.ContentResolver
import android.provider.ContactsContract
import com.facebook.react.bridge.*

/**
 * ContactsModule - Access and search phone contacts
 * Enables Light to call/message contacts by name
 */
class ContactsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ContactsModule"

    /**
     * Get all contacts with phone numbers
     */
    @ReactMethod
    fun getAllContacts(promise: Promise) {
        try {
            val contacts = readContacts()
            val result = Arguments.createArray()
            
            for (contact in contacts) {
                val map = Arguments.createMap()
                map.putString("id", contact.id)
                map.putString("name", contact.name)
                map.putString("phoneNumber", contact.phoneNumber)
                result.pushMap(map)
            }
            
            promise.resolve(result)
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Contacts permission not granted", e)
        } catch (e: Exception) {
            promise.reject("READ_FAILED", "Failed to read contacts: ${e.message}", e)
        }
    }

    /**
     * Search contacts by name (fuzzy match)
     */
    @ReactMethod
    fun searchContacts(query: String, promise: Promise) {
        try {
            val allContacts = readContacts()
            val queryLower = query.lowercase()
            
            // Fuzzy search - match if name contains query
            val matches = allContacts.filter { contact ->
                contact.name.lowercase().contains(queryLower)
            }
            
            val result = Arguments.createArray()
            for (contact in matches) {
                val map = Arguments.createMap()
                map.putString("id", contact.id)
                map.putString("name", contact.name)
                map.putString("phoneNumber", contact.phoneNumber)
                result.pushMap(map)
            }
            
            promise.resolve(result)
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Contacts permission not granted", e)
        } catch (e: Exception) {
            promise.reject("SEARCH_FAILED", "Failed to search contacts: ${e.message}", e)
        }
    }

    /**
     * Get phone number for a contact name (first match)
     */
    @ReactMethod
    fun getPhoneNumber(name: String, promise: Promise) {
        try {
            val allContacts = readContacts()
            val nameLower = name.lowercase()
            
            // Find first match
            val match = allContacts.firstOrNull { contact ->
                contact.name.lowercase().contains(nameLower)
            }
            
            if (match != null) {
                promise.resolve(match.phoneNumber)
            } else {
                promise.reject("NOT_FOUND", "No contact found with name: $name")
            }
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Contacts permission not granted", e)
        } catch (e: Exception) {
            promise.reject("GET_FAILED", "Failed to get phone number: ${e.message}", e)
        }
    }

    /**
     * Check if contacts permission is granted
     */
    @ReactMethod
    fun hasPermission(promise: Promise) {
        try {
            val hasPermission = reactContext.checkSelfPermission(
                android.Manifest.permission.READ_CONTACTS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("CHECK_FAILED", "Failed to check permission: ${e.message}", e)
        }
    }

    /**
     * Request contacts permission
     */
    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            val activity = reactContext.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No activity available")
                return
            }
            
            // This will show the permission dialog
            activity.requestPermissions(
                arrayOf(android.Manifest.permission.READ_CONTACTS),
                REQUEST_CONTACTS_PERMISSION
            )
            
            // Note: Result comes via onRequestPermissionsResult
            // For now, just resolve - app will need to check again
            promise.resolve("Permission requested")
        } catch (e: Exception) {
            promise.reject("REQUEST_FAILED", "Failed to request permission: ${e.message}", e)
        }
    }

    /**
     * Internal: Read all contacts from device
     */
    private fun readContacts(): List<Contact> {
        val contacts = mutableListOf<Contact>()
        val contentResolver: ContentResolver = reactContext.contentResolver
        
        val cursor = contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            arrayOf(
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            ),
            null,
            null,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )
        
        cursor?.use {
            val idIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
            val nameIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numberIndex = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
            
            while (it.moveToNext()) {
                val id = it.getString(idIndex) ?: continue
                val name = it.getString(nameIndex) ?: continue
                val number = it.getString(numberIndex) ?: continue
                
                contacts.add(Contact(id, name, number))
            }
        }
        
        return contacts
    }

    private data class Contact(
        val id: String,
        val name: String,
        val phoneNumber: String
    )

    companion object {
        private const val REQUEST_CONTACTS_PERMISSION = 1001
    }
}
