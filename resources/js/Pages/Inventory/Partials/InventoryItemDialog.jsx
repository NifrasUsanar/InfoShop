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
    MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";

const initialInventoryItemFormState = {
    name: '',
    alert_quantity: 1,
    store_id: 1,
    cost:0,
    unit_type:'PC',
};

const unit_types = [
    { value: 'PC', label: 'Piece' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'Box', label: 'Box' },
    { value: 'l', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
]

export default function InventoryItemDialog({
    open,
    setOpen,
    stores,
    refreshInventoryItems,
    inventory_item,
}) {

    const [inventoryItemsForm, setInventoryItemsForm] = useState(initialInventoryItemFormState);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setInventoryItemsForm({
            ...inventoryItemsForm,
            [name]: value,
        });
    };

    useEffect(() => {
        if (inventory_item) {
            setInventoryItemsForm(inventory_item);
        } else {
            setInventoryItemsForm(initialInventoryItemFormState);
        }
    }, [inventory_item])
    

    const handleSubmit = (event) => {
        event.preventDefault();

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        let url = inventory_item ? `/inventory-items/${inventory_item.id}` : '/inventory-items';

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
                setInventoryItemsForm(initialInventoryItemFormState);
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
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Name"}
                                name="name"
                                placeholder="Name"
                                value={inventoryItemsForm.name}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>
                        {!inventory_item && (
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Quantity"}
                                    name="quantity"
                                    placeholder="Current Quantity"
                                    type="number"
                                    value={inventoryItemsForm.quantity}
                                    onChange={handleFieldChange}
                                    required
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                    }}
                                />
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: !inventory_item ? 3 : 4 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                select
                                label={"Unit Type"}
                                name="unit_type"
                                value={inventoryItemsForm.unit_type}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            >
                                {unit_types.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: !inventory_item ? 3 : 4 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Cost"}
                                name="cost"
                                placeholder="Cost"
                                type="number"
                                value={inventoryItemsForm.cost}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: !inventory_item ? 3 : 4 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Alert Quantity"}
                                name="alert_quantity"
                                placeholder="Alert Quantity"
                                type="number"
                                value={inventoryItemsForm.alert_quantity}
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
                                    value={inventoryItemsForm.store_id}
                                    label="Store"
                                    fullWidth
                                    onChange={handleFieldChange}
                                    required
                                    name="store_id"
                                    select
                                    disabled={inventory_item ? true : false}
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
                        disabled={inventoryItemsForm.amount == 0}
                    >
                        {inventory_item ? "UPDATE" : "ADD"} ITEM
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
