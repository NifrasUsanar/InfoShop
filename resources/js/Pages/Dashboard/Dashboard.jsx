import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import {
    Grid,
    ListItem,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Alert,
    Box,
    IconButton
} from "@mui/material";
import dayjs from "dayjs";
import { Card, CardContent } from "@/components/ui/card"

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaidIcon from "@mui/icons-material/Paid";
import PaymentsIcon from "@mui/icons-material/Payments";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import axios, { Axios } from "axios";
import numeral from "numeral";

import Summaries from "./Partials/Summaries";
import { SalesChart } from "./Partials/SalesChart";
import { OverViewCards } from "./Partials/OverViewCards";
import { DatePicker } from "@mui/x-date-pickers";
import MUIDatePicker from "@/Components/ui/MUIDatePicker";
import { DatabaseBackup } from "lucide-react";

export default function Dashboard({ data, logo, version, store_name }) {
    const auth = usePage().props.auth.user;
    const modules = usePage().props.modules;
    const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

    const [cash_in, setCashIn] = useState(0);
    const [total_sales, setTotalSales] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [inventory_purchase, setInventoryPurchase] = useState(0);

    const refreshSummary = async () => {
        try {
            const response = await axios.post("/dashboard/summary", {
                start_date: startDate,
                end_date: endDate,
            });
            const { cash_in, total_sales, expenses, inventory_purchase } = response.data.summary;
            setCashIn(cash_in);
            setTotalSales(total_sales);
            setExpenses(expenses);
            setInventoryPurchase(inventory_purchase);
        } catch (error) {
            console.error("Error fetching summary:", error);
        }
    };

    useEffect(() => {
        refreshSummary();
    }, []); // Empty dependency array means this runs once on mount

    useEffect(() => {
        refreshSummary(); // Call whenever startDate or endDate changes
    }, [startDate, endDate]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            {(auth.user_role == "admin" || auth.user_role == "super-admin") && (

                <Grid size={12} spacing={{ xs: 0.5, sm: 1 }} flexDirection={'row'} container sx={{ mb: 2 }}>
                    {parseFloat(data.lowStock) != 0 && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Link href={"/products?status=alert&per_page=" + data.lowStock}>
                                <Alert severity="warning"><strong>{data.lowStock}</strong> Alert Products</Alert>
                            </Link>
                        </Grid>
                    )}
                    {parseFloat(data.outOfStock) != 0 && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Link href={"/products?status=out_of_stock&per_page=" + data.outOfStock}>
                                <Alert severity="error"><strong>{data.outOfStock}</strong> Out of Stocks</Alert>
                            </Link>
                        </Grid>
                    )}
                    {parseFloat(data.pending_cheque_count) != 0 && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Link href={"/cheques?status=pending&per_page=" + data.pending_cheque_count}>
                                <Alert severity="primary"><strong>{data.pending_cheque_count}</strong> Pending Cheque/s</Alert>
                            </Link>
                        </Grid>
                    )}
                    {parseFloat(data.cheque_alert_count) != 0 && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Link href={`/cheques?status=alert&per_page=${data.cheque_alert_count}`}>
                                <Alert severity="error"><strong>{data.cheque_alert_count}</strong> Alert Cheque/s</Alert>
                            </Link>
                        </Grid>
                    )}
                </Grid>
            )}

            {(auth.user_role == "admin" || auth.user_role == "super-admin") && (
                <OverViewCards />
            )}

            <Grid
                container
                size={{ xs: 12, sm: 8, md: 4 }}
                sx={{ mt: "3rem", paddingBottom: 4 }}
                spacing={2}
            >
                {(auth.user_role == "admin" || auth.user_role == "super-admin") && (
                    <Grid size={{ xs: 12, sm: 8, md: 4 }}>
                        <Card className="pt-0 w-full">
                            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                <Grid
                                    container
                                    display="flex"
                                    spacing={2}
                                    width={"100%"}
                                >
                                    <Grid size={6}>
                                        <MUIDatePicker name="start_date" label="Start Date" value={startDate} onChange={setStartDate} />
                                    </Grid>
                                    <Grid size={6}>
                                        <MUIDatePicker name="end_date" label="End Date" value={endDate} onChange={setEndDate} />
                                    </Grid>
                                </Grid>

                                <List>
                                    <Link href="/reports/sales">
                                        <ListItem
                                            secondaryAction={numeral(
                                                total_sales
                                            ).format("0,0.00")}
                                        >
                                            <ListItemButton>
                                                <ListItemIcon>
                                                    <PaidIcon />
                                                </ListItemIcon>
                                                <ListItemText primary="Sales" />
                                            </ListItemButton>
                                        </ListItem>
                                    </Link>
                                    <Divider />
                                    <Link href="/reports/dailycash">
                                        <ListItem
                                            secondaryAction={numeral(
                                                cash_in
                                            ).format("0,0.00")}
                                        >
                                            <ListItemButton>
                                                <ListItemIcon>
                                                    <PaymentsIcon />
                                                </ListItemIcon>
                                                <ListItemText primary="Cash" />
                                            </ListItemButton>
                                        </ListItem>
                                    </Link>
                                    {modules?.includes('Inventory') && (
                                        <React.Fragment>
                                            <Divider />
                                            <Link href="#">
                                                <ListItem
                                                    secondaryAction={numeral(
                                                        inventory_purchase
                                                    ).format("0,0.00")}
                                                >
                                                    <ListItemButton>
                                                        <ListItemIcon>
                                                            <ShoppingCartCheckoutIcon />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Inventory Purchase" />
                                                    </ListItemButton>
                                                </ListItem>
                                            </Link>
                                        </React.Fragment>
                                    )}
                                    <Divider />
                                    <Link href="/expenses">
                                        <ListItem
                                            secondaryAction={numeral(
                                                expenses
                                            ).format("0,0.00")}
                                        >
                                            <ListItemButton>
                                                <ListItemIcon>
                                                    <AccountBalanceWalletIcon />
                                                </ListItemIcon>
                                                <ListItemText primary="Expenses" />
                                            </ListItemButton>
                                        </ListItem>
                                    </Link>

                                    <Divider />
                                    <Link href="/reports/summary-report">
                                        <ListItem>
                                            <ListItemText sx={{ textAlign: 'center', color: '#1976d2', textDecoration: 'underline' }} primary="VIEW SUMMARY" />
                                        </ListItem>
                                    </Link>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                <Grid size={{ xs: 12, sm: 8, md: 8 }}>
                    <SalesChart></SalesChart>
                </Grid>

                {(auth.user_role == "admin" || auth.user_role == "super-admin") && (
                    <Summaries></Summaries>
                )}

                {/* <ContactsList /> */}
            </Grid>

            <Box sx={{ justifyContent: 'center', alignItems: 'center', position: 'fixed', backgroundColor: '#c9c9c9', bottom: '2px', right: '6px', padding: '10px', paddingRight: 2 }}>
                <Grid container spacing={1} alignItems={'center'}>
                    <Grid>
                        <a href="/clear-cache" title="Refresh cache">
                            <IconButton>
                                <RefreshIcon />
                            </IconButton>
                        </a>
                    </Grid>
                    <Grid>
                        <a href="/backup-now" title="Backup now" target="_blank">
                            <IconButton>
                                <DatabaseBackup />
                            </IconButton>
                        </a>
                    </Grid>
                    <Grid>
                        <IconButton onClick={() => {
                            const password = prompt("Enter password:");
                            if (password === "infomax2025") {
                                window.location.href = "/update";
                            } else {
                                alert("Wrong password!");
                            }
                        }}>
                            <CloudUploadIcon />
                        </IconButton>
                    </Grid>
                    <Grid>
                        VERSION {version}
                    </Grid>
                </Grid>
            </Box>
        </AuthenticatedLayout>
    );
}
