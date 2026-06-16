import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    Button,
    Box,
    TextField,
    IconButton,
    Chip,
    MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import DeleteIcon from "@mui/icons-material/HighlightOff";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";
import CustomPagination from "@/Components/CustomPagination";

const columns = (handleRowClick) => [
    { field: "id", headerName: "ID", width: 80 },
    {
        field: "employee_id",
        headerName: "Employee",
        width: 200,
        renderCell: (params) => params.row.employee_name,
    },
    {
        field: "salary_date",
        headerName: "Salary Date",
        width: 150,
        renderCell: (params) => dayjs(params.value).format("YYYY-MM-DD"),
    },
    {
        field: "net_salary",
        headerName: "Net Salary",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => numeral(params.value).format("0,0.00"),
    },
    {
        field: "salary_from",
        headerName: "Salary From",
        width: 200,
    },
    {
        field: "store_id",
        headerName: "Store",
        width: 200,
        renderCell: (params) => params.row.store_name,
    },
    {
        field: "action",
        headerName: "Actions",
        width: 150,
        align: "right",
        headerAlign: "right",
        renderCell: (params) => (
            <IconButton
                color="error"
                onClick={() => handleRowClick(params.row, "delete_salary")}
            >
                <DeleteIcon />
            </IconButton>
        ),
    },
];

export default function Payroll({ salaries, employees, stores }) {
    const [dataSalaries, setDataSalaries] = useState(salaries);
    const [selectedSalary, setSelectedSalary] = useState(null);
    const [searchTerms, setSearchTerms] = useState({
        employee_id: "",
        store_id: "",
        start_date: '',
        end_date: '',
    });

    const handleRowClick = (salary, action) => {
        setSelectedSalary(salary);
        if (action === "delete_salary") {
            deleteSalary(salary.id);
        }
    };

    const deleteSalary = (salaryID) => {
        Swal.fire({
            title: "Do you want to remove the record?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`/salary/${salaryID}/delete`)
                    .then((response) => {
                        const updatedData = dataSalaries.data.filter((item) => item.id !== salaryID);
                        setDataSalaries({ ...dataSalaries, data: updatedData });
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
    };

    const refreshSalaries = (url) => {
        const options = {
            preserveState: true,
            preserveScroll: true,
            only: ["salaries"],
            onSuccess: (response) => {
                setDataSalaries(response.props.salaries);
            },
        };
        router.get(url, searchTerms, options);
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        refreshSalaries(window.location.pathname);
    }, [searchTerms]);

    return (
        <AuthenticatedLayout>
            <Head title="Salaries" />
            <Grid container spacing={2} sx={{ alignItems: "center", width: "100%", justifyContent: 'end' }}>

                <Grid size={{ xs: 12, sm: 3 }}>

                    <TextField
                        label="Employee"
                        name="employee_id"
                        value={searchTerms.employee_id}
                        onChange={handleSearchChange}
                        select
                        fullWidth
                    >
                        <MenuItem value="">All Employees</MenuItem>
                        {employees.map((employee) => (
                            <MenuItem key={employee.id} value={employee.id}>
                                {employee.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>

                    <TextField
                        label="Store"
                        name="store_id"
                        value={searchTerms.store_id}
                        onChange={handleSearchChange}
                        select
                        fullWidth
                    >
                        <MenuItem value="">All Stores</MenuItem>
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
                        onChange={handleSearchChange}
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
                        onChange={handleSearchChange}
                        required
                    />
                </Grid>
            </Grid>

            <Box className="py-6 w-full" sx={{ display: "grid", height: "calc(100vh - 190px)", }}>
                <DataGrid
                    rows={dataSalaries?.data}
                    columns={columns(handleRowClick)}
                    hideFooter
                />
            </Box>
            <Grid container sx={{ justifyContent: "end" }}>
                <CustomPagination
                    refreshTable={refreshSalaries}
                    setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataSalaries}
                />
            </Grid>
        </AuthenticatedLayout>
    );
}
