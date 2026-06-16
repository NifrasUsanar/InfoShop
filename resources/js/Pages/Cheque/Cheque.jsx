import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    TextField,
    Chip,
    MenuItem,
    Link
} from "@mui/material";
import dayjs from "dayjs";
import numeral from "numeral";

import { DataGrid } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";
import ChequeFormDialog from "./ChequeFormDialog";

const columns = (handleRowClick) => [
    {
        field: "id", headerName: "ID", width: 80,
        renderCell: (params) => {
            return params.value.toString().padStart(4, "0"); // Formats ID as 4-digit padded number
        },
    },
    {
        field: "cheque_date", headerName: "Cheque Date", width: 120,
        renderCell: (params) => dayjs(params.value).format("YYYY-MM-DD"), // Formats the date
    },
    {
        field: "cheque_number", headerName: "Cheque Number", width: 200,
        renderCell: (params) => (
            <Link underline="hover" href="#" className="hover:underline" onClick={(event) => {
                event.preventDefault();
                handleRowClick(params.row, 'cheque_edit'); // Updated action to reflect cheque editing
            }}>
                <p className="font-bold">{params.value}</p>
            </Link>
        ),
    },
    {
        field: "name", headerName: "Payee/Drawer", width: 150 // Updated to reflect the "name" column (payee or drawer)
    },
    {
        field: "amount", headerName: "Amount", width: 150, align: "right", headerAlign: "right",
        renderCell: (params) => numeral(params.value).format('0,0.00'), // Formats amount with commas and 2 decimal places
    },
    {
        field: "bank", headerName: "Bank", width: 200 // Added a column for the bank name
    },
    {
        field: "status", headerName: "Status", width: 150, align: "right", headerAlign: "right",
        renderCell: (params) => (
            <span className={`status-${params.value.toLowerCase()}`}>
                {params.value.toUpperCase()}
            </span>
        ),
    },
    {
        field: "days", headerName: "Days", width: 150,
        renderCell: (params) => {
            const chequeDate = dayjs(params.row.cheque_date).startOf('day');
            const today = dayjs().startOf('day');
            const remainingDays = chequeDate.diff(today, 'day');
            const isPending = params.row.status === 'pending';

            return (
                <span
                    style={{
                        color: isPending && remainingDays < 0 ? "red" : "inherit", // Red if remainingDays < 0 and status is pending
                    }}
                >
                    {isPending
                        ? remainingDays >= 0
                            ? `${remainingDays} days remaining`
                            : `${remainingDays} days passed`
                        : "---"}
                </span>
            );

            // return params.row.status === 'pending' ? `${remainingDays} days remaining` : '---';
        },
    },
    {
        field: "direction", headerName: "Direction", width: 120,
        renderCell: (params) => (
            params.value === "issued" ? "Issued" : "Received" // Converts direction to readable text
        ),
    },
    {
        field: "remark", headerName: "Remark", width: 200,
        renderCell: (params) => (
            <span title={params.value}>{params.value}</span> // Displays remark with a tooltip
        ),
    },
];


export default function Cheque({ cheques, stores }) {
    const [dataCheques, setDataCheques] = useState(cheques);
    const [totalAmount, setTotalAmount] = useState(0);
    const [chequeModalOpen, setChequeModalOpen] = useState(false);
    const [selectedCheque, setSelectedCheque] = useState(0);
    const [searchTerms, setSearchTerms] = useState({
        start_date: '',      // Filter for start of date range
        search_query: '',
        end_date: '',        // Filter for end of date range
        status: 'pending',          // Filter for cheque status (e.g., cleared, pending)
        direction: 'all',       // Filter for type (issued/received)
        store: 0,            // Store ID (default 0 for "All Stores")
        per_page: 100,       // Number of results per page
    });

    const refreshCheques = (url) => {
        const options = {
            preserveState: true,
            preserveScroll: true,
            only: ["cheques"],
            onSuccess: (response) => {
                setDataCheques(response.props.cheques || []);
            },
        };
        router.get(url, searchTerms, options);
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const total = dataCheques.data.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        setTotalAmount(total);
    }, [dataCheques]);

    useEffect(() => {
        refreshCheques(window.location.pathname);
    }, [searchTerms]);

    const handleRowClick = (cheque, action) => {
        setSelectedCheque(cheque);
        if (action == 'cheque_edit') {
            setChequeModalOpen(true);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Cheques" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", justifyContent: "center" }}
                size={12}
            >
                {/* Store */}
                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        label="Store"
                        name="store"
                        size="small"
                        placeholder="Search by store"
                        value={searchTerms.store}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        select
                    >
                        <MenuItem value={0}>All</MenuItem>
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

                {/* Direction (Issued/Received) */}
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Direction"
                        name="direction"
                        size="small"
                        value={searchTerms.direction}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true, // Ensures label stays above the input
                            },
                        }}
                        select
                    >
                        <MenuItem value={'all'}>All</MenuItem>
                        <MenuItem value={'issued'}>Issued</MenuItem>
                        <MenuItem value={'received'}>Received</MenuItem>
                    </TextField>
                </Grid>

                {/* Status */}
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Status"
                        name="status"
                        size="small"
                        placeholder="Search by status"
                        value={searchTerms.status}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true, // Ensures label stays above the input
                            },
                        }}
                        select
                    >
                        <MenuItem value={"all"}>All</MenuItem>
                        <MenuItem value={"pending"}>Pending</MenuItem>
                        <MenuItem value={"completed"}>Completed</MenuItem>
                        <MenuItem value={"alert"}>Alert</MenuItem>
                        <MenuItem value={"bounced"}>Bounced</MenuItem>
                    </TextField>
                </Grid>

                {/* Search Query */}
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        label="Search Query"
                        size="small"
                        name="search_query"
                        placeholder="Search by cheque number, payee, or bank"
                        value={searchTerms.search_query}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true, // Ensures label stays above the input
                            },
                        }}
                    />
                </Grid>

                {/* Start Date */}
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Start Date"
                        name="start_date"
                        type="date"
                        size="small"
                        value={searchTerms.start_date}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true, // Ensures label stays above the input
                            },
                        }}
                    />
                </Grid>

                {/* End Date */}
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="End Date"
                        name="end_date"
                        type="date"
                        size="small"
                        value={searchTerms.end_date}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true, // Ensures label stays above the input
                            },
                        }}
                    />
                </Grid>

                {/* Add Cheque Button */}
                <Grid size={{ xs: 12, md: 3, sm: 2 }}>
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        onClick={() => {
                            setSelectedCheque(null);
                            setChequeModalOpen(true);
                        }} // Function to handle the "Add Cheque" button
                    >
                        Add Cheque
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: '74vh' }}
            >
                <DataGrid
                    rows={dataCheques?.data}
                    columns={columns(handleRowClick)}
                    hideFooter
                />
            </Box>
            <Grid size={12} spacing={2} container sx={{ justifyContent: "end", alignItems: "center" }}>
                <Chip size="large" label={`Total Amount: ${numeral(totalAmount).format('0,0.00')}`} color="primary" />
                <CustomPagination
                    refreshTable={refreshCheques}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataCheques}
                />
            </Grid>
            {/* Cheque Form Dialog */}
            <ChequeFormDialog
                open={chequeModalOpen}
                selectedCheque={selectedCheque}
                refreshCheques={refreshCheques}
                setOpen={setChequeModalOpen}
                stores={stores}
            />
        </AuthenticatedLayout>
    );
}
