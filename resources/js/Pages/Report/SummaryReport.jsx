import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, TextField, MenuItem, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import dayjs from "dayjs";
import numeral from "numeral";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

            {/* Tables and Charts Grid */}
            <Grid container width={'100%'} justifyContent={'center'} spacing={2} sx={{ mt: 2, display: 'flex', alignItems: 'stretch' }}>
                {/* Sales Section */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <TableContainer component={Paper} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

                {/* Cash Flow Section */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <TableContainer component={Paper} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

                {/* Profit Section */}
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <TableContainer component={Paper} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

            {/* Charts Section - Separate Row */}
            <Grid container width={'100%'} justifyContent={'center'} sx={{ mt: 4 }} spacing={2}>
                {/* Sales Chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Chart</CardTitle>
                        </CardHeader>
                        <CardContent sx={{ height: '350px', pt: 3 }}>
                            <ChartContainer config={{ "Total Sales": { color: "var(--chart-1)" }, "Received": { color: "var(--chart-2)" }, "Profit": { color: "var(--chart-3)" } }} className="h-full w-full">
                                <BarChart data={[{ "Total Sales": parseFloat(dataReport.total_sales), "Received": parseFloat(dataReport.total_received), "Profit": parseFloat(dataReport.total_profit) }]} margin={{ top: 20 }}>
                                    <CartesianGrid vertical={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" formatter={(value) => numeral(value).format('0,0.00')} />} />
                                    <Legend verticalAlign="top" height={30} />
                                    <Bar dataKey="Total Sales" fill="var(--chart-1)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Received" fill="var(--chart-2)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Profit" fill="var(--chart-3)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cash Flow Chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Cash Flow Chart</CardTitle>
                        </CardHeader>
                        <CardContent sx={{ height: '350px', pt: 3 }}>
                            <ChartContainer config={{ "Cash Sale": { color: "var(--chart-1)" }, "Cash Refund": { color: "var(--chart-2)" }, "Cash Purchase": { color: "var(--chart-3)" } }} className="h-full w-full">
                                <BarChart data={[{ "Cash Sale": parseFloat(dataReport.cash_sale), "Cash Refund": parseFloat(dataReport.cash_refund), "Cash Purchase": parseFloat(dataReport.cash_purchase) }]} margin={{ top: 20 }}>
                                    <CartesianGrid vertical={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" formatter={(value) => numeral(value).format('0,0.00')} />} />
                                    <Legend verticalAlign="top" height={30} />
                                    <Bar dataKey="Cash Sale" fill="var(--chart-1)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Cash Refund" fill="var(--chart-2)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Cash Purchase" fill="var(--chart-3)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Profit Chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Profit Chart</CardTitle>
                        </CardHeader>
                        <CardContent sx={{ height: '350px', pt: 3 }}>
                            <ChartContainer config={{ "Gross Profit": { color: "var(--chart-1)" }, "Expenses": { color: "var(--chart-2)" }, "Net Profit": { color: "var(--chart-3)" } }} className="h-full w-full">
                                <BarChart data={[{ "Gross Profit": parseFloat(dataReport.total_profit), "Expenses": parseFloat(dataReport.total_expenses), "Net Profit": parseFloat(dataReport.total_profit) - parseFloat(dataReport.total_expenses) }]} margin={{ top: 20 }}>
                                    <CartesianGrid vertical={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" formatter={(value) => numeral(value).format('0,0.00')} />} />
                                    <Legend verticalAlign="top" height={30} />
                                    <Bar dataKey="Gross Profit" fill="var(--chart-1)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Expenses" fill="var(--chart-2)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                    <Bar dataKey="Net Profit" fill="var(--chart-3)" radius={4} label={{ position: 'top', formatter: (value) => numeral(value).format('0,0') }} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>


        </AuthenticatedLayout>
    );
}
