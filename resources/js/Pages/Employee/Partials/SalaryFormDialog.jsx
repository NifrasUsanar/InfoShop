import * as React from "react";
import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Swal from "sweetalert2";
import axios from "axios";
import dayjs from "dayjs";
import { MenuItem, Button } from "@mui/material";

export default function SalaryFormDialog({ open, setOpen, employee, stores, refreshEmployees }) {
    const [formData, setFormData] = useState({
        employee_id: employee?.id,
        salary_date: dayjs().format("YYYY-MM-DD"),
        net_salary: "",
        salary_from: "Cash Drawer",
        store_id: 1,
        adjusts_balance: 0,
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());
        axios
            .post("/salary-records", formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: true,
                });
                refreshEmployees(window.location.pathname)
                setOpen(false)
            })
            .catch((error) => {
                console.error("Submission failed:", error.response);
                Swal.fire({
                    title: "Error!",
                    text: error.response?.data?.message || "An error occurred while saving.",
                    icon: "error",
                    showConfirmButton: true,
                });
            });
    };

    useEffect(() => {
        if (employee) {
            setFormData((prevData) => ({
                ...prevData, store_id: employee.store_id, employee_id: employee.id, net_salary: employee.balance,
            }))
        }
    }, [employee])

    return (
        <Dialog
            open={open}
            onClose={() => setOpen(false)}
            slotProps={{
                paper: {
                    component: "form",
                    onSubmit: handleSubmit,
                }
            }}
        >
            <DialogTitle>Salary Information</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 2 }}>

                    <input type="hidden" name="employee_id" value={formData.employee_id} />
                    <input type="hidden" name="basic_salary" value={formData.net_salary} />
                    <input type="hidden" name="employee_name" value={employee.name} />
                    <input type="hidden" name="allowances" value={0} />
                    <input type="hidden" name="deductions" value={0} />
                    <input type="hidden" name="gross_salary" value={0} />

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="salary_date"
                            label="Salary Date"
                            type="date"
                            variant="outlined"
                            required
                            value={formData.salary_date}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="net_salary"
                            label="Net Salary"
                            type="number"
                            variant="outlined"
                            required
                            value={formData.net_salary}
                            onChange={handleChange}
                            onFocus={event => {
                                event.target.select();
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="salary_from"
                            label="Salary"
                            variant="outlined"
                            required
                            select
                            value={formData.salary_from}
                            onChange={handleChange}
                        >
                            <MenuItem value={'Cash Drawer'}>Cash Drawer</MenuItem>
                            {/* <MenuItem value={'Pending Salary'}>Pending Salary</MenuItem> */}
                            <MenuItem value={'External'}>External</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="adjusts_balance"
                            label="Adjust Balance"
                            variant="outlined"
                            required
                            select
                            value={formData.adjusts_balance}
                            onChange={handleChange}
                        >
                            <MenuItem value={1}>Yes</MenuItem>
                            <MenuItem value={0}>No</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12 }}>
                        <TextField
                            fullWidth
                            name="remarks"
                            label="Note"
                            type="text"
                            variant="outlined"
                            value={formData.remarks}
                            onChange={handleChange}
                            onFocus={event => {
                                event.target.select();
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12 }}>
                        <TextField
                            value={formData.store_id}
                            label="Store"
                            onChange={handleChange}
                            required
                            name="store_id"
                            select
                            fullWidth
                        >
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
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button fullWidth size="large" variant="contained" type="submit" disabled={!formData.net_salary }>SAVE</Button>
            </DialogActions>
        </Dialog>
    );
}
