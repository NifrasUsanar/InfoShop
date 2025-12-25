import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import useCartBase from './useCartBase';
import axios from 'axios';

const SalesContext = createContext();

const SalesProvider = ({ children, cartType = 'sales_cart', defaultCharges = [] }) => {
  const { cartState, addToCart, removeFromCart, updateProductQuantity, emptyCart, updateCartItem, holdCart, setHeldCartToCart, removeHeldItem } = useCartBase(cartType);
  const [charges, setCharges] = useState([]);
  const [discount, setDiscount] = useState(0);

  // Track previous defaultCharges to prevent infinite loops
  const prevDefaultChargesRef = useRef();
  const prevCartTypeRef = useRef();

  // Initialize charges from defaultCharges prop (no API calls)
  useEffect(() => {
    // Check if defaultCharges or cartType actually changed
    const chargesChanged = JSON.stringify(prevDefaultChargesRef.current) !== JSON.stringify(defaultCharges);
    const cartTypeChanged = prevCartTypeRef.current !== cartType;

    if (!chargesChanged && !cartTypeChanged) {
      return; // Skip if nothing changed
    }

    prevDefaultChargesRef.current = defaultCharges;
    prevCartTypeRef.current = cartType;

    const isReturn = cartType === 'sales_return_cart';

    // Normalize defaultCharges to always be an array
    const chargesData = Array.isArray(defaultCharges) ? defaultCharges : [];

    if (chargesData.length > 0) {
      const mapped = chargesData.map((charge) => ({
        ...charge,
        id: charge.id || `charge_${Math.random()}`,
        rate_value: isReturn ? -Math.abs(charge.rate_value) : Number(charge.rate_value),
      }));

      setCharges(mapped);
    } else {
      setCharges([]);
    }
  }, [defaultCharges, cartType]);

  const addCharge = (charge) => {
    setCharges((prevCharges) => [
      ...prevCharges,
      {
        ...charge,
        id: charge.id || `charge_${Date.now()}`,
      },
    ]);
  };

  const removeCharge = (chargeId) => {
    setCharges((prevCharges) =>
      prevCharges.filter((charge) => charge.id !== chargeId)
    );
  };

  const updateCharge = (chargeId, updatedData) => {
    setCharges((prevCharges) =>
      prevCharges.map((charge) =>
        charge.id === chargeId ? { ...charge, ...updatedData } : charge
      )
    );
  };

  const { cartTotal, totalQuantity, totalProfit } = useMemo(() => {
    return cartState.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity)
        const cost = Number(item.cost)
        const unitPrice = Number(item.price);
        const unitDiscount = Number(item.discount || 0);
        const flatDiscount = Number(item.flat_discount || 0);

        const discountedUnitPrice = unitPrice - unitDiscount;
        const itemTotal = discountedUnitPrice * quantity - flatDiscount;
        const itemProfit = (discountedUnitPrice - cost) * quantity - flatDiscount;

        acc.cartTotal += itemTotal;
        acc.totalQuantity += quantity;
        acc.totalProfit += itemProfit;

        return acc;
      },
      { cartTotal: 0, totalQuantity: 0, totalProfit: 0 }
    );
  }, [cartState]);

  const calculateChargeAmount = (charge) => {
    if (charge.rate_type === 'percentage') {
      // Use absolute value of cartTotal for calculation (handles negative returns correctly)
      const absCartTotal = Math.abs(cartTotal);
      const amount = (absCartTotal * Number(charge.rate_value)) / 100;
      return amount;
    }
    return Number(charge.rate_value);
  };

  const calculateChargeAmountWithDiscount = (charge, discountAmount = discount) => {
    // Use absolute value of cartTotal for calculation (handles negative returns correctly)
    const absCartTotal = Math.abs(cartTotal);
    const discountedCartTotal = Math.max(absCartTotal - discountAmount, 0);
    if (charge.rate_type === 'percentage') {
      const amount = (discountedCartTotal * Number(charge.rate_value)) / 100;
      return amount;
    }
    return Number(charge.rate_value);
  };

  const calculateChargesWithDiscount = (discountAmount) => {
    return charges.reduce((sum, charge) => sum + calculateChargeAmountWithDiscount(charge, discountAmount), 0);
  };

  const totalChargeAmount = useMemo(() => {
    return charges.reduce((sum, charge) => sum + calculateChargeAmount(charge), 0);
  }, [charges, cartTotal]);

  const finalTotal = useMemo(() => {
    return cartTotal + totalChargeAmount;
  }, [cartTotal, totalChargeAmount]);

  // Reset charges and discount when cart is emptied (for next transaction)
  const handleEmptyCart = () => {
    emptyCart();

    // Reset charges to default charges
    const isReturn = cartType === 'sales_return_cart';
    const chargesData = Array.isArray(defaultCharges) ? defaultCharges : [];

    if (chargesData.length > 0) {
      const mapped = chargesData.map((charge) => ({
        ...charge,
        id: charge.id || `charge_${Math.random()}`,
        rate_value: isReturn ? -Math.abs(charge.rate_value) : Number(charge.rate_value),
      }));
      setCharges(mapped);
    } else {
      setCharges([]);
    }

    setDiscount(0);
  };

  // Empty only cart items, preserve charges and discount
  const emptyCartItemsOnly = () => {
    emptyCart();
  };

  return (
    <SalesContext.Provider
      value={{
        cartState,
        cartTotal,
        totalQuantity,
        totalProfit,
        charges,
        totalChargeAmount,
        finalTotal,
        discount,
        setDiscount,
        calculateChargeAmount,
        calculateChargeAmountWithDiscount,
        calculateChargesWithDiscount,
        addCharge,
        removeCharge,
        updateCharge,
        addToCart,
        removeFromCart,
        updateProductQuantity,
        emptyCart: handleEmptyCart,
        emptyCartItemsOnly,
        updateCartItem,
        holdCart,
        setHeldCartToCart,
        removeHeldItem,
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
