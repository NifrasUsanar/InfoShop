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
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import dayjs from "dayjs";
import numeral from "numeral";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";
import ReloadFormDialog from "./ReloadFormDialog";

const columns = (handleRowClick) => [
    {
        field: "id", headerName: "ID", width: 80,
        renderCell: (params) => {
            return params.value.toString().padStart(4, "0");
        },
    },
    {
        field: "sale_date", headerName: "Date", width: 120,
        renderCell: (params) => dayjs(params.value).format("YYYY-MM-DD"),
    },
    { field: "contact_name", headerName: "Customer", width: 150 },
    { field: "account_number", headerName: "Account Number", width: 200,
        renderCell: (params) => (
            <Link underline="hover" href='#' className='hover:underline' onClick={(event) => { event.preventDefault(); handleRowClick(params.row, 'account_edit'); }}>
                <p className='font-bold'>{params.value}</p>
            </Link>
        ),
     },
    { field: "product_name", headerName: "Product Name", width: 150 },
    {
        field: "reload_amount", headerName: "Reload", width: 100,
        renderCell: (params) => numeral(params.row.unit_price - params.row.additional_commission).format('0,0.00'),
    },
    {
        field: "additional_commission", headerName: "Addl. Comm", width: 150, align: "right", headerAlign: "right",
        renderCell: (params) => numeral(params.value).format('0,0.00'),
    },
    {
        field: "commission", headerName: "Comm", width: 100, align: "right", headerAlign: "right",
        renderCell: (params) => numeral(params.value).format('0,0.00'),
    },
    // { field: "description", headerName: "Description", width: 250 },
];

export default function Reload({ reloads, transactionType }) {
    const [dataReloads, setDataReloads] = useState(reloads);
    const [totalCommission, setTotalCommission] = useState(0);
    const [reloadModalOpen, setReloadModalOpen] = useState(false)
    const [selectedReload, setSelectedReload] = useState(0)
    const [searchTerms, setSearchTerms] = useState({
        search_query: '',
        start_date: '',
        end_date: '',
        store: 0,
        per_page: 100,
    });

    const refreshReloads = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["reloads"], // Only reload specified properties
            onSuccess: (response) => {
                setDataReloads(response.props.reloads || []);
            },
        };
        router.get(url, searchTerms, options);
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        refreshReloads(window.location.pathname);
    };

    useEffect(() => {
        const reloadData = dataReloads?.data || [];
        const total = reloadData.reduce((acc, curr) => acc + parseFloat(curr.commission || 0), 0);
        setTotalCommission(total);
    }, [dataReloads]);

    const handleRowClick = (reload, action) => {
        setSelectedReload(reload);
        if (action === 'account_edit') {
            setReloadModalOpen(true);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Payments" />
            <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{ width: "100%" }}
                justifyContent={"center"}
                size={12}
            >
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="Search Query"
                        name="search_query"
                        placeholder="Search by account or product name"
                        value={searchTerms.search_query}
                        onChange={handleSearchChange}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="Start Date"
                        name="start_date"
                        type="date"
                        value={searchTerms.start_date}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="End Date"
                        name="end_date"
                        type="date"
                        value={searchTerms.end_date}
                        onChange={handleSearchChange}
                        fullWidth
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 1 }}>
                    <Button variant="contained" fullWidth onClick={handleSearch} sx={{ height: "100%" }}>
                        <FindReplaceIcon />
                    </Button>
                </Grid>

            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataGrid
                    rows={dataReloads?.data || []}
                    columns={columns(handleRowClick)}
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                        },
                    }}
                    hideFooter
                />
            </Box>
            <Grid size={12} spacing={2} container justifyContent={'end'}>
                <Chip size="large" label={`Total Commission: ${numeral(totalCommission).format('0,0.00')}`} color="primary" />
                <CustomPagination
                    data={reloads || {}}
                    searchTerms={searchTerms}
                    setSearchTerms={setSearchTerms}
                    refreshTable={refreshReloads}
                />
            </Grid>

            <ReloadFormDialog
                open={reloadModalOpen && !!selectedReload}
                reloadData={selectedReload}
                refreshReloads={refreshReloads}
                setOpen={setReloadModalOpen}
            />
        </AuthenticatedLayout>
    );
}
