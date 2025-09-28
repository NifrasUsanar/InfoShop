import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, TextField, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import dayjs from "dayjs";
import numeral from "numeral";

import { BarChart } from '@mui/x-charts/BarChart';

export default function SalesReport({ stores, report }) {
    const [dataReport, setDataReport] = useState(report);

    const [searchTerms, setSearchTerms] = useState({
        start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
        end_date: dayjs().format("YYYY-MM-DD"),
        store: 'All',
    });

    const handleFieldChange = ({ target: { name, value } }) => {
        setSearchTerms({
            ...searchTerms,
            [name]: value,
        });
    };

    const refreshReport = (url) => {
        const options = {
            preserveState: true, // Preserves the current component's state
            preserveScroll: true, // Preserves the current scroll position
            only: ["report"], // Only reload specified properties
            onSuccess: (response) => {
                setDataReport(response.props.report);
            },
        };
        router.get(
            url,
            searchTerms,
            options
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Summary Report" />
            <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{ width: "100%", mt: "1rem" }}
                justifyContent={"center"}
                size={12}
            >
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                        label="Store"
                        name="store"
                        fullWidth
                        select
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.store}
                        onChange={handleFieldChange}
                        required
                    >
                        <MenuItem value={'All'}>All</MenuItem>
                        {stores.map((store) => (
                            <MenuItem key={store.id} value={store.id}>
                                {store.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                    <TextField
                        label="Start Date"
                        name="start_date"
                        placeholder="Start Date"
                        fullWidth
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.start_date}
                        onChange={handleFieldChange}
                        required
                    />
                </Grid>

                <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                    <TextField
                        label="End Date"
                        name="end_date"
                        placeholder="End Date"
                        fullWidth
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.end_date}
                        onChange={handleFieldChange}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 2, md: 1 }}>
                    <Button
                        variant="contained"
                        onClick={() => refreshReport(window.location.pathname)}
                        sx={{ height: "100%" }}
                        size="large"
                        fullWidth
                    >
                        <FindReplaceIcon />
                    </Button>
                </Grid>
            </Grid>

            <Grid container width={'100%'} justifyContent={'center'} sx={{ mt: 2 }} spacing={2} alignItems={'stretch'}>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TableContainer component={Paper} sx={{ height: '100%' }}>
                        <Table sx={{ minWidth: 200 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell className="border-none p-4 pl-16" colSpan={2}>
                                        <h2 className="font-bold text-current-color text-xl"><strong>Sales</strong></h2>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" scope="row">
                                        Total Sale
                                        <p className="text-xs text-gray-500">with discount</p>
                                        </TableCell>
                                    <TableCell align="right">
                                        {numeral(Number(report.total_sales)+Number(report.total_discount)).format('0,0.00')}
                                        <p className="text-xs text-red-500">-{numeral(Number(report.total_discount)).format('0,0.00')}</p>
                                        </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">
                                        Total Sale
                                        <p className="text-xs text-gray-500">without discount</p>
                                        </TableCell>
                                    <TableCell align="right">{numeral(report.total_sales).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Received</TableCell>
                                    <TableCell align="right">{numeral(report.total_received).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Profit</TableCell>
                                    <TableCell align="right">{numeral(report.total_profit).format('0,0.00')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TableContainer component={Paper} className="h-full">
                        <Table sx={{ minWidth: 200 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 'none', padding: '0.3rem', paddingLeft: '1rem' }}>
                                        <h2 className="font-bold text-current-color text-xl"><strong>Cash Flow</strong></h2>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" scope="row">Cash Sale</TableCell>
                                    <TableCell align="right">{numeral(report.cash_sale).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Cash Refund</TableCell>
                                    <TableCell align="right">{numeral(report.cash_refund).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Cash Purchase</TableCell>
                                    <TableCell align="right">{numeral(report.cash_purchase).format('0,0.00')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TableContainer component={Paper} className="h-full">
                        <Table sx={{ minWidth: 200 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ border: 'none', padding: '0.3rem', paddingLeft: '1rem' }}>
                                        <h2 className="font-bold text-current-color text-xl"><strong>Profit</strong></h2>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell component="th" scope="row">Gross profit</TableCell>
                                    <TableCell align="right">{numeral(report.total_profit).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Expenses</TableCell>
                                    <TableCell align="right">{numeral(report.total_expenses).format('0,0.00')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell component="th" scope="row">Net profit</TableCell>
                                    <TableCell align="right">{numeral(parseFloat(report.total_profit) - parseFloat(report.total_expenses)).format('0,0.00')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>

            <Grid container width={'100%'} justifyContent={'center'} sx={{ mt: 4 }} spacing={2} alignItems={'stretch'}>
                <BarChart
                    xAxis={[{ scaleType: 'band', data: ['Sales', 'Cash Flow', 'Profit'] }]}
                    series={[
                        { data: [parseFloat(dataReport.total_sales), parseFloat(dataReport.cash_sale), parseFloat(dataReport.total_profit)] },
                        { data: [parseFloat(dataReport.total_received), parseFloat(dataReport.cash_refund), parseFloat(dataReport.total_expenses)] },
                        { data: [parseFloat(dataReport.total_profit), parseFloat(dataReport.cash_purchase), parseFloat(dataReport.total_profit) - parseFloat(dataReport.total_expenses)] },
                    ]}
                    height={300}
                    barLabel={(item) => numeral(item.value).format('0,0')}
                />
            </Grid>

        </AuthenticatedLayout>
    );
}
