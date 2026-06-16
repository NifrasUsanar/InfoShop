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
import { Button } from "@mui/material";

export default function ReloadFormDialog({ open, setOpen, reloadData, refreshReloads }) {
    const [formData, setFormData] = useState({
        account_number: "",
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
            .post(`/reloads/${reloadData.id}/update`, formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: true,
                });
                setOpen(false);
                refreshReloads(window.location.pathname)
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
        if (reloadData) {
            setFormData({
                account_number: reloadData.account_number || "",
            });
        }
    }, [reloadData]);

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
            <DialogTitle>Edit Account Number</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            id="account_number"
                            name="account_number"
                            label="Account Number"
                            type="text"
                            variant="outlined"
                            required
                            value={formData.account_number}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">SAVE</Button>
            </DialogActions>
        </Dialog>
    );
}
