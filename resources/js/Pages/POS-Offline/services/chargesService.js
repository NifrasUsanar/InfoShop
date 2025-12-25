import { chargesTable } from '../db/database';

/**
 * Charges Service - Handles all charge-related Dexie operations
 */

// Get all active charges
export async function getAllCharges() {
    try {
        const allCharges = await chargesTable.toArray();
        const activeCharges = allCharges.filter(c => c.is_active === true || c.is_active === 1);
        console.log(`💰 Loaded ${activeCharges.length} active charges from Dexie`);
        return activeCharges;
    } catch (error) {
        console.error('❌ Error loading charges:', error);
        return [];
    }
}

// Get charges count
export async function getChargesCount() {
    try {
        return await chargesTable.count();
    } catch (error) {
        console.error('❌ Error counting charges:', error);
        return 0;
    }
}

// Get default charges
export async function getDefaultCharges() {
    try {
        const allCharges = await chargesTable.toArray();
        const defaultCharges = allCharges.filter(c =>
            (c.is_default === true || c.is_default === 1) &&
            (c.is_active === true || c.is_active === 1)
        );
        console.log(`⭐ Loaded ${defaultCharges.length} default charges from Dexie`);
        return defaultCharges;
    } catch (error) {
        console.error('❌ Error loading default charges:', error);
        return [];
    }
}

// Get charge by ID
export async function getChargeById(id) {
    try {
        return await chargesTable.get(id);
    } catch (error) {
        console.error('❌ Error getting charge:', error);
        return null;
    }
}

// Get charges by type
export async function getChargesByType(chargeType) {
    try {
        const allCharges = await chargesTable.toArray();
        const filteredCharges = allCharges.filter(c =>
            c.charge_type === chargeType &&
            (c.is_active === true || c.is_active === 1)
        );
        console.log(`📋 Found ${filteredCharges.length} charges of type ${chargeType}`);
        return filteredCharges;
    } catch (error) {
        console.error('❌ Error getting charges by type:', error);
        return [];
    }
}

// Bulk insert/update charges (for sync)
export async function bulkUpsertCharges(charges) {
    try {
        await chargesTable.bulkPut(charges);
        console.log(`✅ Synced ${charges.length} charges to Dexie`);
        return true;
    } catch (error) {
        console.error('❌ Error syncing charges:', error);
        return false;
    }
}

// Clear all charges
export async function clearAllCharges() {
    try {
        await chargesTable.clear();
        console.log('✅ All charges cleared from Dexie');
        return true;
    } catch (error) {
        console.error('❌ Error clearing charges:', error);
        return false;
    }
}

export default {
    getAllCharges,
    getDefaultCharges,
    getChargeById,
    getChargesByType,
    bulkUpsertCharges,
    clearAllCharges,
};
