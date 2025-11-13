import * as React from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { DataGrid } from "@mui/x-data-grid";
import {
    Button,
    Box,
    Grid,
    MenuItem,
    TextField,
    Chip,
    CircularProgress,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { Link, router } from "@inertiajs/react";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import HistoryIcon from '@mui/icons-material/History';
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { Barcode } from 'lucide-react';
import BatchModal from "./Partials/BatchModal";
import QuantityModal from "./Partials/QuantityModal";
import CustomPagination from "@/Components/CustomPagination";
import { useState } from "react";
import numeral from "numeral";
import { useEffect } from "react";
import Select2 from "react-select";
import axios from "axios";
import Swal from "sweetalert2";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ProductsList from "./Partials/ProductsList";

const productColumns = (handleProductEdit, onToggleFeatured, loadingBatchId) => [
    {
        field: "image_url",
        headerName: "Image",
        width: 100,
        renderCell: (params) =>
            params.value ? ( // Check if params.value is not null
                <img
                    src={params.value} // Use the value from the image_url field
                    style={{
                        width: "75px",
                        height: "51px",
                        objectFit: "cover",
                        padding: "5px",
                        paddingBottom: "5px",
                        paddingLeft: "0",
                    }} // Adjust the size as needed
                    alt="Product Image" // Alt text for accessibility
                    loading="lazy" // Lazy load the image
                />
            ) : (
                <span
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        padding: "5px",
                        paddingBottom: "5px",
                        paddingLeft: "0",
                    }}
                    className="text-center"
                >
                    No Image
                </span> // Render fallback if no image URL
            ),
    },
    {
        field: "name",
        headerName: "Product Name",
        width: 200,
        renderCell: (params) => (
            <Link
                underline="hover"
                className="hover:underline"
                href={"/products/" + params.row.id + "/edit"}
            >
                <p className="font-bold">{params.value}</p>
            </Link>
        ),
    },
    {
        field: "contact_name",
        headerName: "Supplier",
        width: 100,
    },
    { field: "barcode", headerName: "Barcode", width: 170 },
    {
        field: "batch_number",
        headerName: "Batch",
        width: 120,
        renderCell: (params) => (
            <Button
                onClick={() => handleProductEdit(params.row, "batch")}
                variant="text"
                fullWidth
                sx={{
                    textAlign: "left",
                    fontWeight: "bold",
                    justifyContent: "flex-start",
                }}
            >
                {params.value}
            </Button>
        ),
    },
    {
        field: "cost",
        headerName: "Cost",
        width: 100,
        align: "right",
        headerAlign: "right",
    },
    {
        field: "price",
        headerName: "Price",
        width: 100,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
            return numeral(params.value).format("0,0.00");
        },
    },
    {
        field: "valuation",
        headerName: "Valuation",
        width: 100,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => {
            const price = params.row.cost;
            const quantity = params.row.quantity;
            return numeral(price * quantity).format("0,0.00");
        },
    },
    {
        field: "quantity",
        headerName: "Qty",
        width: 90,
        align: "right",
        headerAlign: "right",
        valueGetter: (value) => parseFloat(value),
        renderCell: (params) => (
            <Button
                variant="text"
                color="default"
                fullWidth
                sx={{
                    textAlign: "right",
                    fontWeight: "bold",
                    justifyContent: "flex-end",
                }}
                underline="hover"
                onClick={() => handleProductEdit(params.row, "qty")}
            >
                {numeral(params.value).format("0,0.00")}
            </Button>
        ),
    },

    {
        field: "action",
        headerName: "Action",
        align: "center",
        headerAlign: "center",
        width: 200,
        renderCell: (params) => {
            return (
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "nowrap",
                    }}
                >
                    <Link href={`/product/${params.row.batch_id}/barcode`}>
                        <QrCode2Icon color="primary" />
                    </Link>
                    <Link href={`/product/${params.row.batch_id}/barcode-v2`}>
                        <Barcode size={24} stroke="#1976d2" />
                    </Link>
                    <Link href={`/quantity/${params.row.stock_id}/log`}>
                        <HistoryIcon color="primary" />
                    </Link>
                </Box>
            );
        },
    },
    {
        field: "is_featured",
        headerName: "Featured",
        headerAlign: "center",
        renderCell: (params) => {
            const isLoading = loadingBatchId === params.row.batch_id;
            return (
                <IconButton
                    size="small"
                    disabled={isLoading}
                    onClick={() => !isLoading && onToggleFeatured(params.row.batch_id, params.value === 1)}
                >
                    {isLoading ? (
                        <CircularProgress size={24} />
                    ) : params.value === 1 ? (
                        <StarIcon color="primary" />
                    ) : (
                        <StarBorderIcon color="primary" />
                    )}
                </IconButton>
            );
        },
    },
];

export default function Product({ products, stores, contacts }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const auth = usePage().props.auth.user;
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [quantityModalOpen, setQuantityModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedProductObj, setSelectedProductObj] = useState(null);
    const [dataProducts, setDataProducts] = useState(products);
    const [dataContacts, setContacts] = useState(contacts);
    const [totalValuation, setTotalValuation] = useState(0);
    const [loadingBatchId, setLoadingBatchId] = useState(null);

    const [filterOpen, setFilterOpen] = useState(false);

    const [filters, setFilters] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            store: 0,
            status: urlParams.get("status") || 1,
            search_query: "",
            alert_quantity: "",
            per_page: 100,
            contact_id: "",
        };
    });

    const handleProductEdit = (batchRow, type) => {
        if (type === "batch") {
            // Find the parent product object from the flattened batch row
            const parentProduct = dataProducts.data.find(p => p.id === batchRow.id);
            setSelectedBatch(batchRow);
            setSelectedProductObj(parentProduct);
            setBatchModalOpen(true);
        } else if (type === "qty") {
            setSelectedBatch(batchRow);
            setQuantityModalOpen(true);
        }
    };

    const onToggleFeatured = async (batchId, currentIsFeatured) => {
        setLoadingBatchId(batchId);
        try {
            const response = await axios.post(`/productbatch/${batchId}/toggle-featured`);

            if (response.data.success) {
                setDataProducts((prevData) => ({
                    ...prevData,
                    data: prevData.data.map((product) =>
                        product.batch_id === batchId
                            ? { ...product, is_featured: response.data.is_featured ? 1 : 0 }
                            : product
                    ),
                }));

                Swal.fire({
                    icon: 'success',
                    title: response.data.message,
                    position: 'bottom',
                    toast: true,
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: error.response?.data?.message || 'Failed to toggle featured status',
                position: 'bottom',
                toast: true,
                timer: 1500,
                showConfirmButton: false,
            });
        } finally {
            setLoadingBatchId(null);
        }
    };

    const refreshProducts = (urlOrBatch = window.location.pathname) => {
        // Handle both URL string and batch object parameters
        // If a batch object is passed (from BatchModal), use default URL
        const url = typeof urlOrBatch === 'string' ? urlOrBatch : window.location.pathname;

        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["products"], // Only reload specified properties
            onSuccess: (response) => {
                setDataProducts(response.props.products);
            },
        };
        router.get(url, { ...filters }, options);
    };

    const handleFilterChange = (input) => {
        if (input?.target) {
            // Handle regular inputs (e.g., TextField)
            const { name, value } = input.target;
            setFilters((prev) => ({ ...prev, [name]: value }));
        } else {
            // Handle Select2 inputs (e.g., contact selection)
            setFilters((prev) => ({
                ...prev,
                contact_id: input?.id, // Store selected contact or null
            }));
        }
    };

    useEffect(() => {
        const total = Object.values(dataProducts.data).reduce(
            (total, product) => {
                return total + product.cost * product.quantity;
            },
            0
        );
        setTotalValuation(total);
    }, [dataProducts]);

    const [initialized, setInitialized] = useState(false); //To avoid re fetch data on page load
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return; // Skip first run
        }
        refreshProducts(window.location.pathname);
    }, [filters]);

    return (
        <AuthenticatedLayout>
            <Head title="Products" />
            <Grid
                container
                spacing={1}
                alignItems="center"
            >
                <Grid
                    size={12}
                    spacing={1}
                    container
                    alignItems={"center"}
                    justifyContent={{ xs: "center", sm: "end" }}
                >
                    <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                        <TextField
                            value={filters.store}
                            label="Store"
                            onChange={handleFilterChange}
                            required
                            name="store"
                            select
                            fullWidth
                            margin="dense"
                            size="small"
                        >
                            <MenuItem value={0}>All</MenuItem>
                            {stores.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    {store.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <Select2
                            fullWidth
                            placeholder="Select a supplier..."
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    height: "40px",
                                }),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                            options={contacts} // Options to display in the dropdown
                            onChange={(selectedOption) =>
                                handleFilterChange(selectedOption)
                            }
                            isClearable // Allow the user to clear the selected option
                            getOptionLabel={(option) =>
                                option.name + " | " + option.balance
                            }
                            getOptionValue={(option) => option.id}
                            menuPortalTarget={document.body}
                        ></Select2>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                            value={filters.status}
                            label="Status"
                            size="small"
                            onChange={handleFilterChange}
                            required
                            name="status"
                            fullWidth
                            select
                            margin="dense"
                        >
                            <MenuItem value={1}>Active</MenuItem>
                            <MenuItem value={0}>Inactive</MenuItem>
                            <MenuItem value={"alert"}>Alert</MenuItem>
                            <MenuItem value={"out_of_stock"}>
                                Out of Stock
                            </MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 2, md: 2 }}>
                        <TextField
                            value={filters.alert_quantity}
                            label="Alert Qty"
                            size="small"
                            onChange={handleFilterChange}
                            placeholder="Alert Qty"
                            name="alert_quantity"
                            type="number"
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3, md: 3 }}>
                        <TextField
                            fullWidth
                            name="search_query"
                            label="Search"
                            size="small"
                            variant="outlined"
                            value={filters.search_query}
                            onChange={handleFilterChange}
                            placeholder="Barcode or Name"
                            onFocus={(event) => {
                                event.target.select();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault(); // Prevents form submission if inside a form
                                    refreshProducts(window.location.pathname); // Trigger search on Enter
                                }
                            }}
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 9, sm: 3, md: 2 }}>
                        <Link href="/products/create">
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<AddIcon />}
                                fullWidth
                                sx={{ minWidth: { xs: '100px', sm: '100px' } }}
                            >
                                Add Product
                            </Button>
                        </Link>
                    </Grid>
                </Grid>

                {!isMobile && (
                    <Box
                        className="py-2 w-full"
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            height: "calc(100vh - 290px)",
                        }}
                    >
                        <DataGrid
                            rows={dataProducts.data}
                            columns={productColumns(handleProductEdit, onToggleFeatured, loadingBatchId)}
                            getRowId={(row) =>
                                row.id + row.batch_number + row.store_id
                            }
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                },
                            }}
                            initialState={{
                                columns: {
                                    columnVisibilityModel: {
                                        cost: false,
                                        created_at: false,
                                    },
                                },
                            }}
                            showToolbar
                            hideFooter={true}
                        />
                    </Box>
                )}
                {isMobile && (
                    <ProductsList products={dataProducts.data} handleProductEdit={handleProductEdit} />
                )}
                <Grid
                    size={12}
                    spacing={2}
                    container
                    justifyContent={"end"}
                    alignItems={"center"}
                >
                    <Chip
                        size="large"
                        label={"Total results : " + dataProducts.total}
                        color="primary"
                    />
                    <Chip
                        size="large"
                        label={
                            "Total valuation : " +
                            numeral(totalValuation).format("0,00.00")
                        }
                        color="primary"
                    />

                    <CustomPagination
                        refreshTable={refreshProducts}
                        setSearchTerms={setFilters}
                        searchTerms={filters}
                        data={dataProducts}
                    ></CustomPagination>
                </Grid>
            </Grid>
            <BatchModal
                batchModalOpen={batchModalOpen}
                setBatchModalOpen={setBatchModalOpen}
                selectedBatch={selectedBatch}
                selectedProduct={selectedProductObj}
                contacts={dataContacts}
                refreshProducts={refreshProducts}
                initialIsNew={!selectedBatch}
            />
            <QuantityModal
                modalOpen={quantityModalOpen}
                setModalOpen={setQuantityModalOpen}
                selectedStock={selectedBatch}
                products={dataProducts.data}
                setProducts={setDataProducts}
                refreshProducts={refreshProducts}
                stores={stores}
            />
        </AuthenticatedLayout>
    );
}
