import * as React from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import { Button, Box, Divider, Typography, Select, MenuItem , InputLabel, FormControl} from "@mui/material";
import TextField from "@mui/material/TextField";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Autocomplete from "@mui/material/Autocomplete";
import { Link } from "@inertiajs/react";
import HomeIcon from "@mui/icons-material/Home";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Grid from "@mui/material/Grid2";
import "dayjs/locale/en-gb";
import Swal from "sweetalert2";
import Hotkeys from "react-hot-keys";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import SaveIcon from "@mui/icons-material/Save";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { styled } from "@mui/material/styles";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import productplaceholder from "@/Pages/Product/product-placeholder.webp";

const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
});

export default function Product({ product, collection }) {
    // Filter and map the collection
    const brandOptions = collection
        .filter((item) => item.collection_type === "brand")
        .map(({ id, name }) => ({ id, label: name }));

    // Filter and map the collection
    const categoryOptions = collection
        .filter((item) => item.collection_type === "category")
        .map(({ id, name }) => ({ id, label: name }));

    const [manageStock, setManageStock] = React.useState("1");
    const [selectedBrand, setSelectedBrand] = useState(
        brandOptions.find((option) => option.id === null) || null
    );
    const [selectedCategory, setSelectedCategory] = useState(
        categoryOptions.find((option) => option.id === null) || null
    );

    const [productFormData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        barcode: "",
        featured_image: productplaceholder, // For file input
        unit: "PC",
        quantity: "",
        alert_quantity: 5,
        is_stock_managed: 1,
        is_active: 1,
        brand_id: "",
        category_id: "",
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...productFormData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...productFormData,
                    featured_image: reader.result,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || "",
                sku: product.sku || "",
                barcode: product.barcode || "",
                featured_image: product.image_url
                    ? product.image_url
                    : productplaceholder, // Reset file input on edit
                unit: product.unit || "PC",
                alert_quantity: product.alert_quantity || 0,
                is_stock_managed: product.is_stock_managed || false,
                is_active: product.is_active || false,
                brand_id: product.brand_id || "",
                category_id: product.category_id || "",
            });
            setManageStock(product.is_stock_managed.toString());

            setSelectedBrand(
                brandOptions.find((option) => option.id === product.brand_id)
            );
            setSelectedCategory(
                categoryOptions.find(
                    (option) => option.id === product.category_id
                )
            );
        }
    }, [product]);

    const refBarcode = useRef(null);

    useEffect(() => {
        refBarcode.current.focus();
    }, []);

    const handleStockChange = (event, newStatus) => {
        if (!newStatus) setManageStock("0");
        else setManageStock("1");
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(submittedFormData.entries());
        formJson.brand_id = selectedBrand?.id ?? "";
        formJson.category_id = selectedCategory?.id ?? "";

        // Determine the endpoint based on whether we are editing or adding
        const endpoint = product ? `/products/${product.id}` : "/products";

        router.post(endpoint, formJson, {
            forceFormData: true,
            onSuccess: (resp) => {
                Swal.fire({
                    title: "Success!",
                    text: "Successfully saved",
                    icon: "success",
                    position: 'bottom-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    toast: true,
                });
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat().join(' | ');
            Swal.fire({
                title: 'Error!',
                text: errorMessages || 'An unexpected error occurred.',
                icon: 'error',
                confirmButtonText: 'OK',
              });
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Hotkeys
     keyName="Control+s" // Listening for Shift+A and Ctrl+S
     onKeyDown={(keyName, e) => {
       e.preventDefault(); // Prevent default browser action for Ctrl+S
        if (keyName === "Control+s") {
         // Trigger the form submit by programmatically calling handleSubmit
         document.getElementById("product-form").requestSubmit();
       }
     }}
    >
            <Head title="Products" />
            <form
                id="product-form"
                encType="multipart/form-data"
                onSubmit={handleSubmit}
            >
                <input
                    name="is_stock_managed"
                    type="hidden"
                    value={manageStock}
                />
                <Box className="mb-10">
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link
                            underline="hover"
                            sx={{ display: "flex", alignItems: "center" }}
                            color="inherit"
                            href="/"
                        >
                            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                            Home
                        </Link>
                        <Link
                            underline="hover"
                            color="inherit"
                            href="/products"
                        >
                            Products
                        </Link>
                        <Typography sx={{ color: "text.primary" }}>
                            {product ? "Edit Product" : "Add Product"}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <Grid container spacing={2}>
                    <Grid size={{xs:6, sm:3}}>
                        <TextField
                                label="Barcode"
                                id="barcode"
                                name="barcode"
                                fullWidth
                                required
                                value={productFormData.barcode}
                                onChange={handleChange}
                                autoFocus
                                ref={refBarcode}
                            />
                    </Grid>
                    <Grid size={{xs:6, sm:3}}>
                    <TextField
                            label="SKU"
                            id="sku"
                            name="sku"
                            value={productFormData.sku}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{xs:12, sm:4}}>
                    <TextField
                            label="Product Name"
                            id="product-name"
                            name="name"
                            fullWidth
                            required
                            value={productFormData.name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{xs:12, sm:2}}>
                    <FormControl
                            fullWidth
                            style={{ marginTop: "0", marginBottom: "0" }}
                            margin="dense"
                        >
                            <InputLabel id="product-unit-label">
                                Product Unit
                            </InputLabel>
                            <Select
                                labelId="product-unit-label"
                                id="product_unit"
                                value={productFormData.unit}
                                label="Product Unit"
                                onChange={handleChange}
                                name="unit"
                            >
                                <MenuItem value={"PC"}>PC</MenuItem>
                                <MenuItem value={"KG"}>KG</MenuItem>
                                <MenuItem value={"Meter"}>Meter</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Box className="sm:columns-1 md:columns-2 mb-4">
                   
                    <div>
                        
                    </div>
                </Box>

                <Divider></Divider>
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h5" color="initial">
                        Stock
                    </Typography>
                </Box>
                {!product && (
                    <Box className="sm:columns-1 md:columns-5 xs:columns-2 mb-3 mt-4">
                        {/* Cost */}
                        <div className="mb-3">
                            <TextField
                                label="Cost"
                                id="cost"
                                name="cost"
                                type="number"
                                fullWidth
                                required
                                step={0.5}
                                slotProps={{
                                    input: {
                                        step: 0.5,
                                    },
                                }}
                                value={productFormData.cost}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                        <TextField
                                label="Price"
                                id="price"
                                name="price"
                                type="number"
                                fullWidth
                                required
                                slotProps={{
                                    input: {
                                        min: 0,
                                    },
                                }}
                                value={productFormData.price}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Quantity */}
                        <div className="mb-3">
                            <TextField
                                label="Quantity"
                                id="quantity"
                                name="quantity"
                                type="number"
                                fullWidth
                                required
                                step={0.5}
                                slotProps={{
                                    input: {
                                        // startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                        step: 0.5,
                                    },
                                }}
                                value={productFormData.quantity}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="mb-3">
                            <TextField
                                label="Batch number"
                                id="batch-number"
                                name="batch_number"
                                fullWidth
                            />
                        </div>

                        <div className="mb-3">
                            <LocalizationProvider
                                dateAdapter={AdapterDayjs}
                                adapterLocale="en-gb"
                            >
                                <DatePicker
                                    name="expiry_date"
                                    label="Expiry Date"
                                    className="w-full"
                                />
                            </LocalizationProvider>
                        </div>
                    </Box>
                )}

                <Box className="sm:columns-1 md:columns-5 mb-4 mt-2">
                    <div className="mb-3">
                        <ToggleButtonGroup
                            color="primary"
                            value={manageStock}
                            exclusive
                            onChange={handleStockChange}
                            aria-label="Manage stock"
                            className="h-full"
                            id="btn-manage-stock"
                            variant="contained"
                            fullWidth
                        >
                            <ToggleButton
                                value="1"
                                sx={{ p: "15px",
                                    color:'black',
      '&.Mui-selected': {
        bgcolor: 'success.dark', // Background color when active
        color: 'white', // Text color when active
        '&:hover': {
          bgcolor: 'success.dark', // Darker shade on hover when active
        },}
                                }}
                                variant="contained"
                                
                            >
                                Manage Stock
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>

                    <div className="mb-3">
                        <TextField
                            label="Alert Quantity"
                            id="alert-quantity"
                            name="alert_quantity"
                            type="number"
                            fullWidth
                            onChange={handleChange}
                            value={productFormData.alert_quantity}
                        />
                    </div>
                </Box>

                <Divider></Divider>
                <Typography variant="h5" sx={{ mt: 2 }} color="initial">
                    More Information
                </Typography>

                <Box sx={{ flexGrow: 1 }} className="pb-16 mt-4">
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <div className="mb-3">
                                <Autocomplete
                                    disablePortal
                                    // defaultValue={brandOptions.find(option => option.id === null)}
                                    value={selectedBrand || null}
                                    onChange={(event, newValue) => {
                                        setSelectedBrand(newValue);
                                    }}
                                    getOptionLabel={(options) => options.label}
                                    options={brandOptions}
                                    fullWidth
                                    id="brand"
                                    renderInput={(params) => (
                                        <TextField {...params} label="Brand" />
                                    )}
                                />
                            </div>
                            <div className="mb-3">
                                <Autocomplete
                                    disablePortal
                                    value={selectedCategory || null}
                                    onChange={(event, newValue) => {
                                        setSelectedCategory(newValue);
                                    }}
                                    options={categoryOptions}
                                    getOptionLabel={(options) => options.label}
                                    fullWidth
                                    id="category"
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Category"
                                        />
                                    )}
                                />
                            </div>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            {/* Product Description */}
                            <div className="mb-3">
                                <TextField
                                    label="Product Description"
                                    id="product-description"
                                    name="description"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={productFormData.description}
                                    onChange={handleChange}
                                />
                            </div>
                        </Grid>

                        <Grid
                            size={{ xs: 12, md: 12 }}
                            className="flex justify-center"
                        >
                            <Card sx={{ width: { xs: "100%", sm: 350 } }}>
                                <CardMedia
                                    sx={{ height: 300 }}
                                    image={productFormData.featured_image??productplaceholder}
                                />

                                <CardActions className="mt-0">
                                    {/* <Box sx={{ flexGrow: 1 }} /> */}
                                    <Button
                                        component="label"
                                        role={undefined}
                                        variant="contained"
                                        tabIndex={-1}
                                        startIcon={<CloudUploadIcon />}
                                        fullWidth
                                    >
                                        Upload image
                                        <VisuallyHiddenInput
                                            type="file"
                                            onChange={handleFileChange}
                                            name="featured_image"
                                        />
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>

                <AppBar
                    position="fixed"
                    variant="contained"
                    sx={{ top: "auto", bottom: 0 }}
                >
                    <Toolbar>
                        
                        <Box sx={{ flexGrow: 1 }} />

                            <Button
                            variant="contained"
                            color="warning"
                            size="large"
                            startIcon={<ArrowBackIosNewIcon />}
                            sx={{mr:'1rem'}}
                            onClick={() => window.history.back()}
                        >
                            BACK
                        </Button>
                        
                        <Button
                            variant="contained"
                            type="submit"
                            color="success"
                            size="large"
                            endIcon={<SaveIcon />}
                        >
                            SAVE
                        </Button>
                    </Toolbar>
                </AppBar>
            </form>
            </Hotkeys>
        </AuthenticatedLayout>
    );
}
