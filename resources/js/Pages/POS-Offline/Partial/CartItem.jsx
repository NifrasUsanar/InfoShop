import React, { useContext, useEffect, useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { Avatar, Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import QuantityInput from './QuantityInput';
import CartItemModal from './CartItemModal';
import { usePage } from "@inertiajs/react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { useSales as useCart } from '@/Context/SalesContext';
import { SharedContext } from "@/Context/SharedContext";
import productplaceholder from "@/Pages/Product/product-placeholder.webp";
import { useCurrencyFormatter } from '@/lib/currencyFormatter';

export default function CartItems() {
  const formatCurrency = useCurrencyFormatter();
  const return_sale = usePage().props.return_sale;
  const edit_sale = usePage().props.edit_sale;
  const sale_data = usePage().props.sale_data;

  const { cartState, removeFromCart, emptyCart, emptyCartItemsOnly, addToCart } = useCart();
  const { setCartItemModalOpen, setSelectedCartItem, cartItemModalOpen } = useContext(SharedContext);

  // Handle cart item menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setMenuItem(item); // store the specific item
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  // Handle cart item menu end

  const handleCartMenuClick = (item, type) => {
    if (type === 'free') {
      const freeItem = { ...item, price: 0, cost: 0, add_new_item: true, quantity: 1, is_free: true };
      addToCart(freeItem);
    }
    else if (type === "duplicate") {
      const duplicateItem = { ...item, add_new_item: true };
      addToCart(duplicateItem);
    }
    handleClose()
  };

  useEffect(() => {
    if (edit_sale && sale_data?.cart_snapshot) {
      emptyCartItemsOnly()
      const cartItems = JSON.parse(sale_data.cart_snapshot);
      cartItems.forEach((item) => {
        addToCart(item, item.quantity);
      })
    }
  }, [edit_sale, sale_data?.cart_snapshot])

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {cartState.map((item, index) => (
        <React.Fragment key={index}>
          <ListItem alignItems="center" sx={{ padding: { sm: 0.5, xs: 0 }, paddingY: 0.5 }}>
            <ListItemAvatar onClick={(e) => handleClick(e, item)} className='cursor-pointer'>
              <Avatar variant="rounded" sx={{ width: 50, height: 50 }} alt={item.name} src={item.image_url ? item.image_url : productplaceholder} />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography
                  component="h5"
                  sx={{ fontWeight: 'bold', cursor: 'pointer', fontSize: { sm: '1rem', xs: '0.9rem' } }}  // Makes the text bold
                  className='hover:underline'
                  onClick={() => { setSelectedCartItem({ ...item, cart_index: index }); setCartItemModalOpen(true); }}
                >
                  {item.name}{item.unit ? ` | ${item.unit}` : ''}
                </Typography>
              }
              sx={{ ml: '10px' }}
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: 'text.primary', display: 'inline' }}
                  >
                    {(item.price - item.discount) * item.quantity === 0 ? (
                      <span className='bg-green-600 text-white px-2 py-1 rounded-md'>Free</span>
                    ) : (
                      <>
                        {formatCurrency(item.price - item.discount, false)} X {item.quantity} = <b>{formatCurrency((item.price - item.discount) * item.quantity, false)}
                        {item.flat_discount > 0 && ' - '+formatCurrency(item.flat_discount, false)}</b>
                      </>
                    )}
                    <br />
                  </Typography>
                </>
              }
            />

            <Box className="flex flex-row">
              <div className="relative w-full flex flex-row">
                <QuantityInput cartItem={{ ...item, cart_index: index }}></QuantityInput>
                <IconButton aria-label="delete" color='error' sx={{ ml: '8px' }} onClick={() => removeFromCart(index)}>
                  <DeleteIcon />
                </IconButton>
              </div>
            </Box>
          </ListItem>
          <Divider variant="inset" component="li" />
          <Menu
            id="cart-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{
              list: {
                'aria-labelledby': 'basic-button',
              },
            }}
          >
            <MenuItem onClick={() => handleCartMenuClick(menuItem, 'free')}>ADD FREE ITEMS</MenuItem>
            <MenuItem onClick={() => handleCartMenuClick(menuItem, 'duplicate')}>DUPLICATE</MenuItem>
          </Menu>
        </React.Fragment>
      ))}

      {cartItemModalOpen && <CartItemModal />}

    </List>
  );
}
