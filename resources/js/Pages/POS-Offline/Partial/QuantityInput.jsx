import React, { useState, useEffect } from 'react';
import './QuantityInput.css'; // Import your CSS file
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { IconButton } from '@mui/material';
import { useSales as useCart } from '@/Context/SalesContext';

const QuantityInput = ({ cartItem }) => {
  const { cartState, updateProductQuantity } = useCart();

  const [quantity, setQuantity] = useState(cartItem.quantity);
  const [inputValue, setInputValue] = useState(cartItem.quantity);
  const min = 0;
  const max = 9999;

  useEffect(() => {
    setQuantity(cartItem.quantity);
    setInputValue(cartItem.quantity);
  }, [cartItem.quantity]); // Only update when THIS item's quantity changes, not entire cart


  const handleQuantityChange = (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      const newQuantity = Math.max(min, Math.min(value, max));
      setQuantity(newQuantity);
      setInputValue(newQuantity);
      updateProductQuantity(cartItem.id, cartItem.batch_number, newQuantity, cartItem.cart_index);
    } else {
      setInputValue(min);
      updateProductQuantity(cartItem.id, cartItem.batch_number, min, cartItem.cart_index);
    }
  };

  const decreaseValue = () => {
    const newQuantity = Math.max(parseFloat(quantity) - 1, min);
    setQuantity(newQuantity);
    setInputValue(newQuantity);
    updateProductQuantity(cartItem.id, cartItem.batch_number, newQuantity, cartItem.cart_index);
  };

  const increaseValue = () => {
    const newQuantity = Math.min(parseFloat(quantity) + 1, max);
    setQuantity(newQuantity);
    setInputValue(newQuantity);
    updateProductQuantity(cartItem.id, cartItem.batch_number, newQuantity, cartItem.cart_index);
  };

  return (
    <div className="quantity">
      <IconButton onClick={decreaseValue} disabled={quantity <= min}>
        <RemoveIcon></RemoveIcon>
      </IconButton>
      <input
        type="number"
        className="input-box"
        step='0.01'
        value={inputValue}
        min={min}
        max={max}
        onChange={handleQuantityChange}
        onFocus={(e) => e.target.select()}
      />
      <IconButton onClick={increaseValue} disabled={quantity >= max}>
        <AddIcon></AddIcon>
      </IconButton>
    </div>
  );
};

export default QuantityInput;
