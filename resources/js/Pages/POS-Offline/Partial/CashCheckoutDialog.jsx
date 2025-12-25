import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import PaymentsIcon from "@mui/icons-material/Payments";
import { Box, Grid, IconButton, TextField, FormControlLabel, Checkbox } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintReceiptModal from "@/Components/PrintReceiptModal";
import PercentIcon from '@mui/icons-material/Percent';
import InputAdornment from '@mui/material/InputAdornment';
import { router } from '@inertiajs/react';
import axios from "axios";
import Swal from "sweetalert2";
import { usePage } from "@inertiajs/react";
import { useState, useEffect, useContext } from 'react';

import { useSales as useCart } from '@/Context/SalesContext';
import { SharedContext } from "@/Context/SharedContext";
import { useCurrencyFormatter, toNumeric } from "@/lib/currencyFormatter";
import { useCurrencyStore } from "@/stores/currencyStore";

export default function CashCheckoutDialog({ disabled }) {
    const formatCurrency = useCurrencyFormatter();
    const currencySymbol = useCurrencyStore((state) => state.settings.currency_symbol);
    const return_sale = usePage().props.return_sale;
    const return_sale_id = usePage().props.sale_id;
    const edit_sale = usePage().props.edit_sale;
    const edit_sale_id = usePage().props.sale_id;

    const { cartState, cartTotal, totalProfit, emptyCart, charges, totalChargeAmount, finalTotal, discount, setDiscount: setContextDiscount, calculateChargesWithDiscount } = useCart();
    const { selectedCustomer, saleDate, saleTime } = useContext(SharedContext);
    const [loading, setLoading] = useState(false);

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const autoOpenPrintSetting = usePage().props.settings?.auto_open_print_dialog ?? '1';
    const [openPrintDialog, setOpenPrintDialog] = useState(autoOpenPrintSetting === '1');

    const [amountReceived, setAmountReceived] = useState(0);
    const [recalculatedCharges, setRecalculatedCharges] = useState(totalChargeAmount);
    const isMobile = window.innerWidth < 768;

    // Calculate reactive final total with discount
    const reactiveFinalTotal = (cartTotal - discount) + recalculatedCharges;

    // Initialize recalculated charges when dialog opens or when charges/cartTotal/discount change
    useEffect(() => {
        setRecalculatedCharges(calculateChargesWithDiscount(discount));
    }, [charges, cartTotal, discount]);

    const handleDiscountChange = (event) => {
        const inputDiscount = event.target.value;
        const newDiscount = inputDiscount !== "" ? parseFloat(inputDiscount) : 0;
        setContextDiscount(newDiscount);

        const recalculatedChargeAmount = calculateChargesWithDiscount(newDiscount);
        setRecalculatedCharges(recalculatedChargeAmount);
    };

    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setContextDiscount(0);
        setOpen(true);
    };

    const handleClose = () => {
        setAmountReceived(0)
        setContextDiscount(0)
        setOpen(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (loading) return;
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());

        // Sanitize numeric fields
        formJson.amount_received = toNumeric(formJson.amount_received);
        formJson.discount = toNumeric(formJson.discount);
        formJson.net_total = toNumeric((cartTotal - discount) + recalculatedCharges);
        formJson.change_amount = toNumeric(amountReceived - ((cartTotal - discount) + recalculatedCharges));

        formJson.cartItems = cartState.map(item => ({
            ...item,
            price: toNumeric(item.price),
            quantity: toNumeric(item.quantity),
            discount: toNumeric(item.discount || 0)
        }));
        formJson.charges = charges.map(c => ({
            ...c,
            rate_value: toNumeric(c.rate_value)
        }));
        formJson.profit_amount = totalProfit - discount; //total profit is from the sale items, but we apply discount for the bill also
        formJson.sale_date = saleDate;
        formJson.sale_time = saleTime;
        formJson.payment_method = 'Cash'
        formJson.contact_id = selectedCustomer.id
        formJson.return_sale = return_sale;
        formJson.return_sale_id = return_sale_id;
        formJson.edit_sale_id = edit_sale_id;
        formJson.edit_sale = edit_sale;

        axios.post('/pos/checkout', formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                emptyCart() //Clear the cart from the Context API
                setAmountReceived(0)
                setContextDiscount(0)
                if (openPrintDialog && resp.data.receipt) {
                    setReceiptData(resp.data.receipt);
                    setShowPrintModal(true);
                } else {
                    router.visit('/receipt/' + resp.data.sale_id)
                }
                axios.get('/sale-notification/' + resp.data.sale_id)
                    .then((resp) => {
                        console.log("Notification sent successfully:", resp.data.success);
                    })
                    .catch((error) => {
                        console.error("Failed to send notification:", error.response.data.error);
                    });
                setOpen(false)
            })
            .catch((error) => {
                // console.error("Submission failed with errors:", error);
                Swal.fire({
                    title: "Failed!",
                    text: error.response.data.error,
                    icon: "error",
                    showConfirmButton: true,
                    // timer: 2000,
                    // timerProgressBar: true,
                });
                console.log(error);
            }).finally(() => {
                setLoading(false); // Reset submitting state
            });
    };

    const discountPercentage = () => {
        if (discount < 0 || discount > 100) {
            alert("Discount must be between 0 and 100");
            return;
        }
        const discountAmount = (cartTotal * discount) / 100;
        setContextDiscount(discountAmount);

        const recalculatedChargeAmount = calculateChargesWithDiscount(discountAmount);
        setRecalculatedCharges(recalculatedChargeAmount);
    }

    return (
        <Grid size={12}>
            <Button
                variant="contained"
                color="success"
                sx={{ paddingY: "15px", flexGrow: "1" }}
                size="large"
                endIcon={<PaymentsIcon />}
                onClick={handleClickOpen}
                disabled={disabled}
                fullWidth
            >
                {reactiveFinalTotal < 0 ? `REFUND ${formatCurrency(Math.abs(reactiveFinalTotal))}` : `CASH ${formatCurrency(reactiveFinalTotal)}`}
            </Button>
            <Dialog
                fullWidth={true}
                maxWidth={"sm"}
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                PaperProps={{
                    component: 'form',
                    onSubmit: handleSubmit,
                }}
                fullScreen={isMobile}
            >
                <DialogTitle id="alert-dialog-title">
                    {"Cash Checkout"}
                </DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    <TextField
                        id="txtAmount"
                        fullWidth
                        autoFocus
                        variant="outlined"
                        label={cartTotal < 0 ? 'Refund' : 'Amount Received'}
                        type="number"
                        name="amount_received"
                        onFocus={event => {
                            event.target.select();
                        }}

                        onChange={(event) => {
                            const value = event.target.value;

                            const numericValue = parseFloat(value); // Convert to number
                            setAmountReceived(
                                return_sale && numericValue > 0 ? -numericValue : numericValue
                            );
                        }}

                        sx={{ input: { textAlign: "center", fontSize: '2rem' }, }}
                        value={amountReceived}
                        slotProps={{
                            input: {
                                style: { textAlign: 'center' },
                                placeholder: cartTotal < 0 ? 'Refund Amount' : 'Amount Received',
                                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        id="txtDiscount"
                        // label="Discount"
                        type="number"
                        name="discount"
                        label="Discount"
                        variant="outlined"
                        value={discount}
                        sx={{ mt: "1.5rem", input: { textAlign: "center", fontSize: '2rem' }, }}
                        onChange={handleDiscountChange}
                        onFocus={event => {
                            event.target.select();
                        }}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                            input: {
                                startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton color="primary" onClick={discountPercentage}>
                                            <PercentIcon fontSize="large"></PercentIcon>
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />

                    <Grid container spacing={{ xs: 2, md: 1 }} mt={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            {/* Net total (after discount + recalculated charges) */}
                            <TextField
                                fullWidth
                                label="Payable Amount"
                                variant="outlined"
                                name="net_total"
                                value={formatCurrency((cartTotal - discount) + recalculatedCharges, false)}
                                sx={{input: { textAlign: "center", fontSize: '2rem' }, }}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        style: { textAlign: 'center' },
                                        startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm:6}}>
                            <TextField
                                id="txtChange"
                                fullWidth
                                label="Change"
                                variant="outlined"
                                name="change_amount"
                                sx={{input: { textAlign: "center", fontSize: '2rem' } }}
                                value={formatCurrency(amountReceived - ((cartTotal - discount) + recalculatedCharges), false)}
                                slotProps={{
                                    input: {
                                        readOnly: true,
                                        startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                    </Grid>

                    <TextField
                        fullWidth
                        variant="outlined"
                        label={'Note'}
                        name="note"
                        multiline
                        sx={{ mt: '2rem', }}
                    />

                    <Grid container size={12} sx={{ mt: "2rem", mb: "1rem" }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={openPrintDialog}
                                    onChange={(e) => setOpenPrintDialog(e.target.checked)}
                                    name="open_print_dialog"
                                />
                            }
                            label="Open Print Dialog"
                        />
                    </Grid>

                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        // onClick={handleClose}
                        disabled={
                            !amountReceived ||
                            (cartTotal < 0 && amountReceived === 0) ||
                            (cartTotal < 0 && amountReceived != ((cartTotal - discount) + recalculatedCharges)) ||
                            (cartTotal >= 0 && (amountReceived - ((cartTotal - discount) + recalculatedCharges)) < 0) ||
                            loading

                        }
                    >
                        {loading ? 'Loading...' : cartTotal < 0 ? 'REFUND' : 'PAY'}
                    </Button>
                </DialogActions>
            </Dialog>
            <PrintReceiptModal
                open={showPrintModal}
                onClose={() => {
                    setShowPrintModal(false);
                    setReceiptData(null);
                }}
                receiptData={receiptData}
            />
        </Grid>
    );
}
