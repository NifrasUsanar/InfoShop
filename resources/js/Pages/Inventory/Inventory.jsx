import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    TextField,
    IconButton,
    Chip
} from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";

import { DataGrid } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";
import InventoryItemDialog from "./Partials/InventoryItemDialog";
import InventoryTransactionDialog from "./Partials/InventoryTransactionDialog";

const columns = (handleRowClick) => [
    { field: 'id', headerName: 'ID', width: 90 },
    {
        field: 'name', headerName: 'Name', width: 150,
        renderCell: (params) => <span className="hover:underline cursor-pointer font-bold" onClick={() => handleRowClick(params.row, 'edit_inventory_item')}>{params.value}</span>
    },
    {
        field: 'quantity',
        headerName: 'Quantity',
        width: 150,
        renderCell: (params) => (
            <span className="hover:underline cursor-pointer font-bold" onClick={() => handleRowClick(params.row, 'inventory_transaction')}>
                {numeral(params.value).format('0,0.00')} <span className="italic">{params.row.unit_type}</span>
            </span>
        )
    },
    {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 100,
        getActions: (params) => [
            <Grid size={12}>
                <IconButton
                    color="error"
                    onClick={() => { handleRowClick(params.row, "delete_inventory_item") }}
                >
                    <DeleteIcon />
                </IconButton>
            </Grid>
        ]
    },
];

const Inventory = ({ inventory_items, stores }) => {
    const [dataInventoryItems, setDataInventoryItems] = useState(inventory_items);
    const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
    const [inventoryTransactionModalOpen, setInventoryTransactionModalOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState({});
    const [searchTerms, setSearchTerms] = useState({});

    const refreshInventoryItems = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["inventory_items"], // Only reload specified properties
            onSuccess: (response) => {
                setDataInventoryItems(response.props.inventory_items);
            },
        };
        router.get(url, searchTerms, options);
    };

    const handleRowClick = (inventory_item, action) => {
        if (action === 'delete_inventory_item') {
            deleteInventoryItem(inventory_item.id);
        } else if (action === 'edit_inventory_item') {
            setSelectedInventoryItem(inventory_item);
            setInventoryItemModalOpen(true);
        }
        else if (action === 'inventory_transaction') {
            setSelectedInventoryItem(inventory_item);
            setInventoryTransactionModalOpen(true);
        }
    };

    const deleteInventoryItem = (inventory_item_id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`/inventory-items/${inventory_item_id}`, {
                    _method: 'DELETE'
                }).then((response) => {
                    Swal.fire(
                        'Deleted!',
                        'Inventory item has been deleted.',
                        'success'
                    );
                    refreshInventoryItems(window.location.href);
                }).catch((error) => {
                    Swal.fire(
                        'Error!',
                        'Something went wrong.',
                        'error'
                    );
                });
            }
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Inventory" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%", justifyContent: "end" }}
                size={12}
            >

                <Grid size={{ xs: 12, sm: 3 }}>
                    <Button
                        variant="contained"
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                        onClick={() => {
                            setSelectedInventoryItem('');
                            setInventoryItemModalOpen(true);
                        }}
                    >
                        ADD INVENTORY ITEM
                    </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                    <Button
                        variant="contained"
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                        onClick={() => { router.get('/inventory-purchase') }}
                    >
                        PURCHASE
                    </Button>
                </Grid>
                <Grid size={{ xs: 8, sm: 2 }}>
                    <Button
                        variant="contained"
                        sx={{ height: "100%" }}
                        startIcon={<HistoryIcon />}
                        size="large"
                        fullWidth
                        color="primary"
                        onClick={() => { router.get('/inventory-logs') }}
                    >
                        LOGS
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataGrid
                    rows={dataInventoryItems?.data ?? []} //.}
                    columns={columns(handleRowClick)}
                    hideFooter
                />
            </Box>
            <Grid size={12} container sx={{ justifyContent: "end" }}>
                {/* <Chip size="large" label={'Total:' + numeral(totalExpense).format('0,0')} color="primary" /> */}
                <CustomPagination
                    refreshTable={refreshInventoryItems}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataInventoryItems}
                ></CustomPagination>
            </Grid>

            <InventoryItemDialog
                open={inventoryItemModalOpen}
                setOpen={setInventoryItemModalOpen}
                inventory_item={selectedInventoryItem}
                stores={stores}
                refreshInventoryItems={refreshInventoryItems}
            />
            <InventoryTransactionDialog
                open={inventoryTransactionModalOpen}
                setOpen={setInventoryTransactionModalOpen}
                stores={stores}
                refreshInventoryItems={refreshInventoryItems}
                inventory_item={selectedInventoryItem}
            />
        </AuthenticatedLayout>
    );
};

export default Inventory;
