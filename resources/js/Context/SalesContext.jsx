import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import useCartBase from './useCartBase';
import { use } from 'react';

const SalesContext = createContext();

const SalesProvider = ({ children, cartType = 'sales_cart'}) => {
  const [selectedBillType, setSelectedBillType] = useState('normal');
  const [taxesAndFees, setTaxesAndFees] = useState({});
  const { cartState, addToCart, removeFromCart, updateProductQuantity, emptyCart, updateCartItem, holdCart, setHeldCartToCart, removeHeldItem } = useCartBase(cartType);

  const {
    cartTotal,
    totalQuantity,
    totalProfit,
    appliedTaxesAndFees
  } = useMemo(() => {
    const base = {
      cartTotal: 0,
      totalQuantity: 0,
      totalProfit: 0,
      appliedTaxesAndFees: {} // To store individual tax/fee calculations
    };
  
    // Calculate base cart totals
    cartState.forEach((item) => {
      const quantity = parseFloat(item.quantity);
      const cost = parseFloat(item.cost);
      const discountedPrice = parseFloat(item.price) - parseFloat(item.discount);
      const itemTotal = discountedPrice * quantity;
      const itemProfit = (discountedPrice - cost) * quantity;
  
      base.cartTotal += itemTotal;
      base.totalQuantity += quantity;
      base.totalProfit += itemProfit;
    });
  
    if (selectedBillType === 'tax') {
      taxesAndFees.forEach(({ name, rate, is_percentage }) => {
        const amount = is_percentage
          ? (base.cartTotal * Number(rate)) / 100
          : Number(rate);
    
        base.cartTotal += parseFloat(amount);
        base.appliedTaxesAndFees[name] = amount;
      });
    }
  
    return base;
  }, [cartState, selectedBillType, taxesAndFees]);
  

  return (
      <SalesContext.Provider
          value={{
              cartState,
              cartTotal,
              totalQuantity,
              totalProfit,
              addToCart,
              removeFromCart,
              updateProductQuantity,
              emptyCart,
              updateCartItem,
              holdCart,
              setHeldCartToCart,
              removeHeldItem,
              selectedBillType,
              setSelectedBillType,
              setTaxesAndFees,
              appliedTaxesAndFees
          }}
      >
          {children}
      </SalesContext.Provider>
  );
};

const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export { SalesProvider, useSales };
