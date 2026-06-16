import * as React from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    IconButton,
    FormControl,
    MenuItem,
    TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from "dayjs";
import Select2 from "react-select";
import numeral from "numeral";
import AddPaymentDialog from "@/Components/AddPaymentDialog";
import ViewDetailsDialog from "@/Components/ViewDetailsDialog";
import CustomPagination from "@/Components/CustomPagination";

const columns = (handleRowClick) => [
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Vendor Name", width: 200 },
    {
        field: "discount", headerName: "Discount", width: 100, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "total_amount", headerName: "Total Amount", width: 120, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },
    {
        field: "amount_paid",
        headerName: "Amount Paid",
        width: 120, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <Button
                onClick={() => handleRowClick(params.row, "add_payment")}
                variant="text"
                fullWidth
                sx={{
                    textAlign: "left",
                    fontWeight: "bold",
                    justifyContent: "flex-end",
                }}
            >
                {numeral(params.value).format('0,0.00')}
            </Button>
        ),
    },
    {
        field: "purchase_date",
        headerName: "Date",
        width: 120,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return dayjs(params.value).format("YYYY-MM-DD");
        },
    },
    {
        field: "status",
        headerName: "Status",
        width: 100,
    },
    {
        field: "action",
        headerName: "Actions",
        width: 150,
        renderCell: (params) => (
            <>
                <IconButton
                    sx={{ ml: "0.3rem" }}
                    color="primary"
                    onClick={() => handleRowClick(params.row, "view_details")}
                >
                    <VisibilityIcon />
                </IconButton>
            </>
        ),
    },
];

export default function Purchases({ purchases, contacts }) {
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [viewPaymentsModalOpen, setViewPaymentsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [amountLimit, setAmountLimit] = useState(0);

    const [dataPurchases, setDataPurchases] = useState(purchases);

    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        search_query: '',
        end_date: '',
        status: 'all',
        store: 0,
        per_page: 100,
        contact_id: ''
    });

    const handleRowClick = (purchase, action) => {
        setSelectedTransaction(purchase);
        if (action == "add_payment") {
            const amountLimit =
                parseFloat(purchase.total_amount) -
                parseFloat(purchase.amount_paid);
            setSelectedContact(purchase.contact_id);
            setAmountLimit(amountLimit);
            setPaymentModalOpen(true);
        } else if (action == "view_details") {
            setViewPaymentsModalOpen(true);
        }
    };

    const refreshPurchases = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["purchases"], // Only reload specified properties
            onSuccess: (response) => {
                setDataPurchases(response.props.purchases);
            },
        };
        router.get(
            url, searchTerms,
            options
        );
    };

    const handleSearchChange = (e) => {
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

    useEffect(() => {
        refreshPurchases(window.location.pathname);
    }, [searchTerms]);

    return (
        <AuthenticatedLayout>
            <Head title="Purchases" />

            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "end", width: "100%" }}
            >
                <FormControl sx={{ minWidth: "240px" }}>
                    <Select2
                        className="w-full"
                        placeholder="Select a contact..."
                        styles={{
                            control: (baseStyles, state) => ({
                                ...baseStyles,
                                height: "55px",
                            }),
                        }}
                        options={contacts}
                        onChange={(selectedOption) => handleSearchChange(selectedOption)}
                        isClearable
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.id}
                    ></Select2>
                </FormControl>

                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        value={searchTerms.status}
                        label="Status"
                        onChange={handleSearchChange}
                        name="status"
                        select
                        fullWidth
                        size="small"
                    >
                        <MenuItem value={"all"}>All</MenuItem>
                        <MenuItem value={"completed"}>Completed</MenuItem>
                        <MenuItem value={"pending"}>Pending</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Start Date"
                        name="start_date"
                        placeholder="Start Date"
                        fullWidth
                        size="small"
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.start_date}
                        onChange={handleSearchChange}
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

                <Link href="/purchase/create">
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                    >
                        Add Purchase
                    </Button>
                </Link>

                <Box
                    className="py-6 w-full"
                    sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
                >
                    <DataGrid
                        rowHeight={50}
                        rows={dataPurchases.data}
                        columns={columns(handleRowClick)}
                        hideFooter
                    />
                </Box>
            </Grid>
            <Grid size={12} container sx={{ justifyContent: "end" }}>
                <CustomPagination
                    refreshTable={refreshPurchases}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataPurchases}
                ></CustomPagination>
            </Grid>
            <AddPaymentDialog
                open={paymentModalOpen}
                setOpen={setPaymentModalOpen}
                selectedTransaction={selectedTransaction}
                selectedContact={selectedContact}
                amountLimit={amountLimit}
                is_customer={false}
                refreshTable={refreshPurchases}
            />
            <ViewDetailsDialog
                open={viewPaymentsModalOpen}
                setOpen={setViewPaymentsModalOpen}
                type={"purchase"}
                selectedTransaction={selectedTransaction?.id}
            />
        </AuthenticatedLayout>
    );
}
