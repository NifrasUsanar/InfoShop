import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid2";
import {
    Button,
    Box,
    IconButton,
} from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import TaxAndFeeDialog from "./Partials/TaxAndFeeDialog";

const columns = (handleRowClick) => [
    { field: "id", headerName: "ID", width: 80 },
    {
        field: "name",
        headerName: "Name",
        width: 200,
    },
    { field: "type", headerName: "Type", width: 200 },
    {
        field: "rate", headerName: "Rate", width: 130, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return params.row.is_percentage ? `${numeral(params.value).format('0.00')}%` : numeral(params.value).format('0,0.00');
        },
    },
    {
        field: 'action',
        headerName: 'Actions',
        width: 150, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <>
                <IconButton sx={{ ml: '0.3rem' }} color="error" onClick={() => handleRowClick(params.row, "delete_taxAndFee")}>
                    <DeleteIcon />
                </IconButton>
            </>
        ),
    },
];

export default function TaxAndFee({ taxesAndFees }) {
    const [dataTaxesAndFees, setDataTaxesAndFees] = useState(taxesAndFees)
    const [taxAndFeeModalOpen, setTaxAndFeeModalOpen] = useState(false)
    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        store: 0,
    });

    const handleRowClick = (taxAndFee, action) => {
        if (action === 'delete_taxAndFee') {
            deleteTaxAndFee(taxAndFee.id);
        }
    };

    const deleteTaxAndFee = (taxAndFeeID) => {
        Swal.fire({
            title: "Do you want to remove the record?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`/taxes-and-fees/${taxAndFeeID}`)
                    .then((response) => {
                        setDataTaxesAndFees(dataTaxesAndFees.filter((item) => item.id !== taxAndFeeID));
                        Swal.fire({
                            title: "Success!",
                            text: response.data.message,
                            icon: "success",
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true,
                        });
                    })
                    .catch((error) => {
                        console.error("Deletion failed with errors:", error);
                    });
            }
        });
    }

    const refreshTaxesAndFees = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["taxesAndFees"], // Only reload specified properties
            onSuccess: (response) => {
                setDataTaxesAndFees(response.props.taxesAndFees);
            },
        };
        router.get(url, searchTerms, options);
    };

    return (
        <AuthenticatedLayout>
            <Head title="TaxesAndFees" />
            <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{ width: "100%" }}
                justifyContent={"end"}
                size={12}
            >

                <Grid size={{ xs: 8, sm: 3 }}>
                    <Button
                        variant="contained"
                        onClick={() => setTaxAndFeeModalOpen(true)}
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                    >
                        ADD TAX
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 120px)",}}
            >
                <DataGrid
                    rows={dataTaxesAndFees}
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

            <TaxAndFeeDialog
                open={taxAndFeeModalOpen}
                setOpen={setTaxAndFeeModalOpen}
                refreshTaxesAndFees={refreshTaxesAndFees}
            />
        </AuthenticatedLayout>
    );
}
