import React, { useState, useContext, useMemo } from "react";
import {
    IconButton,
    TextField,
    Grid,
    Divider,
    MenuItem,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { useCurrencyStore } from "../stores/currencyStore";

const initialPaymentFormState = {
    amount: 0,
    payment_method: 'Cash',
    transaction_date: dayjs().format("YYYY-MM-DD"), // Today's date in 'YYYY-MM-DD' format
    note: '',
    store_id: 1,
};

export default function AddPaymentDialog({
    open,
    setOpen,
    selectedContact,
    selectedTransaction = null,
    amountLimit,
    is_customer = false,
    stores = null,
    refreshTable
}) {
    const [loading, setLoading] = useState(false);
    const [paymentForm, setPaymentFormState] = useState(initialPaymentFormState);
    const currencySymbol = useCurrencyStore((state) => state.settings.currency_symbol);

    const getButtonText = () => {
        if (loading) {
            return 'Loading...';
        }
        if (paymentForm.payment_method === 'Cash' || paymentForm.payment_method === 'Cheque') {
            return paymentForm.amount < 0 ? 'REFUND' : 'PAY';
        }
        if (paymentForm.payment_method === 'Account Balance') {
            return paymentForm.amount < 0 ? 'CREDIT' : 'UPDATE BALANCE';
        }
        return 'ADD PAYMENT'; // Default text
    };

    const handleClose = () => {
        setPaymentFormState(initialPaymentFormState)
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setPaymentFormState({
            ...paymentForm,
            [name]: value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());
        formJson.contact_id = selectedContact

        const submitter = event.nativeEvent.submitter.name;
        if(submitter=='credit') formJson.amount = -Math.abs(paymentForm.amount)

        if (selectedTransaction !== null) {
            formJson.transaction_id = selectedTransaction.id
            formJson.store_id = selectedTransaction.store_id
        }

        let url = '/customer-transaction';
        if (!is_customer) url = "/vendor-transaction"

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
                refreshTable(window.location.pathname)
                handleClose()
            })
            .catch((error) => {
                Swal.fire({
                    title: "Failed!",
                    text: error.response.data.error,
                    icon: "error",
                    showConfirmButton: true,
                });
                console.log(error);
            }).finally(() => {
                setLoading(false); // Reset submitting state
            });
    };

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
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
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                name="amount"
                                label="Amount"
                                variant="outlined"
                                autoFocus
                                sx={{ input: { fontWeight: 'bold' } }}
                                value={paymentForm.amount}
                                onChange={handleFieldChange}
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
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    name="payment_method"
                                    value={paymentForm.payment_method}
                                    onChange={handleFieldChange}
                                    label="Payment Method"
                                    select
                                    fullWidth
                                >
                                    <MenuItem value={'Cash'}>Cash</MenuItem>
                                    <MenuItem value={'Cheque'}>Cheque</MenuItem>
                                    <MenuItem value={'Card'}>Card</MenuItem>
                                    <MenuItem value={'Bank'}>Bank</MenuItem>
                                    {selectedTransaction === null && (
                                        <MenuItem value={'Account Balance'}>Account Balance</MenuItem>
                                    )}
                                    {selectedTransaction !== null && (
                                        <MenuItem value={'Account'}>Account</MenuItem>
                                    )}
                                </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Date"
                                name="transaction_date"
                                fullWidth
                                type="date"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={paymentForm.transaction_date}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        {(selectedTransaction === null || amountLimit === undefined) && (
                            <Grid size={{ xs: 12, sm: 12 }}>
                                    <TextField
                                        value={paymentForm.store_id}
                                        label="Store"
                                        onChange={handleFieldChange}
                                        required
                                        name="store_id"
                                        select
                                        fullWidth
                                    >
                                        {stores?.map((store) => (
                                            <MenuItem key={store.id} value={store.id}>
                                                {store.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ py: '0.5rem' }}></Divider>

                    <TextField
                        fullWidth
                        variant="outlined"
                        label={"Note"}
                        name="note"
                        multiline
                        sx={{ mt: "1rem" }}
                        value={paymentForm.note}
                        onChange={handleFieldChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        color={paymentForm.amount < 0 ? "error" : "primary"}
                        disabled={paymentForm.amount == 0 || (amountLimit !== undefined && paymentForm.amount > amountLimit) || loading}
                    >
                        {/* {loading ? 'Loading...' : 'ADD PAYMENT'} */}
                        {getButtonText()}
                    </Button>

                    {(selectedTransaction === null && paymentForm.amount >= 0) && (
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                            type="submit"
                            color={"error"}
                            name={"credit"}
                            value={'credit'}
                            disabled={paymentForm.amount == 0 || (amountLimit !== undefined && paymentForm.amount > amountLimit) || loading}
                        >
                            {loading ? 'Loading...' : (paymentForm.payment_method === 'Cash' || paymentForm.payment_method === 'Cheque' ? 'REFUND' : 'CREDIT')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
