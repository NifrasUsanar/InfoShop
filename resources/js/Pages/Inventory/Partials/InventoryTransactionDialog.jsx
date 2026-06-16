import React, { useState, useEffect, useMemo } from "react";
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
    MenuItem,
    Autocomplete
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";

const inventoryTransactionFormState = {
    store_id: 1,
    transaction_date: dayjs().format("YYYY-MM-DD"),
    quantity: 0,
    reason: '',
};

const reasonOptions = [
    'Used in production',
    'Stock Entry',
    "Damaged",
    'Expired'
]

export default function InventoryTransactionDialog({
    open,
    setOpen,
    stores,
    refreshInventoryItems,
    inventory_item,
}) {

    const [inventoryTransactionForm, setInventoryTransactionForm] = useState(inventoryTransactionFormState);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setInventoryTransactionForm({
            ...inventoryTransactionForm,
            [name]: value,
        });
    };


    const handleSubmit = (event) => {
        event.preventDefault();

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        let url = '/inventory-single-transaction';

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
                refreshInventoryItems(window.location.pathname)
                setInventoryTransactionForm(inventoryTransactionFormState);
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
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleSubmit,
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">{inventory_item ? "UPDATE" : "ADD"} INVENTORY ITEM</DialogTitle>
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
                        <input type="hidden" name="inventory_item_id" value={inventory_item ? inventory_item.id : ""} />
                        <input type="hidden" name="transaction_type" value={'adjustment'}/>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Quantity"}
                                name="quantity"
                                placeholder="Quantity"
                                type="number"
                                value={inventoryTransactionForm.quantity}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Date"}
                                name="transaction_date"
                                placeholder="Date"
                                type="date"
                                value={inventoryTransactionForm.transaction_date}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Autocomplete
                                freeSolo
                                options={reasonOptions.map((option) => option)}
                                renderInput={(params) => <TextField {...params} label="Reason" name="reason" required />}
                                value={inventoryTransactionForm.reason}
                                onChange={(event, newValue) => {
                                    setInventoryTransactionForm({
                                        ...inventoryTransactionForm,
                                        reason: newValue,
                                    });
                                }}
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                value={inventoryTransactionForm.store_id}
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
                    {inventoryTransactionForm.quantity >= 0 && (
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ paddingY: "15px", fontSize: "1.2rem" }}
                            type="submit"
                            name="add"
                            color="success"
                            disabled={inventoryTransactionForm.quantity === 0}
                        >
                            ADD QUANTITY
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.2rem", marginLeft: "10px" }}
                        type="submit"
                        name="remove"
                        color="error"
                        disabled={inventoryTransactionForm.quantity === 0}
                        onClick={() => setInventoryTransactionForm({
                            ...inventoryTransactionForm,
                            quantity: -Math.abs(inventoryTransactionForm.quantity)
                        })}
                    >
                        DEDUCT QUANTITY
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
