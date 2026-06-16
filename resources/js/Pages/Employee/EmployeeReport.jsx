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

export default function EmployeeReport({
    employees,
    report,
    employee,
}) {
    const [dataReport, setDataReport] = useState(report);

    const [searchTerms, setSearchTerms] = useState({
        start_date: dayjs().startOf("month").format("YYYY-MM-DD"),
        end_date: dayjs().format("YYYY-MM-DD"),
        employee: employee.id,
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
            only: ["report", "employee"], // Only reload specified properties
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
        { label: "SALARY", align: "right", sx: {} },
        { label: "SETTLED", align: "right", sx: {} },
    ];

    const initialTotals = {
        totalSalary: 0, // Total salary of the employee
        totalSettled: 0, // Total settled from the employee's salary
        totalBalance: 0, // Total balance (calculated as salary - settled)
    };

    const totals =
        dataReport && dataReport.length > 0
            ? dataReport.reduce((acc, row) => {
                  const salary = parseFloat(row.salary) || 0; // Salary
                  const settled = parseFloat(row.settled) || 0; // Settled

                  acc.totalSalary += salary; // Add to total salary
                  acc.totalSettled += settled; // Add to total settled
                  acc.totalBalance += salary - settled; // Calculate balance (salary - settled)

                  return acc;
              }, initialTotals)
            : initialTotals;

    return (
        <AuthenticatedLayout>
            <Head title="Salary Log" />
            <Grid
                container
                spacing={2}
                sx={{ alignItems: "center", width: "100%", mt: "1rem", justifyContent: "center" }}
                size={12}
            >
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <TextField
                        label="Employee"
                        name="employee"
                        fullWidth
                        select
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        value={searchTerms.employee}
                        onChange={handleFieldChange}
                        required
                    >
                        {employees.map((emp) => (
                            <MenuItem key={emp.id} value={emp.id}>
                                {emp.name}
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
                            Name: {employee.name}
                            <br />
                            Balance {numeral(employee.balance).format("0,00.00")}
                        </strong>
                    </Alert>
                </Box>
            </Grid>

            <Grid
                container
                sx={{ width: "100%", justifyContent: "center", mt: 2 }}
            >
                <Paper sx={{ width: { xs: '94vw', sm: '100%' }, overflow: 'hidden', maxWidth: '700px' }}>
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
                                            sx={{ ...header.sx, whiteSpace: 'nowrap' }}
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
                                            <StyledTableCell component="th" scope="row" align="left">
                                                {index + 1}
                                            </StyledTableCell>

                                            <StyledTableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                                                {row.log_date}
                                            </StyledTableCell>

                                            <StyledTableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                                                {row.description}
                                            </StyledTableCell>

                                            <StyledTableCell align="right">
                                                {numeral(row.salary).format("0,0.00")}
                                            </StyledTableCell>

                                            <StyledTableCell align="right">
                                                {numeral(row.settled).format("0,0.00")}
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

                                    <StyledTableCell
                                        align="right"
                                        sx={{
                                            backgroundColor: "#295F98",
                                            color: "white",
                                        }}
                                    >
                                        <strong>{numeral(totals.totalSalary).format("0,0.00")}</strong>
                                    </StyledTableCell>

                                    <StyledTableCell
                                        align="right"
                                        sx={{
                                            backgroundColor: "#295F98",
                                            color: "white",
                                        }}
                                    >
                                        <strong>{numeral(totals.totalSettled).format("0,0.00")}</strong>
                                    </StyledTableCell>
                                </StyledTableRow>

                                <StyledTableRow>
                                    <StyledTableCell colSpan={5} align="right"></StyledTableCell>
                                </StyledTableRow>

                                <StyledTableRow>
                                    <StyledTableCell colSpan={4} align="right">
                                        Balance:
                                    </StyledTableCell>
                                    <StyledTableCell
                                        align="right"
                                        sx={{
                                            backgroundColor:
                                                totals.totalBalance > 0
                                                    ? "green"
                                                    : totals.totalBalance < 0
                                                    ? "red"
                                                    : "gray",
                                            color: "white",
                                        }}
                                    >
                                        <strong>{numeral(totals.totalBalance).format("0,0.00")}</strong>
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
