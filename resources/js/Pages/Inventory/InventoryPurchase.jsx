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
    Chip,
    MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper,
    Autocomplete,
    TableFooter,
    InputAdornment
} from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";
import CustomPagination from "@/Components/CustomPagination";
import InventoryItemDialog from "./Partials/InventoryItemDialog";

const InventoryPurchase = ({ inventory_items, stores }) => {
    const [dataInventoryItems, setDataInventoryItems] = useState(inventory_items);
    const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
    const [purchaseForm, setPurchaseForm] = useState(
        {
            store_id: 1,
            transaction_date: dayjs().format("YYYY-MM-DD"),
        }
    );

    const refreshInventoryItems = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["inventory_items"], // Only reload specified properties
            onSuccess: (response) => {
                setDataInventoryItems(response.props.inventory_items);
            },
        };
        router.get(url, [], options);
    };

    const [rows, setRows] = useState([
        { item: null, quantity: '', unitCost: '' },
    ]);

    const handleChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);

        const lastRow = updatedRows[updatedRows.length - 1];
        const isLastRowFilled = lastRow.item && lastRow.quantity && lastRow.unitCost;

        if (isLastRowFilled) {
            setRows([...updatedRows, { item: null, quantity: '', unitCost: '' }]);
        }
    };

    const handleRemove = (index) => {
        const updatedRows = rows.filter((_, i) => i !== index);
        setRows(updatedRows.length ? updatedRows : [{ item: null, quantity: '', unitCost: '' }]);
    };

    const handleSubmit = () => {
        const isValid = rows.every(
            (row) =>
                row.item !== null &&
                row.quantity !== "" &&
                row.unitCost !== ""
        );

        if (!isValid) {
            Swal.fire({
                title: "Error!",
                text: "Please fill in all the fields",
                icon: "error",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append("store_id", purchaseForm.store_id);
        formData.append("transaction_date", purchaseForm.transaction_date);
        formData.append("items", JSON.stringify(rows));
        formData.append('total', rows.reduce((total, row) => total + row.unitCost * row.quantity, 0));

        axios.post('/inventory-purchase', formData)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                location.reload();
            })
            .catch((error) => {
                console.error("Submission failed with errors:", error);
            });
    }


    return (
        <AuthenticatedLayout>
            <Head title="Inventory Purchase" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%" }}
                size={12}
            >
                <Grid size={3}>
                    <TextField
                        fullWidth
                        label="Store"
                        variant="outlined"
                        select
                        size="small"
                        name="store_id"
                        value={purchaseForm.store_id}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, store_id: e.target.value })}
                    >
                        {stores.map((store) => (
                            <MenuItem key={store.id} value={store.id}>
                                {store.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={3}>
                    <TextField
                        fullWidth
                        label="Purchase Date"
                        variant="outlined"
                        name="transaction_date"
                        type="date"
                        size="small"
                        value={purchaseForm.transaction_date}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, transaction_date: e.target.value })}
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 4, sm: 6, md: 3 }}>
                    <Button
                        variant="contained"
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                        onClick={() => {
                            setInventoryItemModalOpen(true);
                        }}
                    >
                        NEW INVENTORY ITEM
                    </Button>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Inventory Item</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Unit Cost</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Line Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Autocomplete
                                            options={dataInventoryItems.filter(item =>
                                                !rows.some((r, i) => i !== index && r.item?.id === item.id)
                                                || row.item?.id === item.id
                                            )}
                                            getOptionLabel={(option) => option.name}
                                            getOptionKey={option => option.id}
                                            value={row.item}
                                            onChange={(event, newValue) =>
                                                handleChange(index, 'item', newValue)
                                            }
                                            renderInput={(params) => (
                                                <TextField {...params} size="large" fullWidth />
                                            )}
                                        />

                                    </TableCell>
                                    <TableCell width={200}>
                                        <TextField
                                            fullWidth
                                            size="large"
                                            type="number"
                                            required
                                            placeholder="Unit Cost"
                                            value={row.unitCost}
                                            onChange={(e) => handleChange(index, 'unitCost', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell
                                        width={200}
                                    >
                                        <TextField
                                            fullWidth
                                            size="large"
                                            type="number"
                                            placeholder="Quantity"
                                            value={row.quantity}
                                            onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                                            required
                                            slotProps={{
                                                input: {
                                                    endAdornment: (
                                                        <InputAdornment position="end" className="text-sm italic">
                                                            {row.item?.unit_type}
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <strong> {numeral(row.quantity * row.unitCost).format('0,0.00')}</strong>
                                    </TableCell>
                                    <TableCell>
                                        {rows.length > 1 && (
                                            <IconButton onClick={() => handleRemove(index)}>
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell align="right">
                                    <span className="font-bold text-lg">Total</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-bold text-lg">
                                        {numeral(rows.reduce(
                                            (sum, row) =>
                                                sum + (Number(row.quantity || 0) * Number(row.unitCost || 0)),
                                            0
                                        )).format('0,0.00')}
                                    </span>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell align="right" colSpan={5}>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => router.get('/inventory')}
                                        sx={{ mr: 2 }}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            handleSubmit()
                                        }}
                                    >
                                        Submit
                                    </Button>

                                </TableCell>
                            </TableRow>
                        </TableFooter>

                    </Table>
                </TableContainer>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >

            </Box>


            <InventoryItemDialog
                open={inventoryItemModalOpen}
                setOpen={setInventoryItemModalOpen}
                inventory_item={null}
                stores={stores}
                refreshInventoryItems={refreshInventoryItems}
            />
        </AuthenticatedLayout>
    );
};

export default InventoryPurchase;
