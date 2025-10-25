import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Box,
    Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";

const initialChargeFormState = {
    name: "",
    charge_type: "custom",
    rate_value: "",
    rate_type: "fixed",
    description: "",
    is_active: true,
    is_default: false,
};

export default function ChargeDialog({
    open,
    setOpen,
    chargeTypes,
    rateTypes,
    refreshCharges,
    chargeToEdit,
}) {
    const isEditMode = !!chargeToEdit;
    const [chargeForm, setChargeForm] = useState(initialChargeFormState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode && chargeToEdit) {
            setChargeForm({
                name: chargeToEdit.name || "",
                charge_type: chargeToEdit.charge_type || "custom",
                rate_value: chargeToEdit.rate_value || "",
                rate_type: chargeToEdit.rate_type || "fixed",
                description: chargeToEdit.description || "",
                is_active: chargeToEdit.is_active ?? true,
                is_default: chargeToEdit.is_default ?? false,
            });
        } else {
            setChargeForm(initialChargeFormState);
        }
        setErrors({});
    }, [open, chargeToEdit, isEditMode]);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value, type, checked } = event.target;
        setChargeForm({
            ...chargeForm,
            [name]: type === "checkbox" ? checked : value,
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        const url = isEditMode ? `/charges/${chargeToEdit.id}` : "/charges";
        const method = isEditMode ? "put" : "post";

        router[method](url, chargeForm, {
            onSuccess: () => {
                Swal.fire({
                    title: "Success!",
                    text: isEditMode
                        ? "Charge updated successfully."
                        : "Charge created successfully.",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                refreshCharges();
                setOpen(false);
            },
            onError: (errors) => {
                setErrors(errors);
                Swal.fire({
                    title: "Error!",
                    text: "Please check the form for errors.",
                    icon: "error",
                });
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    return (
        <Dialog
            fullWidth={true}
            maxWidth="sm"
            open={open}
            onClose={handleClose}
            PaperProps={{
                component: "form",
                onSubmit: handleSubmit,
            }}
        >
            <DialogTitle>
                {isEditMode ? "Edit Charge" : "Create New Charge"}
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
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {/* Name */}
                    <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={chargeForm.name}
                        onChange={handleFieldChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        placeholder="e.g., VAT (5%), Service Tax, Delivery Fee"
                        variant="outlined"
                        size="small"
                    />

                    {/* Charge Type */}
                    <TextField
                        fullWidth
                        select
                        label="Charge Type"
                        name="charge_type"
                        value={chargeForm.charge_type}
                        onChange={handleFieldChange}
                        error={!!errors.charge_type}
                        helperText={errors.charge_type}
                        variant="outlined"
                        size="small"
                    >
                        {chargeTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type.replace(/_/g, " ").toUpperCase()}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Rate Value */}
                    <TextField
                        fullWidth
                        label="Rate Value"
                        name="rate_value"
                        type="number"
                        inputProps={{
                            step: "0.01",
                            min: "0",
                        }}
                        value={chargeForm.rate_value}
                        onChange={handleFieldChange}
                        error={!!errors.rate_value}
                        helperText={errors.rate_value}
                        placeholder="e.g., 5 or 50"
                        variant="outlined"
                        size="small"
                    />

                    {/* Rate Type */}
                    <TextField
                        fullWidth
                        select
                        label="Rate Type"
                        name="rate_type"
                        value={chargeForm.rate_type}
                        onChange={handleFieldChange}
                        error={!!errors.rate_type}
                        helperText={errors.rate_type}
                        variant="outlined"
                        size="small"
                    >
                        {rateTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type === "percentage"
                                    ? "Percentage (%)"
                                    : "Fixed Amount"}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Description */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        value={chargeForm.description}
                        onChange={handleFieldChange}
                        error={!!errors.description}
                        helperText={errors.description}
                        placeholder="Add description for this charge..."
                        variant="outlined"
                        size="small"
                    />

                    {/* Checkboxes */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_active"
                                checked={chargeForm.is_active}
                                onChange={handleFieldChange}
                            />
                        }
                        label="Active"
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                name="is_default"
                                checked={chargeForm.is_default}
                                onChange={handleFieldChange}
                            />
                        }
                        label="Auto-apply to all sales (Default)"
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                >
                    {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
