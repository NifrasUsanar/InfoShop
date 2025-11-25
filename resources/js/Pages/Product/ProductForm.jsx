import * as React from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect, useRef } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Button,
    Box,
    Divider,
    Typography,
    MenuItem,
    RadioGroup, FormControlLabel, Radio, Select,
    IconButton
} from "@mui/material";
import TextField from "@mui/material/TextField";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Autocomplete from "@mui/material/Autocomplete";
import { Link } from "@inertiajs/react";
import HomeIcon from "@mui/icons-material/Home";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Grid from "@mui/material/Grid";
import "dayjs/locale/en-gb";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import Hotkeys from "react-hot-keys";
import Select2 from "react-select";
import imageCompression from 'browser-image-compression';

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Upload, Trash2 } from "lucide-react";
import { styled } from "@mui/material/styles";

import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import productplaceholder from "@/Pages/Product/product-placeholder.webp";
import BatchesTable from "./Partials/BatchesTable";
import CollectionSelector from "./Partials/CollectionSelector";


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

export default function Product({ product, collection, product_code, contacts, product_alert, misc_setting }) {

    const [discountType, setDiscountType] = useState("percentage");
    const [loading, setLoading] = useState(false);
    const [compressedFile, setCompressedFile] = useState(null);
    const [batches, setBatches] = useState(product?.batches || []);
    const [collections, setCollections] = useState(collection || []);

    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const brandOptions = collections
        .filter((item) => item.collection_type === "brand")
        .map(({ id, name }) => ({ id, label: name }));

    const [manageStock, setManageStock] = React.useState("1");
    const [selectedBrand, setSelectedBrand] = useState(
        brandOptions.find((option) => option.id === null) || null
    );

    const [productFormData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        barcode: product_code,
        featured_image: productplaceholder,
        unit: "PC",
        quantity: "",
        alert_quantity: product_alert,
        is_stock_managed: 1,
        is_active: 1,
        brand_id: "",
        product_type: "simple",
        fixed_commission: 0,
        batch_number: dayjs().format('DDMMYYYY'),
        discount: 0,
        discount_percentage: 0,
        price: '',
        delete_image: 0,
        collection_ids: [],
    });

    // Collection multi-select state - separate for categories and tags
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        const updatedForm = {
            ...productFormData,
            [name]: type === "checkbox" ? checked : value,
        };

        if (name === "discount_percentage") {
            updatedForm.discount = "0";
            updatedForm.discount_percentage = value;
        } else if (name === "discount") {
            updatedForm.discount_percentage = "0";
        }

        setFormData(updatedForm);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file && file.size > MAX_FILE_SIZE) {
            alert('File size exceeds the 2MB limit.');
            return;
        }
        if (file) {
            try {
                const options = {
                    maxSizeMB: (misc_setting && misc_setting.optimize_image_size) || 0.5,
                    maxWidthOrHeight: (misc_setting && misc_setting.optimize_image_width) || 720,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                setCompressedFile(compressedFile);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData({
                        ...productFormData,
                        featured_image: reader.result,
                        delete_image: 0,
                    });
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing the image:', error);
            }
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description || "",
                sku: product.sku || "",
                barcode: product.barcode || "",
                featured_image: product.image_url ? product.image_url : productplaceholder,
                unit: product.unit || "PC",
                alert_quantity: product.alert_quantity || 0,
                is_stock_managed: product.is_stock_managed || false,
                is_active: product.is_active || false,
                brand_id: product.brand_id || "",
                category_id: product.category_id || "",
                product_type: product.product_type || "simple",
                fixed_commission: product.fixed_commission || 0,
            });
            setManageStock(product.is_stock_managed.toString());

            setSelectedBrand(
                brandOptions.find((option) => option.id === product.brand_id)
            );

            // Set selected collections - split by type
            if (product.collection_ids && Array.isArray(product.collection_ids)) {
                const productCollections = collection
                    .filter(col => product.collection_ids.includes(col.id))
                    .map(col => ({ id: col.id, label: col.name, collection_type: col.collection_type }));

                // Separate categories and tags
                const categories = productCollections.filter(col => col.collection_type === 'category');
                const tags = productCollections.filter(col => col.collection_type === 'tag');

                setSelectedCategories(categories);
                setSelectedTags(tags);
            }
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

    const handleBatchesChange = () => {
        // Callback when batch is updated - just keep modal closed
        // BatchModal updates the local state in BatchesTable
        // No page reload or redirect needed
    };

    // Callback when a new collection is created inline
    const handleCollectionCreated = (newCollection) => {
        // Add the new collection to the collections state
        setCollections(prev => [...prev, newCollection]);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        const submittedFormData = new FormData(event.currentTarget);

        if (compressedFile) {
            submittedFormData.append('featured_image', compressedFile);
        }

        const formJson = Object.fromEntries(submittedFormData.entries());
        formJson.brand_id = selectedBrand?.id ?? "";
        formJson.delete_image = productFormData.delete_image;

        // Add selected collection IDs (combine categories and tags)
        const allSelectedCollections = [...selectedCategories, ...selectedTags];
        if (allSelectedCollections.length > 0) {
            allSelectedCollections.forEach((collection, index) => {
                formJson[`collection_ids[${index}]`] = collection.id;
            });
        }

        const endpoint = product ? `/products/${product.id}` : "/products";

        router.post(endpoint, formJson, {
            forceFormData: true,
            onSuccess: (resp) => {
                Swal.fire({
                    title: "Success!",
                    text: "Successfully saved",
                    icon: "success",
                    position: "bottom-end",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    toast: true,
                });
                setLoading(false);
            },
            onError: (errors) => {
                const errorMessages = Object.values(errors).flat().join(" | ");
                Swal.fire({
                    title: "Error!",
                    text: errorMessages || "An unexpected error occurred.",
                    icon: "error",
                    confirmButtonText: "OK",
                });
                setLoading(false);
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Hotkeys
                keyName="Control+s"
                onKeyDown={(keyName, e) => {
                    e.preventDefault();
                    if (keyName === "Control+s") {
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
                    <div className="max-w-5xl mx-auto pb-24">
                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: General Info & Stock */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* General Information Section */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900">General Information</h3>
                                    </div>
                                    <div className="px-6 py-5">
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <TextField
                                                    size="small"
                                                    label="Barcode"
                                                    id="barcode"
                                                    name="barcode"
                                                    fullWidth
                                                    required
                                                    value={productFormData.barcode}
                                                    onChange={handleChange}
                                                    autoFocus
                                                    ref={refBarcode}
                                                    onFocus={(event) => {
                                                        event.target.select();
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                <TextField
                                                    size="small"
                                                    label="Product Name"
                                                    name="name"
                                                    fullWidth
                                                    required
                                                    value={productFormData.name}
                                                    onChange={handleChange}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <TextField
                                                    size="small"
                                                    value={productFormData.unit}
                                                    label="Product Unit"
                                                    onChange={handleChange}
                                                    name="unit"
                                                    select
                                                    fullWidth
                                                >
                                                    <MenuItem value={"PC"}>PC</MenuItem>
                                                    <MenuItem value={"KG"}>KG</MenuItem>
                                                    <MenuItem value={"Meter"}>Meter</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <TextField
                                                    size="small"
                                                    label="Product Type"
                                                    name="product_type"
                                                    select
                                                    fullWidth
                                                    onChange={handleChange}
                                                    value={productFormData.product_type}
                                                    required
                                                >
                                                    <MenuItem value={"simple"}>SIMPLE</MenuItem>
                                                    <MenuItem value={"reload"}>RELOAD</MenuItem>
                                                    <MenuItem value={"commission"}>COMMISSION</MenuItem>
                                                    <MenuItem value={"custom"}>CUSTOM</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <TextField
                                                    size="small"
                                                    label="Alert Quantity"
                                                    id="alert-quantity"
                                                    name="alert_quantity"
                                                    type="number"
                                                    fullWidth
                                                    onChange={handleChange}
                                                    value={productFormData.alert_quantity}
                                                />
                                            </Grid>

                                            {(productFormData.product_type === 'reload' || productFormData.product_type === 'commission') && (
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label={productFormData.product_type === 'reload' ? 'Commission (%)' : 'Fixed Commission'}
                                                        name="fixed_commission"
                                                        type="number"
                                                        fullWidth
                                                        required
                                                        onChange={handleChange}
                                                        value={productFormData.fixed_commission}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    </div>
                                </div>

                                {/* Stock Section */}
                                {!product && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900">Stock</h3>
                                        </div>
                                        <div className="px-6 py-5">
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Cost"
                                                        name="cost"
                                                        type="number"
                                                        fullWidth
                                                        required
                                                        step={0.5}
                                                        value={productFormData.cost}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Price"
                                                        name="price"
                                                        type="number"
                                                        fullWidth
                                                        required
                                                        value={productFormData.price}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Quantity"
                                                        name="quantity"
                                                        type="number"
                                                        fullWidth
                                                        required
                                                        step={0.5}
                                                        value={productFormData.quantity}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Discount %"
                                                        name="discount_percentage"
                                                        type="number"
                                                        fullWidth
                                                        value={productFormData.discount_percentage}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Flat Discount"
                                                        name="discount"
                                                        type="number"
                                                        fullWidth
                                                        value={productFormData.discount}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <TextField
                                                        size="small"
                                                        label="Batch #"
                                                        name="batch_number"
                                                        fullWidth
                                                        value={productFormData.batch_number}
                                                        onChange={handleChange}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12 }}>
                                                    <LocalizationProvider
                                                        dateAdapter={AdapterDayjs}
                                                        adapterLocale="en-gb"
                                                    >
                                                        <DatePicker
                                                            name="expiry_date"
                                                            label="Expiry Date"
                                                            className="w-full"
                                                            format="YYYY-MM-DD"
                                                            slotProps={{
                                                                textField: {
                                                                    size: 'small'
                                                                }
                                                            }}
                                                        />
                                                    </LocalizationProvider>
                                                </Grid>
                                            </Grid>
                                        </div>
                                    </div>
                                )}

                                {/* Batches Table */}
                                {product && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-gray-900">Batches</h3>
                                            <Box onClick={() => document.querySelector('[data-batch-modal-trigger]')?.click()}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                >
                                                    Add Batch
                                                </Button>
                                            </Box>
                                        </div>
                                        <div className="p-4">
                                            <BatchesTable product={product} batches={batches} contacts={contacts} onBatchesChange={handleBatchesChange} />
                                        </div>
                                    </div>
                                )}

                                {/* Product Description */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900">Description</h3>
                                    </div>
                                    <div className="px-6 py-5">
                                        <TextField
                                            size="small"
                                            label="Product Description"
                                            id="product-description"
                                            name="description"
                                            fullWidth
                                            multiline
                                            rows={4}
                                            value={productFormData.description}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: More Information */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-4">
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                        {/* Manage Stock Toggle - Always Visible */}
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <ToggleButtonGroup
                                                color="primary"
                                                value={manageStock}
                                                exclusive
                                                onChange={handleStockChange}
                                                aria-label="Manage stock"
                                                id="btn-manage-stock"
                                                variant="contained"
                                                fullWidth
                                                size="small"
                                            >
                                                <ToggleButton
                                                    value="1"
                                                    sx={{
                                                        color: "black",
                                                        "&.Mui-selected": {
                                                            bgcolor: "success.dark",
                                                            color: "white",
                                                            "&:hover": {
                                                                bgcolor: "success.dark",
                                                            },
                                                        },
                                                    }}
                                                    variant="contained"
                                                >
                                                    Manage Stock
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </div>

                                        {/* Product Image */}
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <CardMedia
                                                sx={{ height: { xs: 200, sm: 240 } }}
                                                image={
                                                    productFormData.featured_image ??
                                                    productplaceholder
                                                }
                                            />
                                            <CardActions className="p-3 flex gap-2">
                                                <Button
                                                    component="label"
                                                    role={undefined}
                                                    variant="contained"
                                                    size="small"
                                                    tabIndex={-1}
                                                    startIcon={<Upload size={18} />}
                                                    fullWidth
                                                    sx={{ textTransform: 'none', fontWeight: 500 }}
                                                >
                                                    Upload
                                                    <VisuallyHiddenInput
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        name="featured_image"
                                                    />
                                                </Button>
                                                {productFormData.featured_image && productFormData.featured_image !== productplaceholder && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            // Clear the featured image display
                                                            setFormData({
                                                                ...productFormData,
                                                                featured_image: productplaceholder,
                                                                delete_image: 1,
                                                            });
                                                            // Clear the file input
                                                            const fileInput = document.querySelector('input[name="featured_image"]');
                                                            if (fileInput) {
                                                                fileInput.value = '';
                                                            }
                                                            setCompressedFile(null);
                                                        }}
                                                        sx={{
                                                            bgcolor: 'error.main',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: 'error.dark',
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </IconButton>
                                                )}
                                            </CardActions>
                                        </div>

                                        {/* More Information */}
                                        <div className="px-6 py-4 border-b border-gray-100">
                                            <h3 className="text-lg font-bold text-gray-900">More Information</h3>
                                        </div>
                                        <div className="px-6 py-5 space-y-4">
                                            {!product && (
                                                <Select2
                                                    className="w-full"
                                                    placeholder="Select a supplier..."
                                                    name="contact_id"
                                                    styles={{
                                                        control: (baseStyles, state) => ({
                                                            ...baseStyles,
                                                            height: "40px",
                                                        }),
                                                    }}
                                                    options={contacts}
                                                    isClearable
                                                    getOptionLabel={(option) => option.name}
                                                    getOptionValue={(option) => option.id}
                                                />
                                            )}
                                            <Autocomplete
                                                size="small"
                                                disablePortal
                                                value={selectedBrand || null}
                                                onChange={(event, newValue) => {
                                                    setSelectedBrand(newValue);
                                                }}
                                                getOptionLabel={(options) => options.label}
                                                options={brandOptions}
                                                fullWidth
                                                id="brand"
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Brand"
                                                        size="small"
                                                    />
                                                )}
                                            />
                                            {/* Categories Multi-Select */}
                                            <CollectionSelector
                                                collections={collections}
                                                selectedCollections={selectedCategories}
                                                onCollectionChange={setSelectedCategories}
                                                onCollectionCreated={handleCollectionCreated}
                                                collectionType="category"
                                                label="Categories"
                                                placeholder="Select categories..."
                                            />

                                            {/* Tags Multi-Select */}
                                            <CollectionSelector
                                                collections={collections}
                                                selectedCollections={selectedTags}
                                                onCollectionChange={setSelectedTags}
                                                onCollectionCreated={handleCollectionCreated}
                                                collectionType="tag"
                                                label="Tags"
                                                placeholder="Select tags..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Bottom Action Bar */}
                    <AppBar
                        position="fixed"
                        variant="contained"
                        sx={{ top: "auto", bottom: 0 }}
                    >
                        <Toolbar>
                            <Grid container justifyContent="flex-end" size={12} width={"100%"} spacing={2}>
                                <Grid size={{ xs: 6, sm: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="warning"
                                        size="large"
                                        startIcon={<ArrowBackIosNewIcon />}
                                        sx={{ mr: "1rem" }}
                                        onClick={() => window.history.back()}
                                    >
                                        BACK
                                    </Button>
                                </Grid>
                                <Grid size={{ xs: 6, sm: 2 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        type="submit"
                                        color="success"
                                        size="large"
                                        endIcon={<SaveIcon />}
                                        disabled={loading}
                                    >
                                        SAVE
                                    </Button>
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                </form>
            </Hotkeys>
        </AuthenticatedLayout>
    );
}
