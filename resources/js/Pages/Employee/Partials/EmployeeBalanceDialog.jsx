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

const getInitialFormData = (employee) => ({
    employee_id: employee?.id || "",
    amount: "",
    description: 'Pending Salary',         // Default to 'Pending Salary'
    select_description: 'Pending Salary',  // Default to 'Pending Salary'
    store_id: employee?.store_id || 1, // Default to employee's store_id or 1
    log_date:dayjs().format("YYYY-MM-DD")
});

export default function EmployeeBalanceDialog({ open, setOpen, employee, stores, refreshEmployees, }) {
    const [formData, setFormData] = useState(getInitialFormData(employee));

    const handleChange = (event) => {
        const { name, value } = event.target;
       // Update state
       setFormData((prevState) => {
        // Synchronize 'description' with 'select_description' if 'select_description' changes
        if (name === 'select_description') {
            return {
                ...prevState,
                [name]: value,
                description: value === 'Other' ? '' : value,
                amount: value === 'Deduct Balance' && prevState.amount > 0 
                        ? -prevState.amount // Convert positive amount to negative
                        : prevState.amount
            };
        }

        if (name === 'amount') {
            let newAmount = parseFloat(value) || ""; // Convert to number or keep empty
            if (formData.select_description === 'Deduct Balance' && newAmount > 0) {
                newAmount = -newAmount; // Force negative if Deduct Salary is selected
            }
            return {
                ...prevState,
                [name]: newAmount
            };
        }
        // Otherwise, just update the specific field
        return {
            ...prevState,
            [name]: value
        };
    });
    };

    const handleClose = () => {
        setFormData(getInitialFormData(employee))
        setOpen(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(submittedFormData.entries());

        axios
            .post("/employee-balance", formJson) // Update your API endpoint here
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: true,
                });
                setOpen(false);
                handleClose()
                refreshEmployees(window.location.pathname)
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
                ...prevData,
                employee_id: employee.id,
                store_id: employee.store_id || 1,
            }));
        }
    }, [employee]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slotProps={{
                paper: {
                    component: "form",
                    onSubmit: handleSubmit,
                }
            }}
        >
            <DialogTitle>Employee Balance Update</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {/* Hidden Inputs */}
                    <input type="hidden" name="employee_id" value={formData.employee_id} />
                    <input type="hidden" name="store_id" value={formData.store_id} />

                    {/* Amount Field */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            id="amount"
                            name="amount"
                            label="Amount"
                            type="number"
                            variant="outlined"
                            required
                            value={formData.amount}
                            onChange={handleChange}
                            autoFocus
                        />
                    </Grid>

                    {/* Log Date */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="log_date"
                            label="Date"
                            type="date"
                            required
                            value={formData.log_date}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="select_description"
                            label="Description"
                            select
                            required
                            value={formData.select_description}
                            onChange={handleChange}
                        >
                                <MenuItem value={'Pending Salary'}> Pending Salary </MenuItem>
                                <MenuItem value={'Deduct Balance'}> Deduct Balance </MenuItem>
                                <MenuItem value={'Other'}> Other </MenuItem>
                        </TextField>
                    </Grid>

                    {/* Reason Field */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            name="description"
                            label="Description"
                            type="text"
                            variant="outlined"
                            required
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Store Selection */}
                    <Grid size={{ xs: 12, sm: 12 }}>
                        <TextField
                            fullWidth
                            id="store_id"
                            name="store_id"
                            label="Store"
                            select
                            required
                            value={formData.store_id}
                            onChange={handleChange}
                        >
                            {stores?.map((store) => (
                                <MenuItem key={store.id} value={store.id}>
                                    {store.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit">SAVE</Button>
            </DialogActions>
        </Dialog>
    );
}
