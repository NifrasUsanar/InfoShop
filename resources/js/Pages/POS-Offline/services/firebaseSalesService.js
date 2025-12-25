import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch,
  Timestamp,
  setDoc,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';

/**
 * Firebase Sales Service
 * Handles all sales data operations in Firestore
 */
export class FirebaseSalesService {
  /**
   * Get Firestore instance (lazy initialized)
   * Returns a Promise since config is fetched from backend
   */
  static async getFirestore() {
    const fs = await firestore.instance;
    if (!fs) {
      throw new Error('Firestore not initialized. Check if Firebase is configured in Laravel .env');
    }
    return fs;
  }

  /**
   * Create a new sale in Firebase
   * Uses invoice_number as the document ID for easy lookup and deduplication
   *
   * @param {Object} saleData - Sale data object (same structure as Laravel API)
   * @returns {Promise<string>} - Invoice number (document ID)
   */
  static async createSale(saleData) {
    try {
      const invoiceNumber = saleData.invoice_number;
      if (!invoiceNumber) {
        throw new Error('invoice_number is required in sale data');
      }

      const fs = await this.getFirestore();
      const docRef = doc(fs, 'sales', invoiceNumber);

      // Use setDoc to create/overwrite with specific ID
      await setDoc(docRef, {
        ...saleData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        synced: false, // Mark as not synced to Laravel yet
        syncedAt: null,
      });

      console.log('[Firebase] Sale created:', invoiceNumber);
      return invoiceNumber;
    } catch (error) {
      console.error('[Firebase] Error creating sale:', error);
      throw new Error(error.message || 'Failed to create sale in Firebase');
    }
  }

  /**
   * Get all sales from Firebase
   * @returns {Promise<Array>} - Array of sale objects
   */
  static async getAllSales() {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const sales = snapshot.docs.map((doc) => ({
        id: doc.id,
        firebaseDocId: doc.id,
        ...doc.data(),
      }));

      console.log(`[Firebase] Retrieved ${sales.length} sales`);
      return sales;
    } catch (error) {
      console.error('[Firebase] Error getting sales:', error);
      return [];
    }
  }

  /**
   * Get unsynced sales (not yet synced to Laravel)
   * @returns {Promise<Array>} - Array of unsynced sale objects
   */
  static async getUnsyncedSales() {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        where('synced', '==', false)
        // orderBy('createdAt', 'asc') - Removed to avoid index requirement
        // TODO: Create composite index in Firebase Console for synced + createdAt
      );
      const snapshot = await getDocs(q);

      const sales = snapshot.docs.map((doc) => ({
        id: doc.id,
        firebaseDocId: doc.id,
        ...doc.data(),
      }));

      console.log(`[Firebase] Retrieved ${sales.length} unsynced sales`);
      return sales;
    } catch (error) {
      console.error('[Firebase] Error getting unsynced sales:', error);
      return [];
    }
  }

  /**
   * Get a single sale by invoice number
   * @param {string} invoiceNumber - Invoice number to search for
   * @returns {Promise<Object|null>} - Sale object or null
   */
  static async getSaleByInvoiceNumber(invoiceNumber) {
    try {
      const fs = await this.getFirestore();
      const docRef = doc(fs, 'sales', invoiceNumber);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          firebaseDocId: docSnap.id,
          ...docSnap.data(),
        };
      }

      return null;
    } catch (error) {
      console.error('[Firebase] Error getting sale by invoice number:', error);
      return null;
    }
  }

  /**
   * Update a sale
   * @param {string} invoiceNumber - Invoice number (document ID)
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  static async updateSale(invoiceNumber, updates) {
    try {
      const fs = await this.getFirestore();
      const saleRef = doc(fs, 'sales', invoiceNumber);

      await updateDoc(saleRef, {
        ...updates,
        updatedAt: Timestamp.now(),
        synced: false, // Reset sync status when updating
      });

      console.log('[Firebase] Sale updated:', invoiceNumber);
    } catch (error) {
      console.error('[Firebase] Error updating sale:', error);
      throw new Error(error.message || 'Failed to update sale in Firebase');
    }
  }

  /**
   * Mark a sale as synced to Laravel
   * @param {string} invoiceNumber - Invoice number (document ID)
   * @returns {Promise<void>}
   */
  static async markSaleAsSynced(invoiceNumber) {
    try {
      const fs = await this.getFirestore();
      const saleRef = doc(fs, 'sales', invoiceNumber);
      
      await updateDoc(saleRef, {
        synced: true,
        syncedAt: Timestamp.now(),
      });

      console.log('[Firebase] Sale marked as synced:', invoiceNumber);
    } catch (error) {
      console.error('[Firebase] Error marking sale as synced:', error);
      throw new Error(error.message || 'Failed to mark sale as synced');
    }
  }

  /**
   * Delete a sale
   * @param {string} invoiceNumber - Invoice number (document ID)
   * @returns {Promise<void>}
   */
  static async deleteSale(invoiceNumber) {
    try {
      const fs = await this.getFirestore();
      const saleRef = doc(fs, 'sales', invoiceNumber);
      await deleteDoc(saleRef);

      console.log('[Firebase] Sale deleted:', invoiceNumber);
    } catch (error) {
      console.error('[Firebase] Error deleting sale:', error);
      throw new Error(error.message || 'Failed to delete sale from Firebase');
    }
  }

  /**
   * Batch mark multiple sales as synced
   * @param {Array<string>} invoiceNumbers - Array of invoice numbers
   * @returns {Promise<void>}
   */
  static async batchMarkAsSynced(invoiceNumbers) {
    try {
      const fs = await this.getFirestore();
      const batch = writeBatch(fs);

      invoiceNumbers.forEach((invoiceNumber) => {
        const saleRef = doc(fs, 'sales', invoiceNumber);
        batch.update(saleRef, {
          synced: true,
          syncedAt: Timestamp.now(),
        });
      });

      await batch.commit();
      console.log(`[Firebase] Batch marked ${invoiceNumbers.length} sales as synced`);
    } catch (error) {
      console.error('[Firebase] Error batch marking sales as synced:', error);
      throw new Error(error.message || 'Failed to batch mark sales as synced');
    }
  }

  /**
   * Listen to all sales changes in real-time
   * @param {Function} callback - Callback function to receive sales updates
   * @returns {Function} - Unsubscribe function
   */
  static async onSalesChange(callback) {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({
          id: doc.id,
          firebaseDocId: doc.id,
          ...doc.data(),
        }));
        callback(sales);
      });
    } catch (error) {
      console.error('[Firebase] Error listening to sales changes:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Listen to unsynced sales changes in real-time
   * @param {Function} callback - Callback function to receive unsynced sales updates
   * @returns {Function} - Unsubscribe function
   */
  static async onUnsyncedSalesChange(callback) {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        where('synced', '==', false),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(q, (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({
          id: doc.id,
          firebaseDocId: doc.id,
          ...doc.data(),
        }));
        callback(sales);
      });
    } catch (error) {
      console.error('[Firebase] Error listening to unsynced sales changes:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Get sales count
   * @returns {Promise<number>} - Total number of sales
   */
  static async getSalesCount() {
    try {
      const fs = await this.getFirestore();
      const snapshot = await getDocs(collection(fs, 'sales'));
      return snapshot.size;
    } catch (error) {
      console.error('[Firebase] Error getting sales count:', error);
      return 0;
    }
  }

  /**
   * Get unsynced sales count
   * @returns {Promise<number>} - Number of unsynced sales
   */
  static async getUnsyncedSalesCount() {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        where('synced', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('[Firebase] Error getting unsynced sales count:', error);
      return 0;
    }
  }

  /**
   * Check if Firebase has any sales
   * @returns {Promise<boolean>}
   */
  static async hasSales() {
    try {
      const count = await this.getSalesCount();
      return count > 0;
    } catch (error) {
      console.error('[Firebase] Error checking if has sales:', error);
      return false;
    }
  }

  /**
   * Get recent sales (last N sales)
   * @param {number} limitCount - Number of recent sales to retrieve
   * @returns {Promise<Array>} - Array of recent sales
   */
  static async getRecentSales(limitCount = 10) {
    try {
      const fs = await this.getFirestore();
      const q = query(
        collection(fs, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      const sales = snapshot.docs.map((doc) => ({
        id: doc.id,
        firebaseDocId: doc.id,
        ...doc.data(),
      }));

      return sales;
    } catch (error) {
      console.error('[Firebase] Error getting recent sales:', error);
      return [];
    }
  }
}

export default FirebaseSalesService;
