import React, { createContext, useContext, useState } from 'react';

const AppConfigContext = createContext();

export function AppConfigProvider({ children }) {
  const [config] = useState({
    // Mode flags (replaces usePage().props)
    return_sale: false,
    edit_sale: false,
    sale_id: null,
    
    // Settings
    settings: {
      auto_open_print_dialog: '1',
    },
    
    misc_settings: {
      cart_first_focus: 'quantity',
      enable_flat_item_discount: 'yes', // String 'yes' to match CartItemModal checks
      enable_unit_discount: 'yes', // String 'yes' to match CartItemModal checks
    },
    
    // User info (from window.__INITIAL_USER__ or defaults)
    user: typeof window !== 'undefined' && window.__INITIAL_USER__ ? window.__INITIAL_USER__ : {
      id: 1,
      store_id: 1,
      name: 'Test User',
    },
  });

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}
