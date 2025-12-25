import { productsTable } from '../db/database';

/**
 * Products Service - Handles all product-related Dexie operations
 */

// Get all products
export async function getAllProducts() {
    try {
        const products = await productsTable.toArray();
        console.log(`📦 Loaded ${products.length} products from Dexie`);
        return products;
    } catch (error) {
        console.error('❌ Error loading products:', error);
        return [];
    }
}

// Get product by ID
export async function getProductById(id) {
    try {
        return await productsTable.get(id);
    } catch (error) {
        console.error('❌ Error getting product:', error);
        return null;
    }
}

// Search products (name, sku, barcode) - Optimized with indexed queries
export async function searchProducts(query) {
    try {
        const lowerQuery = query.toLowerCase();

        // Use indexed 'where' for exact matches first (fastest)
        const barcodeMatches = await productsTable
            .where('barcode')
            .startsWithIgnoreCase(query)
            .toArray();

        // If barcode match found, return immediately (common for barcode scanners)
        if (barcodeMatches.length > 0) {
            console.log(`🔍 Found ${barcodeMatches.length} products by barcode "${query}"`);
            return barcodeMatches;
        }

        // Try SKU index
        const skuMatches = await productsTable
            .where('sku')
            .startsWithIgnoreCase(query)
            .toArray();

        if (skuMatches.length > 0) {
            console.log(`🔍 Found ${skuMatches.length} products by SKU "${query}"`);
            return skuMatches;
        }

        // Fallback to name search (slower but necessary for partial matches)
        const products = await productsTable
            .filter(product => {
                return product.name?.toLowerCase().includes(lowerQuery);
            })
            .limit(50) // Limit results to prevent performance issues
            .toArray();

        console.log(`🔍 Found ${products.length} products by name "${query}"`);
        return products;
    } catch (error) {
        console.error('❌ Error searching products:', error);
        return [];
    }
}

// Get products by category
export async function getProductsByCategory(categoryId) {
    try {
        const products = await productsTable
            .where('category_id')
            .equals(categoryId)
            .toArray();
        
        console.log(`📂 Found ${products.length} products in category ${categoryId}`);
        return products;
    } catch (error) {
        console.error('❌ Error getting products by category:', error);
        return [];
    }
}

// Get featured products
export async function getFeaturedProducts() {
    try {
        const products = await productsTable
            .where('is_featured')
            .equals(1)
            .toArray();
        
        console.log(`⭐ Found ${products.length} featured products`);
        return products;
    } catch (error) {
        console.error('❌ Error getting featured products:', error);
        return [];
    }
}

// Get products by collection
export async function getProductsByCollection(collectionId) {
    try {
        const products = await productsTable
            .where('collection_id')
            .equals(collectionId)
            .toArray();
        
        console.log(`📁 Found ${products.length} products in collection ${collectionId}`);
        return products;
    } catch (error) {
        console.error('❌ Error getting products by collection:', error);
        return [];
    }
}

// Bulk insert/update products (for sync)
export async function bulkUpsertProducts(products) {
    try {
        // Use bulkPut which will insert or update based on primary key
        await productsTable.bulkPut(products);
        console.log(`✅ Synced ${products.length} products to Dexie`);
        return true;
    } catch (error) {
        console.error('❌ Error syncing products:', error);
        return false;
    }
}

// Clear all products
export async function clearAllProducts() {
    try {
        await productsTable.clear();
        console.log('✅ All products cleared from Dexie');
        return true;
    } catch (error) {
        console.error('❌ Error clearing products:', error);
        return false;
    }
}

// Get product count
export async function getProductCount() {
    try {
        const count = await productsTable.count();
        return count;
    } catch (error) {
        console.error('❌ Error getting product count:', error);
        return 0;
    }
}

export default {
    getAllProducts,
    getProductById,
    searchProducts,
    getProductsByCategory,
    getFeaturedProducts,
    getProductsByCollection,
    bulkUpsertProducts,
    clearAllProducts,
    getProductCount,
};
