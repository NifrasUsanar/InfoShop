import * as React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import {
    Button,
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Breadcrumbs,
    AppBar,
    Toolbar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import HomeIcon from "@mui/icons-material/Home";
import Swal from "sweetalert2";

export default function ChargeForm({
    charge,
    chargeTypes,
    rateTypes,
    pageLabel,
}) {
    const isEditMode = !!charge;
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        name: charge?.name || "",
        charge_type: charge?.charge_type || "custom",
        rate_value: charge?.rate_value || "",
        rate_type: charge?.rate_type || "fixed",
        description: charge?.description || "",
        is_active: charge?.is_active ?? true,
        is_default: charge?.is_default ?? false,
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const url = isEditMode
            ? `/charges/${charge.id}`
            : "/charges";
        const method = isEditMode ? "put" : "post";

        router[method](url, formData, {
            onSuccess: () => {
                Swal.fire({
                    title: "Success!",
                    text: isEditMode
                        ? "Charge updated successfully."
                        : "Charge created successfully.",
                    icon: "success",
                }).then(() => {
                    router.get("/charges");
                });
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
        <AuthenticatedLayout>
            <Head title={pageLabel} />

            <Box className="bg-gray-50 min-h-screen">
                {/* Toolbar */}
                <AppBar position="static" color="default" elevation={1}>
                    <Toolbar>
                        <Link href="/charges">
                            <Button
                                startIcon={<ArrowBackIosNewIcon />}
                                color="inherit"
                            >
                                Back
                            </Button>
                        </Link>
                        <Box className="flex-1" />
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </Toolbar>
                </AppBar>

                {/* Breadcrumbs */}
                <Box className="p-6 bg-white border-b">
                    <Breadcrumbs>
                        <Link href="/" className="text-blue-600">
                            <HomeIcon fontSize="small" />
                        </Link>
                        <Link href="/charges" className="text-blue-600">
                            Charges
                        </Link>
                        <span className="text-gray-500">{pageLabel}</span>
                    </Breadcrumbs>
                </Box>

                {/* Form Content */}
                <Box className="p-6">
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent className="space-y-4">
                                    <h2 className="text-xl font-semibold mb-4">
                                        {isEditMode ? "Edit Charge" : "Create New Charge"}
                                    </h2>

                                    {/* Name */}
                                    <TextField
                                        fullWidth
                                        label="Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        placeholder="e.g., VAT (5%), Service Tax, Delivery Fee"
                                        variant="outlined"
                                    />

                                    {/* Charge Type */}
                                    <TextField
                                        fullWidth
                                        select
                                        label="Charge Type"
                                        name="charge_type"
                                        value={formData.charge_type}
                                        onChange={handleInputChange}
                                        error={!!errors.charge_type}
                                        helperText={errors.charge_type}
                                        variant="outlined"
                                    >
                                        {chargeTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type.replace(/_/g, " ").toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* Rate Value */}
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Rate Value"
                                                name="rate_value"
                                                type="number"
                                                inputProps={{
                                                    step: "0.01",
                                                    min: "0",
                                                }}
                                                value={formData.rate_value}
                                                onChange={handleInputChange}
                                                error={!!errors.rate_value}
                                                helperText={errors.rate_value}
                                                placeholder="e.g., 5 or 50"
                                                variant="outlined"
                                            />
                                        </Grid>

                                        {/* Rate Type */}
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                select
                                                label="Rate Type"
                                                name="rate_type"
                                                value={formData.rate_type}
                                                onChange={handleInputChange}
                                                error={!!errors.rate_type}
                                                helperText={errors.rate_type}
                                                variant="outlined"
                                            >
                                                {rateTypes.map((type) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type === "percentage"
                                                            ? "Percentage (%)"
                                                            : "Fixed Amount"}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Grid>
                                    </Grid>

                                    {/* Description */}
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        error={!!errors.description}
                                        helperText={errors.description}
                                        placeholder="Add description for this charge..."
                                        variant="outlined"
                                    />

                                    {/* Is Active */}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                            />
                                        }
                                        label="Active"
                                    />

                                    {/* Is Default */}
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                name="is_default"
                                                checked={formData.is_default}
                                                onChange={handleInputChange}
                                            />
                                        }
                                        label="Auto-apply to all sales (Default)"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Summary Card */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <h3 className="text-lg font-semibold mb-4">
                                        Summary
                                    </h3>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-gray-600 text-sm">
                                                Charge Type
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {formData.charge_type
                                                    .replace(/_/g, " ")
                                                    .toUpperCase()}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 text-sm">
                                                Rate
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {formData.rate_value}
                                                {formData.rate_type === "percentage"
                                                    ? "%"
                                                    : ""}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 text-sm">
                                                Status
                                            </p>
                                            <p
                                                className={`text-lg font-semibold ${
                                                    formData.is_active
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {formData.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 text-sm">
                                                Default
                                            </p>
                                            <p
                                                className={`text-lg font-semibold ${
                                                    formData.is_default
                                                        ? "text-blue-600"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {formData.is_default
                                                    ? "Auto-apply"
                                                    : "Manual"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </AuthenticatedLayout>
    );
}
