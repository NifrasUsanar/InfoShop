import React, { useState, useContext, useMemo } from "react";
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
    MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { useCurrencyStore } from "../../../stores/currencyStore";

const initialPaymentFormState = {
    amount: 0,
    expense_date: dayjs().format("YYYY-MM-DD"), // Today's date in 'YYYY-MM-DD' format
    description: '',
    store_id: 1,
    source:'drawer'
};

export default function ExpenseDialog({
    open,
    setOpen,
    stores,
    refreshExpenses
}) {

    const [expensesForm, setPaymentFormState] = useState(initialPaymentFormState);
    const { settings: currencySettings } = useCurrencyStore();

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setPaymentFormState({
            ...expensesForm,
            [name]: value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        let url = '/expense';

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
                refreshExpenses(window.location.pathname)
                setOpen(false)
            })
            .catch((error) => {
                console.error("Submission failed with errors:", error);
                console.log(formJson);
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
                <DialogTitle id="alert-dialog-title">ADD EXPENSE</DialogTitle>
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
                        <Grid size={{xs:6, sm:4}}>
                            <TextField
                                fullWidth
                                type="number"
                                name="amount"
                                label="Amount"
                                variant="outlined"
                                autoFocus
                                sx={{ input: { fontWeight: "bold" } }}
                                value={expensesForm.amount}
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
                                                {currencySettings.currency_symbol}
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{xs:6, sm:4}}>
                            <TextField
                                label="Date"
                                name="expense_date"
                                fullWidth
                                type="date"
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={expensesForm.expense_date}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>
                        <Grid size={{xs:12, sm:4}}>
                            <TextField
                                label="Source"
                                name="source"
                                fullWidth
                                select
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={expensesForm.source}
                                onChange={handleFieldChange}
                                required
                            >
                                <MenuItem value={"drawer"}>
                                    Cash Drawer
                                </MenuItem>
                                <MenuItem value={"external"}>External</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid container size={{xs:12, sm:12}} spacing={2}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Description"}
                                name="description"
                                placeholder="Description"
                                value={expensesForm.note}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={12}>
                                <TextField
                                    value={expensesForm.store_id}
                                    label="Store"
                                    fullWidth
                                    onChange={handleFieldChange}
                                    required
                                    name="store_id"
                                    select
                                >
                                    {stores?.map((store) => (
                                        <MenuItem
                                            key={store.id}
                                            value={store.id}
                                        >
                                            {store.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                        </Grid>
                    </Grid>

                    <Divider sx={{ py: "0.5rem" }}></Divider>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        disabled={expensesForm.amount == 0}
                    >
                        ADD EXPENSE
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
