import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  IconButton,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Close as CloseIcon,
  LocalAtm,
  CreditCard,
  AccountBalance,
  MoneyOff,
  Receipt,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { useSales as useCart } from '@/Context/SalesContext';
import { SharedContext } from '@/Context/SharedContext';
import { useCurrencyFormatter } from '@/lib/currencyFormatter';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useFirebase } from '../contexts/FirebaseContext';
import { useAppConfig } from '../contexts/AppConfigContext';
import Swal from 'sweetalert2';

export default function CheckoutModal({ open, onClose }) {
  const formatCurrency = useCurrencyFormatter();
  const currencySymbol = useCurrencyStore((state) => state.settings.currency_symbol);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payments, setPayments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    cartState,
    cartTotal,
    totalQuantity,
    totalProfit,
    charges,
    discount,
    finalTotal,
    calculateChargeAmountWithDiscount,
    setDiscount,
    calculateChargesWithDiscount,
    emptyCart,
  } = useCart();

  const { selectedCustomer, saleDate, saleTime } = useContext(SharedContext);
  const { createSale, isInitialized: firebaseInitialized } = useFirebase();
  const { settings } = useAppConfig();
  
  // State for recalculated charges (updates when discount changes)
  const [recalculatedCharges, setRecalculatedCharges] = useState(0);

  // Initialize recalculated charges when component mounts or charges/discount change
  useEffect(() => {
    const initialCharges = calculateChargesWithDiscount(discount);
    setRecalculatedCharges(initialCharges);
  }, [charges, cartTotal, discount, calculateChargesWithDiscount]);

  // Calculate reactive final total with discount
  const grandTotal = (cartTotal - discount) + recalculatedCharges;

  // Payment calculations
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const amountRemaining = grandTotal - totalPaid;
  const change = totalPaid > grandTotal ? totalPaid - grandTotal : 0;

  const handleDiscountChange = (event) => {
    const inputDiscount = event.target.value;
    const newDiscount = inputDiscount !== "" ? parseFloat(inputDiscount) : 0;
    setDiscount(newDiscount);

    const recalculatedChargeAmount = calculateChargesWithDiscount(newDiscount);
    setRecalculatedCharges(recalculatedChargeAmount);
  };

  const discountPercentage = () => {
    if (discount < 0 || discount > 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Percentage',
        text: 'Discount must be between 0 and 100',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
    const discountAmount = (cartTotal * discount) / 100;
    setDiscount(discountAmount);

    const recalculatedChargeAmount = calculateChargesWithDiscount(discountAmount);
    setRecalculatedCharges(recalculatedChargeAmount);
  };

  const addPayment = (method) => {
    const amount = parseFloat(paymentAmount) || amountRemaining;

    if (amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Amount',
        text: 'Please enter a valid payment amount',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Only cash can exceed the total (for giving change)
    if (method !== 'Cash' && amount > amountRemaining) {
      Swal.fire({
        icon: 'warning',
        title: 'Amount Too Large',
        text: 'Payment amount exceeds remaining balance',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    // Check if payment method already exists
    const existingPaymentIndex = payments.findIndex(p => p.method === method);

    if (existingPaymentIndex !== -1) {
      // Method exists - combine amounts
      const updatedPayments = [...payments];
      updatedPayments[existingPaymentIndex].amount += amount;
      setPayments(updatedPayments);

      Swal.fire({
        icon: 'success',
        title: 'Payment Updated',
        text: `${method} payment updated to ${formatCurrency(updatedPayments[existingPaymentIndex].amount)}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } else {
      // New method - add to list
      setPayments([...payments, { method, amount }]);
    }

    setPaymentAmount('');
  };

  const removePayment = (index) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'Cash':
        return <LocalAtm sx={{ color: '#16a34a' }} />;
      case 'Card':
        return <CreditCard sx={{ color: '#2563eb' }} />;
      case 'Cheque':
        return <Receipt sx={{ color: '#7c3aed' }} />;
      case 'Bank':
        return <AccountBalance sx={{ color: '#ea580c' }} />;
      case 'Credit':
        return <MoneyOff sx={{ color: '#dc2626' }} />;
      default:
        return <PaymentIcon />;
    }
  };

  const getPaymentButtonColor = (method) => {
    switch (method) {
      case 'Cash':
        return { bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } };
      case 'Card':
        return { bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } };
      case 'Cheque':
        return { bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } };
      case 'Bank':
        return { bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } };
      case 'Credit':
        return { bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } };
      default:
        return { bgcolor: 'primary.main' };
    }
  };

  const handleCompletePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Generate invoice number (timestamp-based)
      const invoiceNumber = `INV-${Date.now()}`;

      // Prepare sale data for Firebase (matching Laravel structure)
      const saleDataRaw = {
        invoice_number: invoiceNumber,
        store_id: settings?.store_id || 1,
        contact_id: selectedCustomer?.id || null,
        sale_date: saleDate,
        sale_time: saleTime,
        discount: discount || 0,
        total_charge_amount: recalculatedCharges || 0,
        amount_received: totalPaid || 0,
        net_total: grandTotal || 0,
        change_amount: change || 0,
        profit_amount: (totalProfit || 0) - (discount || 0),
        payment_method: payments.length > 0 ? payments[0].method : 'Cash',
        payment_status: 'paid',
        status: 'completed',
        note: '',
        items: cartState.map(item => ({
          id: item.id || null,
          batch_id: item.batch_id || null,
          batch_number: item.batch_number || null,
          quantity: item.quantity || 0,
          price: item.price || 0,
          cost: item.cost || 0,
          discount: item.discount || 0,
          flat_discount: item.flat_discount || 0,
          is_stock_managed: item.is_stock_managed ?? 1,
          is_free: item.is_free || 0,
          free_quantity: item.free_quantity || 0,
          category_name: item.category_name || null,
          product_type: item.product_type || 'normal',
        })),
        charges: charges.map(charge => ({
          id: charge.id || null,
          name: charge.name || '',
          charge_type: charge.charge_type || 'tax',
          rate_value: charge.rate_value || 0,
          rate_type: charge.rate_type || 'percentage',
        })),
        transactions: payments || [], // Store all payment methods
        created_by: 'pos-offline',
        syncedFrom: 'offline',
      };

      // Remove any undefined values (Firestore doesn't support undefined)
      const saleData = JSON.parse(JSON.stringify(saleDataRaw));

      // Save to Firebase
      if (firebaseInitialized) {
        console.log('💾 [CheckoutModal] Saving sale to Firebase:', invoiceNumber);
        await createSale(saleData);
        console.log('✅ [CheckoutModal] createSale returned - showing success message');
      } else {
        console.warn('⚠️ Firebase not initialized, sale not saved');
      }

      // Show success message
      console.log('🎉 [CheckoutModal] Displaying Swal success message');
      Swal.fire({
        title: "Success!",
        text: `Sale ${invoiceNumber} completed successfully!`,
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      // Clear cart and close dialog
      emptyCart();
      setPayments([]);
      setPaymentAmount('');
      setDiscount(0);
      onClose();

    } catch (error) {
      console.error('❌ [CheckoutModal] Checkout error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: error.message || 'An error occurred during checkout',
      });
    } finally {
      console.log('🔧 [CheckoutModal] Finally block - resetting isSubmitting');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPayments([]);
    setPaymentAmount('');
    setDiscount(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '95vh',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2.5, 
        borderBottom: 1, 
        borderColor: 'divider', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PaymentIcon sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight="bold">
            Checkout & Payment
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: 'grey.50' }}>
        <Box sx={{ p: 3 }}>
          {/* Bill Summary */}
          <Paper elevation={1} sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2.5 }}>
              Bill Summary
            </Typography>

            {/* 3-Column Layout: Items, Subtotal, Discount */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Items"
                  variant="outlined"
                  size="medium"
                  value={`${cartState.length} (Qty: ${totalQuantity})`}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.50',
                      fontWeight: 600,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Subtotal"
                  variant="outlined"
                  size="medium"
                  value={formatCurrency(cartTotal, false)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    ),
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.50',
                      fontWeight: 600,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount"
                  variant="outlined"
                  size="medium"
                  value={discount}
                  onChange={handleDiscountChange}
                  onFocus={(event) => event.target.select()}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" color="primary" onClick={discountPercentage} title="Convert to percentage">
                          <PercentIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Charges */}
            {charges.length > 0 && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  CHARGES & TAXES
                </Typography>
                {charges.map((charge) => {
                  const chargeAmount = calculateChargeAmountWithDiscount(charge);
                  return (
                    <Box key={charge.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">
                        {charge.name} {charge.rate_type === 'percentage' ? `(${charge.rate_value}%)` : ''}
                      </Typography>
                      <Typography variant="body2" fontWeight="600" color="success.main">
                        +{formatCurrency(chargeAmount)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}

            {/* Grand Total */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2.5,
              mt: 2,
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 1.5,
            }}>
              <Typography variant="h6" fontWeight="bold">
                Grand Total
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(grandTotal)}
              </Typography>
            </Box>
          </Paper>

          {/* Payment Section */}
          <Paper elevation={1} sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Payment Methods
            </Typography>

            {/* Amount Input */}
            <TextField
              fullWidth
              type="number"
              label="Enter Amount"
              variant="outlined"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={formatCurrency(amountRemaining, false)}
              inputProps={{ step: '0.01' }}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">{currencySymbol}</InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& input': { fontSize: '1.25rem', fontWeight: 600 }
              }}
            />

            {/* Payment Method Buttons */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<LocalAtm />}
                  onClick={() => addPayment('Cash')}
                  sx={getPaymentButtonColor('Cash')}
                >
                  CASH
                </Button>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<CreditCard />}
                  onClick={() => addPayment('Card')}
                  sx={getPaymentButtonColor('Card')}
                >
                  CARD
                </Button>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Receipt />}
                  onClick={() => addPayment('Cheque')}
                  sx={getPaymentButtonColor('Cheque')}
                >
                  CHEQUE
                </Button>
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<AccountBalance />}
                  onClick={() => addPayment('Bank')}
                  sx={getPaymentButtonColor('Bank')}
                >
                  BANK
                </Button>
              </Grid>
              {selectedCustomer && selectedCustomer.id !== 1 && (
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<MoneyOff />}
                    onClick={() => addPayment('Credit')}
                    sx={getPaymentButtonColor('Credit')}
                  >
                    CREDIT
                  </Button>
                </Grid>
              )}
            </Grid>

            {/* Added Payments */}
            {payments.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mb: 1.5 }}>
                  Payments Added
                </Typography>
                {payments.map((payment, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      mb: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {getPaymentIcon(payment.method)}
                      <Typography variant="body1" fontWeight="medium">
                        {payment.method}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(payment.amount)}
                      </Typography>
                      <IconButton size="small" onClick={() => removePayment(index)} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Payment Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Total</Typography>
                <Typography variant="body1" fontWeight="600">
                  {formatCurrency(grandTotal)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Paid</Typography>
                <Typography variant="body1" fontWeight="600" color="success.main">
                  {formatCurrency(totalPaid)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {change > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Change
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {formatCurrency(change)}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Remaining
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={amountRemaining > 0 ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(amountRemaining)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Complete Payment Button */}
            {totalPaid >= grandTotal && payments.length > 0 && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                color="success"
                onClick={handleCompletePayment}
                disabled={isSubmitting}
                sx={{
                  mt: 3,
                  py: 2,
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                }}
              >
                {isSubmitting
                  ? 'Processing...'
                  : change > 0
                    ? `COMPLETE PAYMENT (Change: ${formatCurrency(change)})`
                    : 'COMPLETE PAYMENT'}
              </Button>
            )}
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
