import React, { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Existing contexts (already work without Inertia)
import { SalesProvider } from '@/Context/SalesContext';
import { SharedProvider } from '@/Context/SharedContext';

// App config context
import { AppConfigProvider } from './contexts/AppConfigContext';
import { SyncProvider, useSyncContext } from './contexts/SyncContext';
import { FirebaseProvider } from './contexts/FirebaseContext';

// Existing POS component
import POS from './POS';

// Dexie services
import { initDatabase } from './db/database';
import { getAllProducts } from './services/productsService';
import { getDefaultCharges } from './services/chargesService';
import { getHierarchicalCollections } from './services/collectionsService';
import { getCustomers } from './services/contactsService';

// Sample data constants - MUST be outside component to prevent recreation
const SAMPLE_CUSTOMERS = [
  { id: 1, name: 'Walk-in Customer', balance: 0 },
  { id: 2, name: 'John Doe', balance: 1000.50 },
  { id: 3, name: 'Jane Smith', balance: -500.25 },
  { id: 4, name: 'Bob Wilson', balance: 250.00 },
];

const SAMPLE_CHARGES = [
  {
    id: 1,
    name: 'VAT 10%',
    charge_type: 'tax',
    rate_value: 10,
    rate_type: 'percentage',
    is_active: true,
    is_default: true,
  },
];

const SAMPLE_CATEGORIES = [
  { id: 1, name: 'Electronics', collection_type: 'category' },
  { id: 2, name: 'Accessories', collection_type: 'category' },
];

// Sample products for testing (will be replaced with Dexie later)
const SAMPLE_PRODUCTS = [
  {
    id: '1',
    name: 'Laptop Dell XPS 15',
    sku: 'DELL-XPS-15',
    barcode: '1234567890',
    price: 1500,
    cost: 1000,
    quantity: 10,
    stock_quantity: 10,
    batch_number: 'BATCH001',
    batch_id: 'B1',
    is_stock_managed: 1,
    product_type: 'simple',
    image_url: null,
    category_id: 1,
    is_featured: 1,
    discount: 0,
    discount_percentage: 0,
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    sku: 'IPHONE-15-PRO',
    barcode: '0987654321',
    price: 999,
    cost: 700,
    quantity: 15,
    stock_quantity: 15,
    batch_number: 'BATCH002',
    batch_id: 'B2',
    is_stock_managed: 1,
    product_type: 'simple',
    image_url: null,
    category_id: 1,
    is_featured: 1,
    discount: 0,
    discount_percentage: 0,
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24',
    sku: 'SAMSUNG-S24',
    barcode: '5678901234',
    price: 850,
    cost: 600,
    quantity: 20,
    stock_quantity: 20,
    batch_number: 'BATCH003',
    batch_id: 'B3',
    is_stock_managed: 1,
    product_type: 'simple',
    image_url: null,
    category_id: 1,
    is_featured: 0,
    discount: 50,
    discount_percentage: 5.88,
  },
  {
    id: '4',
    name: 'MacBook Pro 16"',
    sku: 'MBP-16',
    barcode: '4567890123',
    price: 2400,
    cost: 1800,
    quantity: 5,
    stock_quantity: 5,
    batch_number: 'BATCH004',
    batch_id: 'B4',
    is_stock_managed: 1,
    product_type: 'simple',
    image_url: null,
    category_id: 1,
    is_featured: 1,
    discount: 0,
    discount_percentage: 0,
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    sku: 'MOUSE-001',
    barcode: '3456789012',
    price: 25,
    cost: 10,
    quantity: 50,
    stock_quantity: 50,
    batch_number: 'BATCH005',
    batch_id: 'B5',
    is_stock_managed: 1,
    product_type: 'simple',
    image_url: null,
    category_id: 2,
    is_featured: 0,
    discount: 0,
    discount_percentage: 0,
  },
];

// Inner component that uses SyncContext
function AppContent() {
  const { syncState, startSync, loadLastSyncInfo } = useSyncContext();
  const [allProducts, setAllProducts] = useState([]); // All products for search
  const [featuredProducts, setFeaturedProducts] = useState([]); // Featured products for display
  const [customers, setCustomers] = useState(SAMPLE_CUSTOMERS);
  const [charges, setCharges] = useState(SAMPLE_CHARGES);
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the products update callback to prevent unnecessary re-renders
  const handleProductsUpdate = useCallback(async (freshProducts) => {
    // Update products
    setAllProducts(freshProducts);
    const featured = freshProducts.filter(p => p.is_featured === true || p.is_featured === 1);
    setFeaturedProducts(featured);

    // Reload charges, collections, and contacts after sync
    try {
      const [freshCharges, freshCollections, freshContacts] = await Promise.all([
        getDefaultCharges(),
        getHierarchicalCollections(),
        getCustomers(),
      ]);

      if (freshCharges.length > 0) {
        setCharges(freshCharges);
        console.log(`✅ Reloaded ${freshCharges.length} charges after sync`);
      }

      if (freshCollections.length > 0) {
        setCategories(freshCollections);
        console.log(`✅ Reloaded ${freshCollections.length} collections after sync`);
      }

      if (freshContacts.length > 0) {
        setCustomers(freshContacts);
        console.log(`✅ Reloaded ${freshContacts.length} customers after sync`);
      }
    } catch (error) {
      console.error('❌ Error reloading data after sync:', error);
    }
  }, []);

  // Initialize Dexie and sync products on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Initialize database
        const dbInitialized = await initDatabase();

        if (!dbInitialized) {
          throw new Error('Failed to initialize database');
        }

        // Step 2: Load all data from Dexie
        const [cachedProducts, cachedCharges, cachedCollections, cachedContacts] = await Promise.all([
          getAllProducts(),
          getDefaultCharges(),
          getHierarchicalCollections(),
          getCustomers(),
        ]);

        // Load products
        if (cachedProducts.length > 0) {
          setAllProducts(cachedProducts);
          const featured = cachedProducts.filter(p => p.is_featured === true || p.is_featured === 1);
          setFeaturedProducts(featured);
          console.log(`✅ Loaded ${cachedProducts.length} products from Dexie (${featured.length} featured)`);
        } else {
          console.log('ℹ️ No cached products found, will sync from server');
        }

        // Load charges
        if (cachedCharges.length > 0) {
          setCharges(cachedCharges);
          console.log(`✅ Loaded ${cachedCharges.length} charges from Dexie`);
        } else {
          console.log('ℹ️ No cached charges found, will sync from server');
        }

        // Load collections/categories
        if (cachedCollections.length > 0) {
          setCategories(cachedCollections);
          console.log(`✅ Loaded ${cachedCollections.length} collections from Dexie`);
        } else {
          console.log('ℹ️ No cached collections found, will sync from server');
        }

        // Load contacts/customers
        if (cachedContacts.length > 0) {
          setCustomers(cachedContacts);
          console.log(`✅ Loaded ${cachedContacts.length} customers from Dexie`);
        } else {
          console.log('ℹ️ No cached customers found, will sync from server');
        }

        // Step 3: Load last sync info
        await loadLastSyncInfo();

        // Step 4: Check if sync is needed (if any data is missing)
        const shouldSync =
          cachedProducts.length === 0 ||
          cachedCharges.length === 0 ||
          cachedCollections.length === 0 ||
          cachedContacts.length === 0;

        if (shouldSync) {
          console.log('🔄 Starting background sync (missing data detected)...');
          await startSync(async (freshProducts) => {
            // Update all products
            setAllProducts(freshProducts);

            // Update featured products
            const featured = freshProducts.filter(p => p.is_featured === true || p.is_featured === 1);
            setFeaturedProducts(featured);

            // Reload all other data
            const [freshCharges, freshCollections, freshContacts] = await Promise.all([
              getDefaultCharges(),
              getHierarchicalCollections(),
              getCustomers(),
            ]);

            if (freshCharges.length > 0) setCharges(freshCharges);
            if (freshCollections.length > 0) setCategories(freshCollections);
            if (freshContacts.length > 0) setCustomers(freshContacts);
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setError(err.message);
        // Fallback to sample products
        setAllProducts(SAMPLE_PRODUCTS);
        const featured = SAMPLE_PRODUCTS.filter(p => p.is_featured === 1);
        setFeaturedProducts(featured);
        setLoading(false);
      }
    }

    initialize();
  }, [startSync, loadLastSyncInfo]);

  // Periodic background sync (every 5 minutes when online)
  useEffect(() => {
    const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const intervalId = setInterval(async () => {
      // Only sync if online and not currently syncing
      if (navigator.onLine && syncState.status !== 'syncing') {
        console.log('🔄 Periodic background sync triggered...');
        try {
          await startSync(async (freshProducts) => {
            // Update all products
            setAllProducts(freshProducts);

            // Update featured products
            const featured = freshProducts.filter(p => p.is_featured === true || p.is_featured === 1);
            setFeaturedProducts(featured);

            // Reload all other data
            const [freshCharges, freshCollections, freshContacts] = await Promise.all([
              getDefaultCharges(),
              getHierarchicalCollections(),
              getCustomers(),
            ]);

            if (freshCharges.length > 0) setCharges(freshCharges);
            if (freshCollections.length > 0) setCategories(freshCollections);
            if (freshContacts.length > 0) setCustomers(freshContacts);

            console.log('✅ Periodic sync completed');
          });
        } catch (error) {
          console.error('❌ Periodic sync error:', error);
        }
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(intervalId);
  }, [startSync]); // Remove syncState.status dependency to prevent unnecessary interval resets

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          {syncState.status === 'syncing' ? syncState.message : 'Initializing...'}
        </Typography>
        {syncState.status === 'syncing' && (
          <Typography variant="body2" color="text.secondary">
            {syncState.progress}% complete
          </Typography>
        )}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h5" color="error">
          Initialization Error
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Using sample data for testing
        </Typography>
      </Box>
    );
  }

  return (
    <AppConfigProvider>
      <SharedProvider>
        <SalesProvider defaultCharges={charges}>
          <POS
            products={featuredProducts}
            allProducts={allProducts}
            customers={customers}
            categories={categories}
            all_collections={categories}
            return_sale={false}
            edit_sale={false}
            sale_id={null}
            onProductsUpdate={handleProductsUpdate}
          />
        </SalesProvider>
      </SharedProvider>
    </AppConfigProvider>
  );
}

// Main App component with SyncProvider and FirebaseProvider
export default function App() {
  return (
    <SyncProvider>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </SyncProvider>
  );
}
