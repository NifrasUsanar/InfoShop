import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, Box, TextField, Tooltip, MenuItem, Chip, IconButton } from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import Select2 from "react-select";
import numeral from "numeral";
import { DataGrid } from "@mui/x-data-grid";

import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import CustomPagination from "@/Components/CustomPagination";

const columns = () => [
    {
        field: "id",
        headerName: "ID",
        width: 80,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return "#" + params.value.toString().padStart(4, "0");
        },
    },
    {
        field: "contact_name", headerName: "Customer Name", width: 200,
        renderCell: (params) => (
            <Tooltip title={'' + params.row.balance} arrow>
                <Button>{params.value}</Button>
            </Tooltip>
        ),
    },
    { field: 'barcode', headerName: 'Barcode', width: 200, selector: row => row.barcode, sortable: true, hideable: true },
    { field: "product_name", headerName: "Product Name", width: 200, },
    {
        field: "quantity", headerName: "Quantity", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "discount", headerName: "Unit Disc.", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "unit_cost", headerName: "Unit Cost", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "unit_price", headerName: "Unit Price", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "profit", headerName: "Profit", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: 'total',
        headerName: "Total",
        width: 120,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params) => {
            const total = (params.row.unit_price - params.row.discount) * params.row.quantity;

            if (total === 0) {
                return (
                    <span className="bg-green-600 text-white px-2 py-1 rounded-md">
                        Free
                    </span>
                );
            }

            return numeral(total).format('0,0.00');
        },
    },
    // { field: 'profit_amount', headerName: 'Profit Amount', width: 120 },
    {
        field: "sale_date",
        headerName: "Date",
        width: 100,
    },
    {
        field: "action",
        headerName: "Action",
        width: 80,
        renderCell: (params) => {
            if (params.row.quantity < 0) return null;
            return (
                <Link href={`/pos/${params.row.sale_id}/return`}>
                    <IconButton color="primary">
                        <KeyboardReturnIcon />
                    </IconButton>
                </Link>
            );
        },
    },

];

export default function SoldItem({ sold_items, contacts }) {
    const [dataSoldItems, setDataSoldItems] = useState(sold_items);

    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        store: 0,
        contact_id: '',
        status: 'all',
        query: '',
        order_by: 'default',
        item_type: "all",
        per_page: 100,
    });

    const refreshSoldItems = (url = window.location.pathname) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["sold_items"], // Only reload specified properties
            onSuccess: (response) => {
                setDataSoldItems(response.props.sold_items);
            },
        };
        router.get(
            url, { ...searchTerms }, options
        );
    };

    const [initialized, setInitialized] = useState(false); //To avoid re fetch data on page load
        useEffect(() => {
            if (!initialized) {
                setInitialized(true);
                return; // Skip first run
            }
        refreshSoldItems(window.location.pathname);
    }, [searchTerms]);

    const handleSearchChange = (input) => {

        if (input?.target) {
            // Handle regular inputs (e.g., TextField)
            const { name, value } = input.target;
            setSearchTerms((prev) => ({ ...prev, [name]: value }));
        } else {
            // Handle Select2 inputs (e.g., contact selection)
            setSearchTerms((prev) => ({
                ...prev,
                contact_id: input?.id, // Store selected contact or null
            }));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Sold Items" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "end", width: "100%" }}
                size={12}
            >

                <Grid size={{ xs: 12, sm: 3 }}>
                    <Select2
                        className="w-full"
                        placeholder="Select a contact..."
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                height: "55px",
                            }),
                        }}
                        options={contacts} // Options to display in the dropdown
                        onChange={(selectedOption) => handleSearchChange(selectedOption)}
                        isClearable // Allow the user to clear the selected option
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                    ></Select2>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Start Date"
                        name="start_date"
                        placeholder="Start Date"
                        size="small"
                        fullWidth
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.start_date}
                        onChange={handleSearchChange}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="End Date"
                        name="end_date"
                        placeholder="End Date"
                        fullWidth
                        size="small"
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.end_date}
                        onChange={handleSearchChange}
                        required
                    />
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Item type"
                        name="item_type"
                        size="small"
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.item_type}
                        onChange={handleSearchChange}
                        required
                        select
                    >
                        <MenuItem value={'all'}>All</MenuItem>
                        <MenuItem value={'regular'}>Regular</MenuItem>
                        <MenuItem value={'free'}>Free</MenuItem>
                        <MenuItem value={'return'}>Return</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        label="Search"
                        name="query"
                        placeholder="Search"
                        size="small"
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.query}
                        onChange={handleSearchChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                refreshSoldItems(window.location.pathname);
                            }
                        }}
                    />
                </Grid>

                {/* <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Order By"
                        name="order_by"
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.order_by}
                        onChange={handleSearchChange}
                        required
                        select
                    >
                        <MenuItem value={'default'}>Default</MenuItem>
                        <MenuItem value={'top_sold'}>Top Sold</MenuItem>
                        <MenuItem value={'top_profit'}>Top Profit</MenuItem>
                        </TextField>
                </Grid> */}
                <Grid size={{ xs: 12, sm: 1 }}>
                    <Button fullWidth variant="contained" onClick={() => refreshSoldItems(window.location.pathname)} size="large">
                        <FindReplaceIcon />
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataGrid
                    rows={dataSoldItems.data}
                    getRowId={(row) => row.id}
                    columns={columns()}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                        },
                    }}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                barcode: false,
                                profit: false,
                            },
                        },
                    }}
                    hideFooter
                />
            </Box>
            <Grid size={12} spacing={2} container sx={{ justifyContent: "end" }}>
                <Chip size="large" label={'Total results : ' + dataSoldItems.total} color="primary" />
                <Chip size="large" label={'Total Quantity : ' + dataSoldItems.data.reduce((sum, item) => sum + item.quantity, 0)} color="primary" />

                <CustomPagination
                    refreshTable={refreshSoldItems}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataSoldItems}
                ></CustomPagination>
            </Grid>
        </AuthenticatedLayout>
    );
}
