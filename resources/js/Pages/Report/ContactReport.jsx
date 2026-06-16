import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import { Button, Box, TextField, MenuItem, Table, TableBody, TableContainer, TableHead, TableRow, Paper, Alert } from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import dayjs from "dayjs";
import numeral from "numeral";

import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
        border: 0,
    },
    "& td, & th": {
        padding: "10px 5px", // Reduce padding on the rows
    },
}));

export default function ContactReport({
    stores,
    report,
    contacts,
    type,
    contact,
}) {
    const [dataReport, setDataReport] = useState(report);

    const [searchTerms, setSearchTerms] = useState({
        start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
        end_date: dayjs().format("YYYY-MM-DD"),
        store: 0,
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
        router.get(url, searchTerms, options);
    };

    const headers = [
        { label: "#", align: "left", sx: {} },
        { label: "DATE", align: "left", sx: { width: "120px" } },
        { label: "DESCRIPTION", align: "left", sx: {} },
        { label: "DEBIT (OWED)", align: "right", sx: {} },
        { label: "CREDIT(PAID)", align: "right", sx: {} },
    ];

    const initialTotals = {
        totalDebit: 0, // Total amount owed by the customer (DEBIT)
        totalCredit: 0, // Total amount paid by the customer (CREDIT)
        totalBalance: 0, // Total balance (calculated as owed - paid)
    };

    const totals =
        dataReport && dataReport.length > 0
            ? dataReport.reduce((acc, row) => {
                  const debit = parseFloat(row.debit) || 0; // DEBIT (Amount Owed)
                  const credit = parseFloat(row.credit) || 0; // CREDIT (Amount Paid)

                  acc.totalDebit += debit; // Add to total debit (amount owed)
                  acc.totalCredit += credit; // Add to total credit (amount paid)
                  acc.totalBalance += debit - credit; // Calculate balance (amount owed - amount paid)

                  return acc;
              }, initialTotals)
            : initialTotals;

    return (
        <AuthenticatedLayout>
            <Head title="Contact Report" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%", mt: "1rem", justifyContent: "center" }}
                size={12}
            >
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
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
                        <MenuItem value={0}>All</MenuItem>
                        {stores.map((store) => (
                            <MenuItem key={store.id} value={store.id}>
                                {store.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
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
                <Grid size={{ xs: 6, sm: 2 }}>
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

                <Grid size={{ xs: 12, sm: 2 }}>
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

            <Grid
                container
                sx={{ justifyContent: "center", width: "100%", mt: 2 }}
                spacing={2}
            >
                <Box
                    sx={{
                        maxWidth: "700px",
                        display: "flex",
                        justifyContent: "center",
                        width: "100%",
                    }}
                >
                    <Alert sx={{ width: "100%" }} severity="info" icon={false}>
                        <strong>
                            Name: {contact.name}
                            <br />
                            Balance {numeral(contact.balance).format("0,00.00")}
                        </strong>
                    </Alert>
                </Box>
            </Grid>

            <Grid
                container
                sx={{ width: "100%", justifyContent: "center", mt: 2 }}
            >

<Paper sx={{ width:{xs:'94vw', sm:'100%'}, overflow: 'hidden', maxWidth:'700px' }} >
    
                <TableContainer
                    component={Paper}
                    sx={{
                        width: "100%",
                        maxWidth: { sm: "750px" },
                        overflow: "auto",
                    }}
                >
                    <Table aria-label="customized table">
                        <TableHead>
                            <TableRow>
                                {headers.map((header, index) => (
                                    <StyledTableCell
                                        key={index}
                                        align={header.align}
                                        sx={{...header.sx, whiteSpace:'nowrap'}}
                                    >
                                        {header.label}
                                    </StyledTableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dataReport && dataReport.length > 0 ? (
                                dataReport.map((row, index) => (
                                    <StyledTableRow key={index}>
                                        {/* Display the index in the first column */}
                                        <StyledTableCell
                                            component="th"
                                            scope="row"
                                            align="left"
                                        >
                                            {index + 1}
                                        </StyledTableCell>

                                        {/* Display the date in the second column */}
                                        <StyledTableCell align="left" sx={{whiteSpace:'nowrap'}}>
                                            {row.date} {/* Display the date */}
                                        </StyledTableCell>

                                        {/* Display the description in the third column */}
                                        <StyledTableCell align="left" sx={{whiteSpace:'nowrap'}}>
                                            {row.description}{" "}
                                            {/* Display the description */}
                                        </StyledTableCell>

                                        {/* Display the debit (amount owed) in the fourth column */}
                                        <StyledTableCell align="right">
                                            {numeral(row.debit).format(
                                                "0,0.00"
                                            )}{" "}
                                            {/* Format debit */}
                                        </StyledTableCell>

                                        {/* Display the credit (amount paid) in the fifth column */}
                                        <StyledTableCell align="right">
                                            {numeral(row.credit).format(
                                                "0,0.00"
                                            )}{" "}
                                            {/* Format credit */}
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))
                            ) : (
                                <StyledTableRow>
                                    <StyledTableCell colSpan={6} align="center">
                                        No data available
                                    </StyledTableCell>
                                </StyledTableRow>
                            )}

                            <StyledTableRow sx={{ backgroundColor: "black" }}>
                                <StyledTableCell colSpan={3} align="right">
                                    <strong>Total:</strong>
                                </StyledTableCell>

                                {/* Total Debit */}
                                <StyledTableCell
                                    align="right"
                                    sx={{
                                        backgroundColor: "#295F98", // Conditional color
                                        color: "white", // Text color for contrast
                                    }}
                                >
                                    <strong>
                                        {numeral(totals.totalDebit).format(
                                            "0,0.00"
                                        )}
                                    </strong>
                                </StyledTableCell>

                                {/* Total Credit */}
                                <StyledTableCell
                                    align="right"
                                    sx={{
                                        backgroundColor: "#295F98", // Conditional color
                                        color: "white", // Text color for contrast
                                    }}
                                >
                                    <strong>
                                        {numeral(totals.totalCredit).format(
                                            "0,0.00"
                                        )}
                                    </strong>
                                </StyledTableCell>
                            </StyledTableRow>

                            <StyledTableRow>
                                <StyledTableCell
                                    colSpan={5}
                                    align="right"
                                ></StyledTableCell>
                            </StyledTableRow>

                            {/* Row for Balance/Receivable */}
                            <StyledTableRow>
                                <StyledTableCell colSpan={4} align="right">
                                    {type === "vendor"
                                        ? "Balance/To be paid:"
                                        : "Balance/Receivable:"}
                                </StyledTableCell>
                                <StyledTableCell
                                    align="right"
                                    sx={{
                                        backgroundColor:
                                            totals.totalBalance > 0
                                                ? "red"
                                                : totals.totalBalance < 0
                                                ? "green"
                                                : "gray", // Conditional color
                                        color: "white", // Text color for contrast
                                    }}
                                >
                                    <strong>
                                        {numeral(totals.totalBalance).format(
                                            "0,0.00"
                                        )}
                                    </strong>
                                </StyledTableCell>
                            </StyledTableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                </Paper>
            </Grid>
        </AuthenticatedLayout>
    );
}
