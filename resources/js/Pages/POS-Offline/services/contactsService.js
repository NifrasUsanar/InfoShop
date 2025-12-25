import { contactsTable } from '../db/database';

/**
 * Contacts Service - Handles all contact-related Dexie operations
 * Contacts include customers, suppliers, etc.
 */

// Get all contacts
export async function getAllContacts() {
    try {
        const contacts = await contactsTable.toArray();
        console.log(`👥 Loaded ${contacts.length} contacts from Dexie`);
        return contacts;
    } catch (error) {
        console.error('❌ Error loading contacts:', error);
        return [];
    }
}

// Get contacts count
export async function getContactsCount() {
    try {
        return await contactsTable.count();
    } catch (error) {
        console.error('❌ Error counting contacts:', error);
        return 0;
    }
}

// Get contact by ID
export async function getContactById(id) {
    try {
        return await contactsTable.get(id);
    } catch (error) {
        console.error('❌ Error getting contact:', error);
        return null;
    }
}

// Get contacts by type
export async function getContactsByType(type) {
    try {
        const contacts = await contactsTable
            .where('type')
            .equals(type)
            .toArray();
        console.log(`👤 Found ${contacts.length} contacts of type ${type}`);
        return contacts;
    } catch (error) {
        console.error('❌ Error getting contacts by type:', error);
        return [];
    }
}

// Get customers only
export async function getCustomers() {
    try {
        return await getContactsByType('customer');
    } catch (error) {
        console.error('❌ Error getting customers:', error);
        return [];
    }
}

// Get suppliers only
export async function getSuppliers() {
    try {
        return await getContactsByType('supplier');
    } catch (error) {
        console.error('❌ Error getting suppliers:', error);
        return [];
    }
}

// Search contacts by name, email, or phone
export async function searchContacts(query) {
    try {
        const lowerQuery = query.toLowerCase();
        
        const contacts = await contactsTable
            .filter(contact => {
                return (
                    contact.name?.toLowerCase().includes(lowerQuery) ||
                    contact.email?.toLowerCase().includes(lowerQuery) ||
                    contact.phone?.includes(query)
                );
            })
            .limit(50)
            .toArray();
        
        console.log(`🔍 Found ${contacts.length} contacts matching "${query}"`);
        return contacts;
    } catch (error) {
        console.error('❌ Error searching contacts:', error);
        return [];
    }
}

// Bulk insert/update contacts (for sync)
export async function bulkUpsertContacts(contacts) {
    try {
        await contactsTable.bulkPut(contacts);
        console.log(`✅ Synced ${contacts.length} contacts to Dexie`);
        return true;
    } catch (error) {
        console.error('❌ Error syncing contacts:', error);
        return false;
    }
}

// Clear all contacts
export async function clearAllContacts() {
    try {
        await contactsTable.clear();
        console.log('✅ All contacts cleared from Dexie');
        return true;
    } catch (error) {
        console.error('❌ Error clearing contacts:', error);
        return false;
    }
}

export default {
    getAllContacts,
    getContactById,
    getContactsByType,
    getCustomers,
    getSuppliers,
    searchContacts,
    bulkUpsertContacts,
    clearAllContacts,
};
