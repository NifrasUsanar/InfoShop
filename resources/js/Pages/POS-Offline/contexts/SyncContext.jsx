import React, { createContext, useContext, useState, useCallback } from 'react';
import { syncAll as syncAllService, getLastSyncInfo } from '../services/syncService';
import { getAllProducts, clearAllProducts, getProductCount } from '../services/productsService';
import { clearAllCharges, getChargesCount } from '../services/chargesService';
import { clearAllCollections, getCollectionsCount } from '../services/collectionsService';
import { clearAllContacts, getContactsCount } from '../services/contactsService';
import { syncMetadataTable } from '../db/database';

const SyncContext = createContext(null);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const [syncState, setSyncState] = useState({
    status: 'idle', // 'idle' | 'syncing' | 'success' | 'error'
    progress: 0, // 0-100
    message: '',
    lastSyncedAt: null,
    totalProducts: 0,
    totalCharges: 0,
    totalCollections: 0,
    totalContacts: 0,
    localProducts: 0,
    localCharges: 0,
    localCollections: 0,
    localContacts: 0,
    error: null,
  });

  // Progress callback for sync operations
  const updateProgress = useCallback((progress, message) => {
    setSyncState((prev) => ({
      ...prev,
      progress,
      message: message || prev.message,
    }));
  }, []);

  // Start sync operation
  const startSync = useCallback(async (onComplete) => {
    setSyncState({
      status: 'syncing',
      progress: 0,
      message: 'Initializing sync...',
      lastSyncedAt: null,
      totalProducts: 0,
      totalCharges: 0,
      totalCollections: 0,
      totalContacts: 0,
      localProducts: 0,
      localCharges: 0,
      localCollections: 0,
      localContacts: 0,
      error: null,
    });

    try {
      // Step 1: Initialize (10%)
      updateProgress(10, 'Connecting to server...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Fetch all data (30%)
      updateProgress(30, 'Fetching data from server...');
      const result = await syncAllService();

      if (!result.success) {
        throw new Error('Sync failed for one or more tables');
      }

      // Step 3: Processing (60%)
      const productCount = result.summary.products?.count || 0;
      const chargeCount = result.summary.charges?.count || 0;
      const collectionCount = result.summary.collections?.count || 0;
      const contactCount = result.summary.contacts?.count || 0;

      updateProgress(60, `Processing ${productCount} products, ${chargeCount} charges, ${collectionCount} collections, ${contactCount} contacts...`);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 4: Storing (80%)
      updateProgress(80, 'Storing data locally...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 5: Finalizing (100%)
      updateProgress(100, 'Sync complete!');

      // Get actual local counts from database
      const [localProductsCount, localChargesCount, localCollectionsCount, localContactsCount] = await Promise.all([
        getProductCount(),
        getChargesCount(),
        getCollectionsCount(),
        getContactsCount(),
      ]);

      setSyncState({
        status: 'success',
        progress: 100,
        message: `Successfully synced ${productCount} products, ${chargeCount} charges, ${collectionCount} collections, ${contactCount} contacts`,
        lastSyncedAt: result.timestamp,
        totalProducts: productCount,
        totalCharges: chargeCount,
        totalCollections: collectionCount,
        totalContacts: contactCount,
        localProducts: localProductsCount,
        localCharges: localChargesCount,
        localCollections: localCollectionsCount,
        localContacts: localContactsCount,
        error: null,
      });

      // Auto-reset to idle after 3 seconds
      setTimeout(() => {
        setSyncState((prev) => ({
          ...prev,
          status: 'idle',
        }));
      }, 3000);

      // Callback with fresh products
      if (onComplete) {
        const freshProducts = await getAllProducts();
        onComplete(freshProducts);
      }

      return {
        success: true,
        summary: result.summary,
        productCount,
        chargeCount,
        collectionCount,
        contactCount,
        totalCount: productCount + chargeCount + collectionCount + contactCount
      };
    } catch (error) {
      console.error('Sync error:', error);

      setSyncState({
        status: 'error',
        progress: 0,
        message: error.message || 'Sync failed',
        lastSyncedAt: null,
        totalProducts: 0,
        totalCharges: 0,
        totalCollections: 0,
        totalContacts: 0,
        localProducts: 0,
        localCharges: 0,
        localCollections: 0,
        localContacts: 0,
        error: error.message,
      });

      // Auto-reset to idle after 5 seconds
      setTimeout(() => {
        setSyncState((prev) => ({
          ...prev,
          status: 'idle',
        }));
      }, 5000);

      return { success: false, error: error.message };
    }
  }, [updateProgress]);

  // Load last sync info
  const loadLastSyncInfo = useCallback(async () => {
    try {
      const [
        productsSync,
        chargesSync,
        collectionsSync,
        contactsSync,
        localProductsCount,
        localChargesCount,
        localCollectionsCount,
        localContactsCount
      ] = await Promise.all([
        getLastSyncInfo('products'),
        getLastSyncInfo('charges'),
        getLastSyncInfo('collections'),
        getLastSyncInfo('contacts'),
        getProductCount(),
        getChargesCount(),
        getCollectionsCount(),
        getContactsCount(),
      ]);

      // Use the most recent sync timestamp
      const syncTimes = [
        productsSync?.lastSyncedAt,
        chargesSync?.lastSyncedAt,
        collectionsSync?.lastSyncedAt,
        contactsSync?.lastSyncedAt,
      ].filter(Boolean);

      const mostRecentSync = syncTimes.length > 0
        ? syncTimes.sort().reverse()[0]
        : null;

      setSyncState((prev) => ({
        ...prev,
        lastSyncedAt: mostRecentSync,
        totalProducts: productsSync?.count || 0,
        totalCharges: chargesSync?.count || 0,
        totalCollections: collectionsSync?.count || 0,
        totalContacts: contactsSync?.count || 0,
        localProducts: localProductsCount,
        localCharges: localChargesCount,
        localCollections: localCollectionsCount,
        localContacts: localContactsCount,
      }));
    } catch (error) {
      console.error('Error loading sync info:', error);
    }
  }, []);

  // Reset sync - clear all data and force fresh sync
  const resetSync = useCallback(async (onComplete) => {
    try {
      console.log('🔄 Resetting sync data...');

      // Clear all tables
      await Promise.all([
        clearAllProducts(),
        clearAllCharges(),
        clearAllCollections(),
        clearAllContacts(),
      ]);

      // Clear sync metadata for all tables
      await Promise.all([
        syncMetadataTable.delete('products'),
        syncMetadataTable.delete('charges'),
        syncMetadataTable.delete('collections'),
        syncMetadataTable.delete('contacts'),
      ]);

      // Reset state
      setSyncState({
        status: 'idle',
        progress: 0,
        message: '',
        lastSyncedAt: null,
        totalProducts: 0,
        totalCharges: 0,
        totalCollections: 0,
        totalContacts: 0,
        localProducts: 0,
        localCharges: 0,
        localCollections: 0,
        localContacts: 0,
        error: null,
      });

      console.log('✅ Sync data reset complete');

      // Trigger fresh sync
      return await startSync(onComplete);
    } catch (error) {
      console.error('❌ Error resetting sync:', error);
      return { success: false, error: error.message };
    }
  }, [startSync]);

  const value = {
    syncState,
    startSync,
    loadLastSyncInfo,
    resetSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};
