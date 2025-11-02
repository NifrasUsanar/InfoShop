import * as React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { DataGrid } from "@mui/x-data-grid";
import {
    Button,
    Box,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import ChargeDialog from "./Partials/ChargeDialog";
import CustomPagination from "@/Components/CustomPagination";

export default function ChargesIndex({
    charges,
    chargeTypes,
    rateTypes,
    pageLabel,
}) {
    const [dataCharges, setDataCharges] = useState(charges);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedChargeId, setSelectedChargeId] = useState(null);
    const [openChargeDialog, setOpenChargeDialog] = useState(false);
    const [chargeToEdit, setChargeToEdit] = useState(null);
    const [searchTerms, setSearchTerms] = useState({
        per_page: 100,
    });

    const chargeColumns = [
        {
            field: "name",
            headerName: "Name",
            width: 200,
            renderCell: (params) => (
                <button
                    onClick={() => handleEditClick(params.row)}
                    className="text-blue-600 hover:underline font-semibold bg-none border-none cursor-pointer p-0"
                >
                    {params.value}
                </button>
            ),
        },
        {
            field: "charge_type",
            headerName: "Type",
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value.replace(/_/g, " ").toUpperCase()}
                    size="small"
                    variant="outlined"
                />
            ),
        },
        {
            field: "rate_value",
            headerName: "Rate Value",
            width: 120,
            renderCell: (params) => `${params.value}`,
        },
        {
            field: "rate_type",
            headerName: "Rate Type",
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value === "percentage" ? "%" : "Fixed"}
                    size="small"
                    variant={params.value === "percentage" ? "filled" : "outlined"}
                />
            ),
        },
        {
            field: "is_active",
            headerName: "Status",
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? "Active" : "Inactive"}
                    color={params.value ? "success" : "error"}
                    size="small"
                />
            ),
        },
        {
            field: "is_default",
            headerName: "Default",
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value ? "Default" : "Manual"}
                    color={params.value ? "primary" : "default"}
                    size="small"
                    variant={params.value ? "filled" : "outlined"}
                />
            ),
        },
        {
            field: "description",
            headerName: "Description",
            width: 250,
            renderCell: (params) => params.value || "-",
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton
                        size="small"
                        onClick={() => handleEditClick(params.row)}
                        title="Edit"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(params.row.id)}
                        title="Delete"
                        color="error"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    const handleCreateClick = () => {
        setChargeToEdit(null);
        setOpenChargeDialog(true);
    };

    const handleEditClick = (charge) => {
        setChargeToEdit(charge);
        setOpenChargeDialog(true);
    };

    const handleDeleteClick = (id) => {
        setSelectedChargeId(id);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        router.delete(`/charges/${selectedChargeId}`, {
            onSuccess: () => {
                Swal.fire({
                    title: "Deleted!",
                    text: "Charge has been deleted successfully.",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                refreshCharges();
            },
            onError: (errors) => {
                const errorMessage =
                    errors.message || "Failed to delete charge.";
                Swal.fire({
                    title: "Cannot Delete!",
                    text: errorMessage,
                    icon: "warning",
                });
            },
        });
        setOpenDeleteDialog(false);
    };

    const handleDeleteCancel = () => {
        setOpenDeleteDialog(false);
    };

    const refreshCharges = () => {
        router.reload({
            only: ["charges"],
        });
    };

    useEffect(() => {
        setDataCharges(charges);
    }, [charges]);

    const processedCharges = dataCharges?.data?.map((charge) => ({
        id: charge.id,
        ...charge,
    })) || [];

    return (
        <AuthenticatedLayout>
            <Head title="Charges & Taxes" />

            <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{ width: "100%" }}
                justifyContent={"end"}
                size={12}
            >
                <Grid size={{ xs: 12, sm: "auto" }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                    >
                        Add Charge
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    height: "calc(100vh - 200px)",
                }}
            >
                <DataGrid
                    rows={processedCharges}
                    columns={chargeColumns}
                    disableSelectionOnClick
                    hideFooter
                    sx={{
                        "& .MuiDataGrid-cell": {
                            borderBottom: "1px solid #e0e0e0",
                        },
                    }}
                />
            </Box>

            <Grid size={12} container justifyContent={"end"} spacing={2} alignItems={"center"}>
                <CustomPagination
                    refreshTable={(url) => {
                        router.get(url, searchTerms, {
                            preserveState: true,
                            preserveScroll: true,
                            only: ["charges"],
                            onSuccess: (response) => {
                                setDataCharges(response.props.charges);
                            },
                        });
                    }}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataCharges}
                ></CustomPagination>
            </Grid>

            {/* Charge Dialog */}
            <ChargeDialog
                open={openChargeDialog}
                setOpen={setOpenChargeDialog}
                chargeTypes={chargeTypes}
                rateTypes={rateTypes}
                refreshCharges={refreshCharges}
                chargeToEdit={chargeToEdit}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
                <DialogTitle>Delete Charge?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this charge? This action cannot
                        be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </AuthenticatedLayout>
    );
}
