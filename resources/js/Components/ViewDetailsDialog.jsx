import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    Table, TableHead, TableBody, TableRow, TableCell,
    Box, Typography, Card, CardContent,  Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import dayjs from "dayjs";
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentsIcon from '@mui/icons-material/Payments';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { useCurrencyFormatter } from '@/lib/currencyFormatter';

export default function ViewDetailsDialog({
    open,
    setOpen,
    selectedTransaction = null,
    type = 'sale',
}) {
    const formatCurrency = useCurrencyFormatter();
    const [tabValue, setTabValue] = React.useState(0);
    const [details, setDetails] = useState([]);

    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Custom TabPanel component
    const TabPanel = ({ children, value, index }) => {
        return value === index ? <Box sx={{ padding: 0 }}>{children}</Box> : null;
    };

    const [payments, setPayments] = useState([]);
    const [items, setItems] = useState([]);

    const handleClose = () => {
        setOpen(false);
    };

    const fetchDetails = async (type) => {
        try {
            const transactionType = type === 'sales' ? 'sale' : type;
            const response = await axios.post(`/getorderdetails/${transactionType}`, { transaction_id: selectedTransaction });
            setPayments(response.data.payments);
            setItems(response.data.items);
            setDetails(response.data.details)
        } catch (error) {
            console.error('Error fetching payments: ', error);
        }
    };

    const handleDeletePayment = async (paymentId) => {
        Swal.fire({
            title: "Do you want to remove the payment?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`/delete-payment/${type}`, { transaction_id: paymentId })
                    .then((response) => {
                        const updatedData = payments.filter((item) => item.id !== paymentId);
                        setPayments(updatedData);
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
                        Swal.fire({ title: error.response.data.error, showConfirmButton: true, icon: "error", })
                        console.error("Deletion failed with errors:", error);
                    });
            }
        });
    }

    useEffect(() => {
        if (open) {
            fetchDetails(type);
        }
    }, [open]);

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"md"}
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
            >
                <DialogTitle id="alert-dialog-title">VIEW DETAILS</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={(theme) => ({
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent sx={{ paddingY: '5px' }}>
                    <Table size="large">
                        <TableBody>
                            <TableRow>
                                <TableCell align="left">Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">{type === 'sales' || type === 'sale' ? dayjs(details.sale_date).format('DD-MM-YYYY') : dayjs(details.purchase_date).format('DD-MM-YYYY')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="left">Contact Name</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{details.contact_name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="left">Total</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(details.total_amount, false)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="left">Discount</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(details.discount, false)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell align="left">Created At</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{dayjs(details.created_at).format('DD-MM-YYYY hh:mm A')}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    
                    <Tabs value={tabValue} onChange={handleChange} aria-label="icon label tabs example">
                        <Tab icon={<InventoryIcon />} iconPosition="start" label="ITEMS" />
                        <Tab icon={<PaymentsIcon />} iconPosition="start" label="PAYMENTS" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Discount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(items) &&
                                    items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="whitespace-nowrap" sx={{ whiteSpace: 'nowrap' }}>{item.name} {item.batch_number !== null && ` | ${item.batch_number}`}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(parseFloat(item.unit_price), false)}</TableCell>
                                            <TableCell>{formatCurrency(parseFloat(item.unit_cost), false)}</TableCell>
                                            <TableCell>{formatCurrency(parseFloat(item.discount), false)}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TabPanel>

                    {/* TabPanel for PAYMENTS Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}> Action </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(payments) &&
                                    payments.map((payment, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{payment.amount < 0 ? `${payment.payment_method} Refund` : payment.payment_method}</TableCell>
                                            <TableCell>{payment.payment_method === 'Credit' ? `- ${payment.amount}` : payment.amount}</TableCell>
                                            <TableCell>{payment.transaction_date}</TableCell>
                                            <TableCell align="left">
                                                {!payment.parent_id && payment.payment_method !== 'Credit' && (
                                                    <IconButton onClick={() => handleDeletePayment(payment.id)} edge="start" color="error" aria-label="delete">
                                                        <HighlightOffIcon />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TabPanel>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} autoFocus>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
