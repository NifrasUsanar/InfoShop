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
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";
import ExpenseDialog from "./Partials/ExpenseDialog";

const columns = (handleRowClick) => [
    { field: "id", headerName: "ID", width: 80 },
    {
        field: "expense_date",
        headerName: "Date",
        width: 100,
        renderCell: (params) => {
            // Format the date to 'YYYY-MM-DD'
            return dayjs(params.value).format("YYYY-MM-DD");
        },
    },
    { field: "description", headerName: "Description", width: 300 },
    {
        field: "source",
        headerName: "Source",
        width: 120,
        renderCell: (params) => {
            return params.value ? params.value.toUpperCase() : '-';
        },
    },
    {
        field: "amount", headerName: "Amount", width: 130, align: 'right', headerAlign: 'right',
        renderCell: (params) => {
            return numeral(params.value).format('0,0.00');
        },
    },

    {
        field: 'action',
        headerName: 'Actions',
        width: 150, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <>
                <IconButton sx={{ ml: '0.3rem' }} color="error" onClick={() => handleRowClick(params.row, "delete_expense")}>
                    <DeleteIcon />
                </IconButton>
            </>
        ),
    },
];

export default function Expense({ expenses, stores }) {
    const [dataExpenses, setDataExpenses] = useState(expenses);
    const [totalExpense, setTotalExpense] = useState(0)
    const [expenseModalOpen, setExpenseModalOpen] = useState(false)
    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        store: 0,
        per_page: 100,
    });

    const handleRowClick = (expense, action) => {
        if (action === 'delete_expense') {
            deleteExpense(expense.id);
        }
    };

    const deleteExpense = (expenseID) => {
        Swal.fire({
            title: "Do you want to remove the record?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`/expense/${expenseID}/delete`)
                    .then((response) => {
                        const updatedData = dataExpenses.data.filter((item) => item.id !== expenseID);
                        setDataExpenses({ ...dataExpenses, data: updatedData });
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

    const refreshExpenses = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["expenses"], // Only reload specified properties
            onSuccess: (response) => {
                setDataExpenses(response.props.expenses);
            },
        };
        router.get(url, searchTerms, options);
    };

    //Get total expenses
    useEffect(() => {
        const total = Object.values(dataExpenses.data).reduce((accumulator, current) => {
            return accumulator + parseFloat(current.amount);
        }, 0);
        setTotalExpense(total);
    }, [dataExpenses]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        refreshExpenses(window.location.pathname);
    }, [searchTerms]);

    return (
        <AuthenticatedLayout>
            <Head title="Expenses" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%", justifyContent: "end" }}
                size={12}
            >

                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        label="Search..."
                        name="search_query"
                        size="small"
                        placeholder="Start typing..."
                        value={searchTerms.search_query}
                        onChange={handleSearchChange}
                        fullWidth
                    />
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
                        required
                    />
                </Grid>


                <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                        label="End Date"
                        name="end_date"
                        size="small"
                        placeholder="End Date"
                        fullWidth
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

                <Grid size={{ xs: 8, sm: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setExpenseModalOpen(true)}
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                    >
                        ADD EXPENSE
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataGrid
                    rows={dataExpenses?.data}
                    columns={columns(handleRowClick)}
                    hideFooter
                />
            </Box>
            <Grid size={12} container spacing={2} sx={{ justifyContent: "end", alignItems: "center" }}>
                <Chip size="large" label={'Total:' + numeral(totalExpense).format('0,0')} color="primary" />
                <CustomPagination
                    refreshTable={refreshExpenses}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataExpenses}
                ></CustomPagination>
            </Grid>

            <ExpenseDialog
                open={expenseModalOpen}
                setOpen={setExpenseModalOpen}
                stores={stores}
                refreshExpenses={refreshExpenses}
            />
        </AuthenticatedLayout>
    );
}
