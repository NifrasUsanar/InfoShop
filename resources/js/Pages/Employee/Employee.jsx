import * as React from "react";
import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import Grid from "@mui/material/Grid";
import {
    Button,
    Box,
    TextField,
    IconButton,
    Chip,
} from "@mui/material";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/HighlightOff';
import dayjs from "dayjs";
import Swal from "sweetalert2";
import axios from "axios";
import numeral from "numeral";

import { DataGrid } from "@mui/x-data-grid";
import CustomPagination from "@/Components/CustomPagination";
import EmployeeDialog from "./Partials/EmployeeDialog";
import SalaryFormDialog from "./Partials/SalaryFormDialog";
import EmployeeBalanceDialog from "./Partials/EmployeeBalanceDialog";
import PrintIcon from "@mui/icons-material/Print";
import { data } from "autoprefixer";

const columns = (handleRowClick) => [
    { field: "id", headerName: "ID", width: 80 },
    {
        field: "name",
        headerName: "Name",
        width: 200,
        renderCell: (params) => (
            <Link underline="hover" href='#' className='hover:underline' onClick={(event) => { event.preventDefault(); handleRowClick(params.row, 'employee_edit'); }}>
                <p className='font-bold'>{params.value}</p>
            </Link>
        ),
    },
    {
        field: "contact_number",
        headerName: "Contact Number",
        width: 150,
    },
    {
        field: "address",
        headerName: "Address",
        width: 300,
    },
    {
        field: "joined_at",
        headerName: "Joined At",
        width: 120,
        renderCell: (params) => {
            return dayjs(params.value).format("YYYY-MM-DD");
        },
    },
    {
        field: "salary",
        headerName: "Salary",
        width: 180,
        align: 'right', headerAlign: 'right',

        renderCell: (params) => (
            <Button
                onClick={() => handleRowClick(params.row, 'add_salary')}
                variant="text"
                fullWidth
                sx={{
                    textAlign: "left",
                    fontWeight: "bold",
                    justifyContent: "flex-end",
                }}
            >
                {numeral(params.value).format('0,0.00') + ' / ' + params.row.salary_frequency}
            </Button>
        ),
    },
    {
        field: "balance",
        headerName: "Balance",
        width: 120,
        align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <Button
                onClick={() => handleRowClick(params.row, 'update_balance')}
                variant="text"
                fullWidth
                sx={{
                    textAlign: "left",
                    fontWeight: "bold",
                    justifyContent: "flex-end",
                }}
            >
                {numeral(params.value).format('0,0.00')}
            </Button>
        ),
    },
    {
        field: "role",
        headerName: "Role",
        width: 120,
    },
    {
        field: "status",
        headerName: "Status",
        width: 120,
    },
    {
        field: 'action',
        headerName: 'Actions',
        width: 150, align: 'right', headerAlign: 'right',
        renderCell: (params) => (
            <>
            <Link href={"/employee-balance-log?employee=" + params.row.id}>
            <IconButton sx={{ ml: '0.3rem' }} color="primary">
                    <PrintIcon />
                </IconButton>
            </Link>
                
                <IconButton sx={{ ml: '0.3rem' }} color="error" onClick={() => handleRowClick(params.row, "delete_employee")}>
                    <DeleteIcon />
                </IconButton>
            </>
        ),
    },
];

export default function Employee({ employees, stores, }) {
    const [dataEmployees, setDataEmployees] = useState(employees);
    const [totalEmployees, setTotalEmployees] = useState(0)
    const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
    const [salaryModalOpen, setSalaryModalOpen] = useState(false)
    const [balanceModalOpen, setBalanceModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState(0)

    const [searchTerms, setSearchTerms] = useState({
        start_date: '',
        end_date: '',
        role: '',
        search_query: "",
    });

    const handleRowClick = (employee, action) => {
        setSelectedEmployee(employee);
        if (action == 'employee_edit') {
            setEmployeeModalOpen(true);
        }
        else if (action == "update_balance") {
            setBalanceModalOpen(true)
        }
        else if (action === 'delete_employee') {
            deleteEmployee(employee.id);
        }
        else if (action == "add_salary") {
            setSalaryModalOpen(true)
        }
    };

    const deleteEmployee = (employeeID) => {
        Swal.fire({
            title: "Do you want to remove the record?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post(`/employee/${employeeID}/delete`)
                    .then((response) => {
                        const updatedData = dataEmployees.data.filter((item) => item.id !== employeeID);
                        setDataEmployees({ ...dataEmployees, data: updatedData });
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

    const refreshEmployees = (url) => {
        const options = {
            preserveState: true, // ```jsx
            preserveScroll: true, // Preserves the current scroll position
            only: ["employees"], // Only reload specified properties
            onSuccess: (response) => {
                setDataEmployees(response.props.employees);
            },
        };
        router.get(url, searchTerms, options);
    };

    //Get total employees
    useEffect(() => {
        const total = Object.values(dataEmployees.data).reduce((accumulator, current) => {
            return accumulator + parseFloat(current.balance);
        }, 0);
        setTotalEmployees(total);
    }, [dataEmployees]);

    useEffect(() => {
                refreshEmployees(window.location.pathname);
            }, [searchTerms]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms((prev) => ({ ...prev, [name]: value }));
    };

    const handleEmployeeClickOpen = () => {
        setSelectedEmployee(null);
        setEmployeeModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employees" />
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
                <Grid size={{ xs: 8, sm: 3 }}>
                    <Button
                        variant="contained"
                        onClick={() => handleEmployeeClickOpen()}
                        sx={{ height: "100%" }}
                        startIcon={<AddCircleIcon />}
                        size="large"
                        fullWidth
                        color="success"
                    >
                        ADD EMPLOYEE
                    </Button>
                </Grid>
            </Grid>

            <Box
                className="py-6 w-full"
                sx={{ display: "grid", gridTemplateColumns: "1fr", height: "calc(100vh - 200px)", }}
            >
                <DataGrid
                    rows={dataEmployees?.data}
                    columns={columns(handleRowClick)}
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                // Hide columns status and traderName, the other columns will remain visible
                                address: false,
                                email: false,
                                created_at: false,
                                joined_at: false,
                            },
                        },
                    }}
                    hideFooter
                />
            </Box>
            <Grid size={12} container spacing={2} sx={{ justifyContent: "end", alignItems: "center" }}>
                <Chip size="large" label={'Total Balance:' + numeral(totalEmployees).format('0,0')} color="primary" />
                <CustomPagination
                    refreshTable={refreshEmployees}
                   setSearchTerms={setSearchTerms}
                    searchTerms={searchTerms}
                    data={dataEmployees}
                ></CustomPagination>
            </Grid>

            <EmployeeDialog
                open={employeeModalOpen}
                setOpen={setEmployeeModalOpen}
                employee={selectedEmployee}
                stores={stores}
                refreshEmployees={refreshEmployees}
            />
            {selectedEmployee ? (
                <>
                    <SalaryFormDialog
                        open={salaryModalOpen}
                        employee={selectedEmployee}
                        stores={stores}
                        refreshEmployees={refreshEmployees}
                        setOpen={setSalaryModalOpen}
                    />

                    <EmployeeBalanceDialog
                        open={balanceModalOpen}
                        employee={selectedEmployee}
                        stores={stores}
                        refreshEmployees={refreshEmployees}
                        setOpen={setBalanceModalOpen}
                    />

                </>
            ) : null}
        </AuthenticatedLayout>
    );
}
