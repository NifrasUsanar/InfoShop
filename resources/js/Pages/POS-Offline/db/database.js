import Dexie from 'dexie';

// Initialize Dexie Database
export const db = new Dexie('POSOfflineDB');

// Define database schema
db.version(1).stores({
    // Products table - Indexes: id (primary), name, sku, barcode for fast search
    products: '&id, name, sku, barcode, batch_number, category_id, collection_id, is_featured',

    // Contacts table - Customers, suppliers, etc.
    contacts: '&id, name, email, phone, type',

    // Charges table - Taxes, fees, etc.
    charges: '&id, name, charge_type, is_active, is_default',

    // Collections table - Categories, tags, brands (hierarchical)
    collections: '&id, name, collection_type, parent_id',

    // Metadata for tracking sync state
    syncMetadata: '&key, lastSyncedAt'
});

// Table helpers
export const productsTable = db.products;
export const contactsTable = db.contacts;
export const chargesTable = db.charges;
export const collectionsTable = db.collections;
export const syncMetadataTable = db.syncMetadata;

// Initialize database
export async function initDatabase() {
    try {
        await db.open();
        console.log('✅ Dexie database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Dexie database:', error);
        return false;
    }
}

// Clear all data (useful for debugging)
export async function clearDatabase() {
    try {
        await db.products.clear();
        await db.syncMetadata.clear();
        console.log('✅ Database cleared');
    } catch (error) {
        console.error('❌ Failed to clear database:', error);
    }
}

export default db;
