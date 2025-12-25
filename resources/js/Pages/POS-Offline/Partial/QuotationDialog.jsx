import React, { useState, useContext, useMemo, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { IconButton, TextField,  Grid } from "@mui/material";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";
export default function QuotationDialog({
    useCart,
    open,
    setOpen,
    selectedContact
}) {
    const { cartState, cartTotal, emptyCart, totalProfit } = useCart();
    const [loading, setLoading] = useState(false);
    const [discount, setDiscount] = useState(0);

    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        formJson.cartItems = cartState;
        formJson.contact_id = selectedContact.id;
        formJson.profit_amount = totalProfit - discount

        axios
            .post('/quotations', formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
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

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
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
                <DialogTitle id="alert-dialog-title">NEW QUOTATION</DialogTitle>
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
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                type="number"
                                id="discount"
                                label="Discount"
                                value={discount === "" ? 0 : discount}
                                onFocus={(event) => event.target.select()}
                                onChange={(event) => setDiscount(event.target.value === "" ? 0 : event.target.value)}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="total"
                                label="Total"
                                value={cartTotal - discount}
                                slotProps={{
                                    readOnly: true,
                                }}
                            />
                        </Grid>
                        
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                required
                                id="quotation_date"
                                name="quotation_date"
                                label="Quotation Date"
                                type="date"
                                defaultValue={dayjs().format("YYYY-MM-DD")}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                required
                                name="expiry_date"
                                label="Expiry Date"
                                type="date"
                                defaultValue={dayjs().add(30, 'day').format("YYYY-MM-DD")}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                required
                                name="customer_notes"
                                label="Customer Notes"
                                type="text"
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                required
                                name="terms_conditions"
                                label="Terms and Conditions"
                                type="text"
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "5px", fontSize: "1.5rem" }}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'SAVE'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}


