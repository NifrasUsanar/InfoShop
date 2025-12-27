import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeFirebaseApp } from '../services/firebaseConfig';
import { FirebaseSalesService } from '../services/firebaseSalesService';

const FirebaseContext = createContext(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [unsyncedSalesCount, setUnsyncedSalesCount] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Firebase on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[FirebaseContext] Initializing Firebase...');
        const app = await initializeFirebaseApp();

        if (app) {
          setIsInitialized(true);
          setIsConnected(true);
          console.log('[FirebaseContext] Firebase initialized successfully');

          // Load initial counts
          await loadCounts();
        } else {
          setError('Failed to initialize Firebase. Check if it is configured in Laravel .env');
          console.error('[FirebaseContext] Firebase initialization failed');
        }
      } catch (err) {
        console.error('[FirebaseContext] Error initializing Firebase:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Load sales counts
  const loadCounts = useCallback(async () => {
    try {
      const [total, unsynced] = await Promise.all([
        FirebaseSalesService.getSalesCount(),
        FirebaseSalesService.getUnsyncedSalesCount(),
      ]);
      
      setSalesCount(total);
      setUnsyncedSalesCount(unsynced);
      
      console.log(`[FirebaseContext] Sales: ${total}, Unsynced: ${unsynced}`);
    } catch (err) {
      console.error('[FirebaseContext] Error loading counts:', err);
    }
  }, []);

  // Create a new sale
  const createSale = useCallback(async (saleData) => {
    try {
      console.log('[FirebaseContext] Creating sale:', saleData.invoice_number);
      const invoiceNumber = await FirebaseSalesService.createSale(saleData);

      // Reload counts in background (fire and forget)
      // Don't await to avoid blocking the payment completion
      loadCounts().catch(err => {
        console.warn('[FirebaseContext] Background count reload failed:', err);
      });

      return invoiceNumber;
    } catch (err) {
      console.error('[FirebaseContext] Error creating sale:', err);
      throw err;
    }
  }, [loadCounts]);

  // Get all sales
  const getAllSales = useCallback(async () => {
    try {
      return await FirebaseSalesService.getAllSales();
    } catch (err) {
      console.error('[FirebaseContext] Error getting all sales:', err);
      return [];
    }
  }, []);

  // Get unsynced sales
  const getUnsyncedSales = useCallback(async () => {
    try {
      return await FirebaseSalesService.getUnsyncedSales();
    } catch (err) {
      console.error('[FirebaseContext] Error getting unsynced sales:', err);
      return [];
    }
  }, []);

  // Get sale by invoice number
  const getSaleByInvoiceNumber = useCallback(async (invoiceNumber) => {
    try {
      return await FirebaseSalesService.getSaleByInvoiceNumber(invoiceNumber);
    } catch (err) {
      console.error('[FirebaseContext] Error getting sale:', err);
      return null;
    }
  }, []);

  // Update a sale
  const updateSale = useCallback(async (invoiceNumber, updates) => {
    try {
      await FirebaseSalesService.updateSale(invoiceNumber, updates);
      await loadCounts();
    } catch (err) {
      console.error('[FirebaseContext] Error updating sale:', err);
      throw err;
    }
  }, [loadCounts]);

  // Delete a sale
  const deleteSale = useCallback(async (invoiceNumber) => {
    try {
      await FirebaseSalesService.deleteSale(invoiceNumber);
      await loadCounts();
    } catch (err) {
      console.error('[FirebaseContext] Error deleting sale:', err);
      throw err;
    }
  }, [loadCounts]);

  // Mark sale as synced
  const markSaleAsSynced = useCallback(async (invoiceNumber) => {
    try {
      await FirebaseSalesService.markSaleAsSynced(invoiceNumber);
      await loadCounts();
    } catch (err) {
      console.error('[FirebaseContext] Error marking sale as synced:', err);
      throw err;
    }
  }, [loadCounts]);

  // Batch mark sales as synced
  const batchMarkAsSynced = useCallback(async (invoiceNumbers) => {
    try {
      await FirebaseSalesService.batchMarkAsSynced(invoiceNumbers);
      await loadCounts();
    } catch (err) {
      console.error('[FirebaseContext] Error batch marking as synced:', err);
      throw err;
    }
  }, [loadCounts]);

  // Subscribe to sales changes
  const subscribeSalesChanges = useCallback(async (callback) => {
    try {
      return await FirebaseSalesService.onSalesChange((sales) => {
        setSalesCount(sales.length);
        callback(sales);
      });
    } catch (err) {
      console.error('[FirebaseContext] Error subscribing to sales changes:', err);
      return () => {};
    }
  }, []);

  // Subscribe to unsynced sales changes
  const subscribeUnsyncedSalesChanges = useCallback(async (callback) => {
    try {
      return await FirebaseSalesService.onUnsyncedSalesChange((sales) => {
        setUnsyncedSalesCount(sales.length);
        callback(sales);
      });
    } catch (err) {
      console.error('[FirebaseContext] Error subscribing to unsynced sales changes:', err);
      return () => {};
    }
  }, []);

  // Get recent sales
  const getRecentSales = useCallback(async (limit = 10) => {
    try {
      return await FirebaseSalesService.getRecentSales(limit);
    } catch (err) {
      console.error('[FirebaseContext] Error getting recent sales:', err);
      return [];
    }
  }, []);

  const value = {
    // State
    isInitialized,
    isConnected,
    isLoading,
    error,
    salesCount,
    unsyncedSalesCount,

    // Methods
    createSale,
    getAllSales,
    getUnsyncedSales,
    getSaleByInvoiceNumber,
    updateSale,
    deleteSale,
    markSaleAsSynced,
    batchMarkAsSynced,
    subscribeSalesChanges,
    subscribeUnsyncedSalesChanges,
    getRecentSales,
    loadCounts,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseContext;
