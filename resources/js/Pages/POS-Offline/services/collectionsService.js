import { collectionsTable } from '../db/database';

/**
 * Collections Service - Handles all collection-related Dexie operations
 * Collections include categories, tags, brands, etc.
 */

// Get all collections
export async function getAllCollections() {
    try {
        const collections = await collectionsTable.toArray();
        console.log(`📁 Loaded ${collections.length} collections from Dexie`);
        return collections;
    } catch (error) {
        console.error('❌ Error loading collections:', error);
        return [];
    }
}

// Get collections count
export async function getCollectionsCount() {
    try {
        return await collectionsTable.count();
    } catch (error) {
        console.error('❌ Error counting collections:', error);
        return 0;
    }
}

// Get collection by ID
export async function getCollectionById(id) {
    try {
        return await collectionsTable.get(id);
    } catch (error) {
        console.error('❌ Error getting collection:', error);
        return null;
    }
}

// Get collections by type
export async function getCollectionsByType(collectionType) {
    try {
        const collections = await collectionsTable
            .where('collection_type')
            .equals(collectionType)
            .toArray();
        console.log(`📂 Found ${collections.length} collections of type ${collectionType}`);
        return collections;
    } catch (error) {
        console.error('❌ Error getting collections by type:', error);
        return [];
    }
}

// Get root collections (no parent)
export async function getRootCollections() {
    try {
        // Can't query for null/undefined in IndexedDB, so filter in memory
        const allCollections = await collectionsTable.toArray();
        const rootCollections = allCollections.filter(c => !c.parent_id);

        console.log(`🌳 Found ${rootCollections.length} root collections`);
        return rootCollections;
    } catch (error) {
        console.error('❌ Error getting root collections:', error);
        return [];
    }
}

// Get child collections by parent ID
export async function getChildCollections(parentId) {
    try {
        const collections = await collectionsTable
            .where('parent_id')
            .equals(parentId)
            .toArray();
        console.log(`👶 Found ${collections.length} child collections for parent ${parentId}`);
        return collections;
    } catch (error) {
        console.error('❌ Error getting child collections:', error);
        return [];
    }
}

// Get hierarchical collections (with children)
export async function getHierarchicalCollections() {
    try {
        const allCollections = await collectionsTable.toArray();
        
        // Build hierarchy
        const collectionsMap = {};
        const rootCollections = [];
        
        // First pass: create map and identify roots
        allCollections.forEach(collection => {
            collectionsMap[collection.id] = { ...collection, children: [] };
            if (!collection.parent_id) {
                rootCollections.push(collectionsMap[collection.id]);
            }
        });
        
        // Second pass: attach children to parents
        allCollections.forEach(collection => {
            if (collection.parent_id && collectionsMap[collection.parent_id]) {
                collectionsMap[collection.parent_id].children.push(collectionsMap[collection.id]);
            }
        });
        
        console.log(`🌳 Built hierarchy with ${rootCollections.length} root collections`);
        return rootCollections;
    } catch (error) {
        console.error('❌ Error building collection hierarchy:', error);
        return [];
    }
}

// Bulk insert/update collections (for sync)
export async function bulkUpsertCollections(collections) {
    try {
        await collectionsTable.bulkPut(collections);
        console.log(`✅ Synced ${collections.length} collections to Dexie`);
        return true;
    } catch (error) {
        console.error('❌ Error syncing collections:', error);
        return false;
    }
}

// Clear all collections
export async function clearAllCollections() {
    try {
        await collectionsTable.clear();
        console.log('✅ All collections cleared from Dexie');
        return true;
    } catch (error) {
        console.error('❌ Error clearing collections:', error);
        return false;
    }
}

export default {
    getAllCollections,
    getCollectionById,
    getCollectionsByType,
    getRootCollections,
    getChildCollections,
    getHierarchicalCollections,
    bulkUpsertCollections,
    clearAllCollections,
};
