import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
    Grid,
    Divider,
    Table, TableBody, TableRow, TableCell,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import PrintReceiptModal from "@/Components/PrintReceiptModal";

import PercentIcon from '@mui/icons-material/Percent';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import InputAdornment from "@mui/material/InputAdornment";
import { router } from "@inertiajs/react";
import axios from "axios";
import Swal from "sweetalert2";
import { usePage } from "@inertiajs/react";
import { X } from "lucide-react";
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useCurrencyFormatter, toNumeric } from "@/lib/currencyFormatter";
import { useCurrencyStore } from "@/stores/currencyStore";

export default function PaymentsCheckoutDialog({
    useCart,
    open,
    setOpen,
    selectedContact,
    formData,
    is_sale = false,
}) {
    const formatCurrency = useCurrencyFormatter();
    const currencySymbol = useCurrencyStore((state) => state.settings.currency_symbol);
    const { cartState, cartTotal, emptyCart, totalProfit, charges, totalChargeAmount, finalTotal, discount, setDiscount: setContextDiscount, calculateChargesWithDiscount } = useCart();
    const return_sale = usePage().props.return_sale;
    const return_sale_id = usePage().props.sale_id;
    const edit_sale = usePage().props.edit_sale;
    const edit_sale_id = usePage().props.sale_id;

    const [loading, setLoading] = useState(false);

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const autoOpenPrintSetting = usePage().props.settings?.auto_open_print_dialog ?? '1';
    const [openPrintDialog, setOpenPrintDialog] = useState(autoOpenPrintSetting === '1');

    const [amount, setAmount] = useState((finalTotal - discount))
    const [payments, setPayments] = useState([])
    const [amountReceived, setAmountReceived] = useState(0)
    const [recalculatedCharges, setRecalculatedCharges] = useState(totalChargeAmount)

    // Calculate reactive final total with discount
    const reactiveFinalTotal = (cartTotal - discount) + recalculatedCharges;

    // Initialize recalculated charges when charges/cartTotal/discount change
    useEffect(() => {
        const initialCharges = calculateChargesWithDiscount(discount);
        setRecalculatedCharges(initialCharges);
        setAmount((cartTotal - discount) + initialCharges);
    }, [charges, cartTotal, discount]);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const openPayment = Boolean(anchorEl);
    const handlePaymentClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handlePaymentClose = () => {
        setAnchorEl(null);
    };

    const handleDiscountChange = (event) => {
        const inputDiscount = event.target.value;
        const newDiscount =
            inputDiscount !== "" ? parseFloat(inputDiscount) : 0;
        setContextDiscount(newDiscount);

        const recalculatedChargeAmount = calculateChargesWithDiscount(newDiscount);
        setRecalculatedCharges(recalculatedChargeAmount);
    };

    const handleClose = () => {
        setPayments([])
        setAmountReceived(0)
        setContextDiscount(0)
        setOpen(false);
    };

    useEffect(() => {
        if (open) {
            setContextDiscount(0);
        }
    }, [open])

    useEffect(() => {
        const initialAmount = (cartTotal - discount) + recalculatedCharges;
        setAmount(initialAmount);
        setAmountReceived(payments.reduce((sum, payment) => sum + payment.amount, 0));
    }, [])

    useEffect(() => {
        setAmountReceived(payments.reduce((sum, payment) => sum + payment.amount, 0));
    }, [payments])

    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        // Sanitize numeric fields
        formJson.discount = toNumeric(formJson.discount);
        formJson.net_total = toNumeric(reactiveFinalTotal);

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
        formJson.contact_id = selectedContact.id;
        formJson.payments = payments.map(p => ({
            ...p,
            amount: toNumeric(p.amount)
        }));
        formJson = { ...formJson, ...formData } //Form data from the POS / Purchase form
        formJson.profit_amount = totalProfit - discount

        formJson.return_sale = return_sale;
        formJson.return_sale_id = return_sale_id;
        formJson.edit_sale_id = edit_sale_id;
        formJson.edit_sale = edit_sale;

        let url = '/pos/checkout';
        if (!is_sale) { url = "/purchase/store" }
        axios
            .post(url, formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                emptyCart(); //Clear the cart from the Context API
                setContextDiscount(0);
                setPayments([])
                if (!is_sale) {
                    router.visit("/purchases");
                } else {
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
                }
                setOpen(false)
            })
            .catch((error) => {
                const errorMessages = JSON.stringify(error.response, Object.getOwnPropertyNames(error));
                Swal.fire({
                    title: "Failed!",
                    text: errorMessages,
                    icon: "error",
                    showConfirmButton: true,
                });
                console.log(error);
            }).finally(() => {
                setLoading(false); // Reset submitting state
            });
    };

    // Function to handle the addition of a payment
    const addPayment = (paymentMethod) => {
        const netTotal = (cartTotal - discount) + recalculatedCharges;
        const balance = amountReceived + parseFloat(amount)
        if (netTotal < balance) {
            alert('Payment cannot be exceeded the total amount')
        }
        else if (amount) {
            const newPayment = { payment_method: paymentMethod, amount: parseFloat(amount) };
            setPayments([...payments, newPayment]);
            const newBalance = netTotal - balance;
            setAmount(newBalance > 0 ? newBalance : 0);
        }
        handlePaymentClose()
    };


    // Function to remove a payment
    const deletePayment = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments);
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
        <>
            <Dialog
                fullWidth={true}
                fullScreen={window.innerWidth < 768}
                maxWidth={"sm"}
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                PaperProps={{
                    component: "form",
                    onSubmit: handleSubmit,
                }}
            >
                <DialogTitle id="alert-dialog-title">ADD PAYMENTS</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[600],
                    })}
                >
                    <X size={26} />
                </IconButton>
                <DialogContent>
                    <Grid container spacing={2} alignItems={'center'}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                name="discount"
                                label="Discount"
                                variant="outlined"
                                value={discount}
                                onChange={handleDiscountChange}
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {currencySymbol}
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="start">
                                                <IconButton color="primary" onClick={discountPercentage}>
                                                    <PercentIcon fontSize="small"></PercentIcon>
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                size="large"
                                fullWidth
                                name="net_total"
                                label="Total"
                                variant="outlined"
                                sx={{
                                    input: { fontWeight: 'bold' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                    }
                                }}
                                value={String(formatCurrency(reactiveFinalTotal, false)) || '0'}
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {currencySymbol}
                                            </InputAdornment>
                                        ),
                                        readOnly: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid container size={12} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                            <Grid size={12} sx={{ mt: '1rem' }}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    type="number"
                                    name="amount"
                                    label="Amount"
                                    variant="outlined"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    onFocus={(event) => {
                                        event.target.select();
                                    }}
                                    sx={{ input: { fontSize: '1.4rem' } }}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    {currencySymbol}
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid size={12} spacing={1} container justifyContent={'center'}>
                                <Grid size={{xs:6,sm:4}}>
                                    <Button
                                    fullWidth
                                        component="label"
                                        role={undefined}
                                        variant="contained"
                                        startIcon={<PaymentsIcon />}
                                        onClick={() => addPayment('Cash')}
                                        color="success"
                                    >
                                        CASH
                                    </Button>
                                </Grid>
                                {selectedContact?.id !== 1 && (
                                    <Grid size={{xs:6,sm:4}}>
                                        <Button
                                        fullWidth
                                            component="label"
                                            role={undefined}
                                            variant="contained"
                                            startIcon={<PauseCircleOutlineIcon />}
                                            onClick={() => addPayment('Credit')}
                                            color="error"
                                        >
                                            CREDIT
                                        </Button>
                                    </Grid>
                                )}
                                <Grid size={{xs:6,sm:4}}>
                                    <Button
                                    fullWidth
                                        component="label"
                                        role={undefined}
                                        variant="contained"
                                        startIcon={<CreditCardIcon />}
                                        onClick={() => addPayment('Cheque')}
                                    >
                                        CHEQUE
                                    </Button>
                                </Grid>
                                <Grid size={{xs:6,sm:4}}>
                                    <Button
                                    fullWidth
                                        component="label"
                                        role={undefined}
                                        variant="contained"
                                        startIcon={<FontAwesomeIcon icon={faCreditCard} size={"2xl"} />}
                                        onClick={() => addPayment('Card')}
                                    >
                                        CARD
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{ py: '0.5rem' }}></Divider>

                    <Table sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        <TableBody>
                            {payments.map((payment, index) => (
                                <TableRow key={index}>
                                    {/* Display Payment Method Icon */}
                                    <TableCell sx={{ padding: '5px 16px' }}>
                                        {payment.payment_method === 'Cash' && <PaymentsIcon />}
                                        {payment.payment_method === 'Cheque' && <CreditCardIcon />}
                                        {payment.payment_method === 'Credit' && <PauseCircleOutlineIcon />}
                                        <span className="ml-2"><strong>{payment.payment_method}</strong></span>
                                    </TableCell>

                                    {/* Display Payment Amount */}
                                    <TableCell align="right">
                                        <strong>{formatCurrency(payment.amount)}</strong>
                                    </TableCell>

                                    {/* Action Button to delete payment */}
                                    <TableCell align="center">
                                        <IconButton edge="end" color="error" onClick={() => deletePayment(index)}>
                                            <HighlightOffIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Grid container size={12} sx={{ mt: "1rem", mb: "1rem" }}>
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

                    <TextField
                        fullWidth
                        variant="outlined"
                        label={"Note"}
                        name="note"
                        multiline
                        sx={{ mt: "1rem" }}
                        size="large"
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        disabled={amountReceived - ((cartTotal - discount) + recalculatedCharges) < 0 || loading || amountReceived > ((cartTotal - discount) + recalculatedCharges)}
                    >
                        {loading ? 'Loading...' : 'PAY'}
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
        </>
    );
}
