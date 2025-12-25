import axios from 'axios';
import { bulkUpsertProducts } from './productsService';
import { bulkUpsertCharges } from './chargesService';
import { bulkUpsertCollections } from './collectionsService';
import { bulkUpsertContacts } from './contactsService';
import { syncMetadataTable } from '../db/database';

/**
 * Sync Service - Handles syncing data from server to Dexie
 */

// Sync products from server
export async function syncProducts() {
    try {
        console.log('🔄 Starting product sync...');

        // Get last sync timestamp
        const lastSyncInfo = await getLastSyncInfo('products');
        const lastSyncTimestamp = lastSyncInfo?.lastSyncedAt
            ? new Date(lastSyncInfo.lastSyncedAt).getTime()
            : null;

        // Build URL with last_sync parameter for incremental sync
        const url = lastSyncTimestamp
            ? `/api/sync?table=products&last_sync=${lastSyncTimestamp}`
            : '/api/sync?table=products';

        console.log(`📊 Syncing products${lastSyncTimestamp ? ' (incremental from ' + new Date(lastSyncTimestamp).toLocaleString() + ')' : ' (full sync)'}`);

        // Fetch products from server using the dedicated sync endpoint
        const response = await axios.get(url);

        // Handle SyncController response format: { status, data, count, timestamp }
        const apiResponse = response.data;

        if (apiResponse.status !== 'success') {
            throw new Error(apiResponse.message || 'Sync failed');
        }

        const products = apiResponse.data || [];

        if (!Array.isArray(products)) {
            throw new Error('Invalid response format: expected array of products');
        }

        // Store products in Dexie
        const success = await bulkUpsertProducts(products);

        if (success) {
            // Update sync metadata using server's timestamp
            const serverTimestamp = apiResponse.timestamp
                ? new Date(apiResponse.timestamp).toISOString()
                : new Date().toISOString();

            await syncMetadataTable.put({
                key: 'products',
                lastSyncedAt: serverTimestamp,
                count: products.length,
            });

            console.log(`✅ Product sync completed: ${products.length} products synced`);
            return {
                success: true,
                count: products.length,
                timestamp: serverTimestamp,
            };
        } else {
            throw new Error('Failed to store products in Dexie');
        }
    } catch (error) {
        console.error('❌ Product sync failed:', error);

        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}

// Get last sync info
export async function getLastSyncInfo(key = 'products') {
    try {
        const metadata = await syncMetadataTable.get(key);
        return metadata || null;
    } catch (error) {
        console.error('❌ Error getting sync info:', error);
        return null;
    }
}

// Check if sync is needed (optional: based on time threshold)
export async function isSyncNeeded(key = 'products', thresholdMinutes = 60) {
    try {
        const metadata = await syncMetadataTable.get(key);
        
        if (!metadata || !metadata.lastSyncedAt) {
            return true; // Never synced
        }
        
        const lastSync = new Date(metadata.lastSyncedAt);
        const now = new Date();
        const diffMinutes = (now - lastSync) / 1000 / 60;
        
        return diffMinutes >= thresholdMinutes;
    } catch (error) {
        console.error('❌ Error checking sync status:', error);
        return true; // Assume sync needed if error
    }
}

// Sync charges from server
export async function syncCharges() {
    try {
        console.log('🔄 Starting charges sync...');

        // Get last sync timestamp
        const lastSyncInfo = await getLastSyncInfo('charges');
        const lastSyncTimestamp = lastSyncInfo?.lastSyncedAt
            ? new Date(lastSyncInfo.lastSyncedAt).getTime()
            : null;

        // Build URL with last_sync parameter for incremental sync
        const url = lastSyncTimestamp
            ? `/api/sync?table=charges&last_sync=${lastSyncTimestamp}`
            : '/api/sync?table=charges';

        console.log(`📊 Syncing charges${lastSyncTimestamp ? ' (incremental)' : ' (full sync)'}`);

        const response = await axios.get(url);
        const apiResponse = response.data;

        if (apiResponse.status !== 'success') {
            throw new Error(apiResponse.message || 'Charges sync failed');
        }

        const charges = apiResponse.data || [];

        if (!Array.isArray(charges)) {
            throw new Error('Invalid response format: expected array of charges');
        }

        const success = await bulkUpsertCharges(charges);

        if (success) {
            // Update sync metadata using server's timestamp
            const serverTimestamp = apiResponse.timestamp
                ? new Date(apiResponse.timestamp).toISOString()
                : new Date().toISOString();

            await syncMetadataTable.put({
                key: 'charges',
                lastSyncedAt: serverTimestamp,
                count: charges.length,
            });

            console.log(`✅ Charges sync completed: ${charges.length} charges synced`);
            return {
                success: true,
                count: charges.length,
                timestamp: serverTimestamp,
            };
        } else {
            throw new Error('Failed to store charges in Dexie');
        }
    } catch (error) {
        console.error('❌ Charges sync failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}

// Sync collections from server
export async function syncCollections() {
    try {
        console.log('🔄 Starting collections sync...');

        // Get last sync timestamp
        const lastSyncInfo = await getLastSyncInfo('collections');
        const lastSyncTimestamp = lastSyncInfo?.lastSyncedAt
            ? new Date(lastSyncInfo.lastSyncedAt).getTime()
            : null;

        // Build URL with last_sync parameter for incremental sync
        const url = lastSyncTimestamp
            ? `/api/sync?table=collections&last_sync=${lastSyncTimestamp}`
            : '/api/sync?table=collections';

        console.log(`📊 Syncing collections${lastSyncTimestamp ? ' (incremental)' : ' (full sync)'}`);

        const response = await axios.get(url);
        const apiResponse = response.data;

        if (apiResponse.status !== 'success') {
            throw new Error(apiResponse.message || 'Collections sync failed');
        }

        const collections = apiResponse.data || [];

        if (!Array.isArray(collections)) {
            throw new Error('Invalid response format: expected array of collections');
        }

        const success = await bulkUpsertCollections(collections);

        if (success) {
            // Update sync metadata using server's timestamp
            const serverTimestamp = apiResponse.timestamp
                ? new Date(apiResponse.timestamp).toISOString()
                : new Date().toISOString();

            await syncMetadataTable.put({
                key: 'collections',
                lastSyncedAt: serverTimestamp,
                count: collections.length,
            });

            console.log(`✅ Collections sync completed: ${collections.length} collections synced`);
            return {
                success: true,
                count: collections.length,
                timestamp: serverTimestamp,
            };
        } else {
            throw new Error('Failed to store collections in Dexie');
        }
    } catch (error) {
        console.error('❌ Collections sync failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}

// Sync contacts from server
export async function syncContacts() {
    try {
        console.log('🔄 Starting contacts sync...');

        // Get last sync timestamp
        const lastSyncInfo = await getLastSyncInfo('contacts');
        const lastSyncTimestamp = lastSyncInfo?.lastSyncedAt
            ? new Date(lastSyncInfo.lastSyncedAt).getTime()
            : null;

        // Build URL with last_sync parameter for incremental sync
        const url = lastSyncTimestamp
            ? `/api/sync?table=contacts&last_sync=${lastSyncTimestamp}`
            : '/api/sync?table=contacts';

        console.log(`📊 Syncing contacts${lastSyncTimestamp ? ' (incremental)' : ' (full sync)'}`);

        const response = await axios.get(url);
        const apiResponse = response.data;

        if (apiResponse.status !== 'success') {
            throw new Error(apiResponse.message || 'Contacts sync failed');
        }

        const contacts = apiResponse.data || [];

        if (!Array.isArray(contacts)) {
            throw new Error('Invalid response format: expected array of contacts');
        }

        const success = await bulkUpsertContacts(contacts);

        if (success) {
            // Update sync metadata using server's timestamp
            const serverTimestamp = apiResponse.timestamp
                ? new Date(apiResponse.timestamp).toISOString()
                : new Date().toISOString();

            await syncMetadataTable.put({
                key: 'contacts',
                lastSyncedAt: serverTimestamp,
                count: contacts.length,
            });

            console.log(`✅ Contacts sync completed: ${contacts.length} contacts synced`);
            return {
                success: true,
                count: contacts.length,
                timestamp: serverTimestamp,
            };
        } else {
            throw new Error('Failed to store contacts in Dexie');
        }
    } catch (error) {
        console.error('❌ Contacts sync failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}

// Sync all data (products, charges, collections, contacts)
export async function syncAll() {
    try {
        console.log('🔄 Starting full sync...');

        const results = await Promise.allSettled([
            syncProducts(),
            syncCharges(),
            syncCollections(),
            syncContacts(),
        ]);

        const summary = {
            products: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: 'Failed' },
            charges: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: 'Failed' },
            collections: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: 'Failed' },
            contacts: results[3].status === 'fulfilled' ? results[3].value : { success: false, error: 'Failed' },
        };

        const allSuccess = Object.values(summary).every(r => r.success);

        console.log('✅ Full sync completed:', summary);

        return {
            success: allSuccess,
            summary,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('❌ Full sync failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        };
    }
}

export default {
    syncProducts,
    syncCharges,
    syncCollections,
    syncContacts,
    syncAll,
    getLastSyncInfo,
    isSyncNeeded,
};
