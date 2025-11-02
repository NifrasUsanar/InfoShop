import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, TextField, Typography, MenuItem } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import axios from "axios";
import numeral from "numeral";

import DailyCashDialog from "./Partial/DailyCashDialog";
import ViewDetailsDialog from "@/Components/ViewDetailsDialog";

export default function DailyReport({ logs, stores, users }) {
    const auth = usePage().props.auth.user
    const [dataLogs, setDataLogs] = useState(logs);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [formState, setFormState] = useState({
        user_id: auth.user_role === "admin" ? "All" : auth.id,
        transaction_date: dayjs().format("YYYY-MM-DD"),
        store_id: auth.user_role === "admin" ? "All" : auth.store_id,
    });

    const refreshLogs = (url = window.location.pathname, transaction_date = formState.transaction_date, user = formState.user_id, store_id = formState.store_id) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["logs"], // Only reload specified properties
            onSuccess: (response) => {
                setDataLogs(response.props.logs);
            },
        };
        router.get(
            url,
            {
                transaction_date: transaction_date,
                user: user,
                store_id: store_id
            },
            options
        );
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => {
            const updatedFormState = {
                ...prevState,
                [name]: value,
            };
            refreshLogs(window.location.pathname, updatedFormState.transaction_date, updatedFormState.user_id, updatedFormState.store_id);
            return updatedFormState;
        });
    }

    const totalCashIn = dataLogs.reduce((sum, row) => sum + parseFloat(row.cash_in), 0);
    const totalCashOut = dataLogs.reduce((sum, row) => sum + parseFloat(row.cash_out), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Daily Report" />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent={"center"}
                    size={12}
                    sx={{ mb: 1 }}
                >
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <DatePicker
                            label="Date"
                            value={dayjs(formState.transaction_date)}
                            onChange={(date) => {
                                const newDate = date.format("YYYY-MM-DD");
                                setFormState((prevState) => {
                                    const updatedFormState = {
                                        ...prevState,
                                        transaction_date: newDate,
                                    };
                                    refreshLogs(window.location.pathname, newDate, prevState.user_id, prevState.store_id);
                                    return updatedFormState;
                                });
                            }}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: "small",
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2, sm: 3 }}>
                        <TextField
                            fullWidth
                            select
                            value={formState.store_id}
                            label="Store"
                            size="small"
                            onChange={handleFieldChange}
                            required
                            name="store_id"
                        >
                            {auth.user_role === 'admin' || auth.user_role === 'super-admin' ? (
                                <MenuItem value="All">All</MenuItem>
                            ) : null}
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
                    <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                        <TextField
                            value={formState.user_id}
                            fullWidth
                            name="user_id"
                            size="small"
                            label="User/Cashier"
                            onChange={handleFieldChange}
                            select
                        >
                            <MenuItem value="All">All</MenuItem>
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3, md: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => setModalOpen(true)}
                            sx={{ height: "100%", }}
                            startIcon={<AddCircleIcon />}
                            size="small"
                            fullWidth
                            color="success"
                        >
                            MANUAL
                        </Button>
                    </Grid>

                </Grid>
            </LocalizationProvider>

            <div className="flex justify-center">
                <div className="w-full max-w-4xl">
                    {/* Desktop Table View */}
                    <div className="hidden md:block border border-gray-300 rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-black text-white text-sm font-semibold sticky top-0">
                            <div className="col-span-1 px-4 py-3 text-center">#</div>
                            <div className="col-span-2 px-4 py-3 text-left">DATE</div>
                            <div className="col-span-5 px-4 py-3 text-left">DESCRIPTION</div>
                            <div className="col-span-2 px-4 py-3 text-right">CASH IN</div>
                            <div className="col-span-2 px-4 py-3 text-right">CASH OUT</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-200">
                            {dataLogs.map((row, index) => (
                                <div key={index} className="grid grid-cols-12 hover:bg-gray-50 text-sm even:bg-gray-50">
                                    <div className="col-span-1 px-4 py-3 text-center">{index + 1}</div>
                                    <div className="col-span-2 px-4 py-3 text-left">{row.transaction_date}</div>
                                    <div
                                        className="col-span-5 px-4 py-3 text-left cursor-pointer hover:text-blue-600"
                                        onClick={() => {
                                            if (row.sales_id !== null) {
                                                setSelectedTransaction(row.sales_id);
                                                setViewDetailsModalOpen(true);
                                            }
                                        }}
                                    >
                                        {
                                            row.source.charAt(0).toUpperCase() + row.source.slice(1) +
                                            (row.sales_id ? ' (#' + row.sales_id + ')' : "") +
                                            (row.name ? " - " + row.name : "") +
                                            (row.description ? " | " + row.description : "") +
                                            (row.transaction_type === 'account' ? " (Balance update)" : "")
                                        }
                                    </div>
                                    <div className="col-span-2 px-4 py-3 text-right font-mono">
                                        {row.cash_in == 0 ? '-' : numeral(row.cash_in).format('0,0.00')}
                                    </div>
                                    <div className="col-span-2 px-4 py-3 text-right font-mono">
                                        {row.cash_out == 0 ? '-' : numeral(row.cash_out).format('0,0.00')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Row */}
                        <div className="grid grid-cols-12 bg-gray-100 border-t-2 border-gray-300 font-semibold text-sm">
                            <div className="col-span-8 px-4 py-3 text-right">Total:</div>
                            <div className="col-span-2 px-4 py-3 text-right font-mono">
                                {numeral(totalCashIn).format('0,0.00')}
                            </div>
                            <div className="col-span-2 px-4 py-3 text-right font-mono">
                                {numeral(totalCashOut).format('0,0.00')}
                            </div>
                        </div>

                        {/* Balance Row */}
                        <div className="grid grid-cols-12 bg-white border-t border-gray-300 font-bold text-base">
                            <div className="col-span-10 px-4 py-4 text-right">Balance:</div>
                            <div className="col-span-2 px-4 py-4 text-right font-mono text-lg">
                                {numeral(dataLogs.reduce((total, row) => total + parseFloat(row.amount), 0)).format('0,0.00')}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View - Modern Style */}
                    <div className="md:hidden space-y-2">
                        {dataLogs.map((row, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-3 border border-gray-200"
                            >
                                {/* Header Row - Index and Date */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                        #{index + 1}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">{row.transaction_date}</span>
                                </div>

                                {/* Description with Amount */}
                                <div
                                    className="flex justify-between items-start gap-2 cursor-pointer group"
                                    onClick={() => {
                                        if (row.sales_id !== null) {
                                            setSelectedTransaction(row.sales_id);
                                            setViewDetailsModalOpen(true);
                                        }
                                    }}
                                >
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors break-words leading-snug flex-1">
                                        {
                                            row.source.charAt(0).toUpperCase() + row.source.slice(1) +
                                            (row.sales_id ? ' (#' + row.sales_id + ')' : "") +
                                            (row.name ? " - " + row.name : "") +
                                            (row.description ? " | " + row.description : "") +
                                            (row.transaction_type === 'account' ? " (Balance update)" : "")
                                        }
                                    </p>
                                    <span className={`text-base font-bold font-mono flex-shrink-0 ${row.cash_in > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {row.cash_in > 0 ? '+' + numeral(row.cash_in).format('0,0.00') : '-' + numeral(row.cash_out).format('0,0.00')}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Mobile Summary Section */}
                        <div className="mt-4 space-y-2">
                            {/* Total Card */}
                            <div className="bg-slate-50 rounded-xl p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Summary</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total In</p>
                                        <p className="text-base font-bold text-green-600 font-mono">
                                            +{numeral(totalCashIn).format('0,0.00')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Out</p>
                                        <p className="text-base font-bold text-red-600 font-mono">
                                            -{numeral(totalCashOut).format('0,0.00')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Card - Highlighted */}
                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Final Balance</p>
                                <p className="text-2xl font-bold text-white font-mono">
                                    {numeral(dataLogs.reduce((total, row) => total + parseFloat(row.amount), 0)).format('0,0.00')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DailyCashDialog
                open={modalOpen}
                setOpen={setModalOpen}
                stores={stores}
                auth={auth}
                refreshTransactions={refreshLogs}
            />

            {selectedTransaction && (
                <ViewDetailsDialog
                    open={viewDetailsModalOpen}
                    setOpen={setViewDetailsModalOpen}
                    type={"sale"}
                    selectedTransaction={selectedTransaction}
                />
            )}

        </AuthenticatedLayout>
    );
}
