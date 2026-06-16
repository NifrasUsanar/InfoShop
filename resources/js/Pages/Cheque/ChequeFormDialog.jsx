import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
     Grid,
    Divider,
    MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";
import dayjs from "dayjs";

const initialChequeFormState = {
    cheque_number: '',
    cheque_date: dayjs().format("YYYY-MM-DD"),
    name: '',
    amount: 0,
    issued_date: dayjs().format("YYYY-MM-DD"),
    bank: '',
    status: 'pending',
    remark: '',
    direction: 'issued',
    store_id: 1
};

export default function ChequeFormDialog({
    open,
    setOpen,
    stores,
    refreshCheques,
    selectedCheque
}) {

    const [chequeForm, setChequeFormState] = useState(initialChequeFormState);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setChequeFormState({
            ...chequeForm,
            [name]: value,
        });
    };

    useEffect(() => {
        if (selectedCheque) {
            setChequeFormState({
                cheque_number: selectedCheque.cheque_number || '',
                cheque_date: selectedCheque.cheque_date || dayjs().format("YYYY-MM-DD"),
                name: selectedCheque.name || '',
                amount: selectedCheque.amount || 0,
                issued_date: selectedCheque.issued_date || dayjs().format("YYYY-MM-DD"),
                bank: selectedCheque.bank || '',
                status: selectedCheque.status || 'pending',
                remark: selectedCheque.remark || '',
                direction: selectedCheque.direction || 'issued',
                store_id: selectedCheque.store_id || 1
            });
        }
        else {
            setChequeFormState(initialChequeFormState);
        }
    }, [selectedCheque]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        const url = selectedCheque ? `/cheques/${selectedCheque.id}/update` : '/cheques/store';

        axios
            .post(url, formJson)
            .then((resp) => {
                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                refreshCheques(window.location.pathname)
                setOpen(false)
            })
            .catch((error) => {
                console.error("Submission failed with errors:", error);
                console.log(formJson);
            });
    };

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"sm"}
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleSubmit,
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {selectedCheque ? "EDIT CHEQUE" : "ADD CHEQUE"}
                </DialogTitle>
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
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                name="cheque_number"
                                label="Cheque Number"
                                variant="outlined"
                                value={chequeForm.cheque_number}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                name="name"
                                label="Name"
                                variant="outlined"
                                value={chequeForm.name}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                type="number"
                                name="amount"
                                label="Amount"
                                variant="outlined"
                                value={chequeForm.amount}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                name="bank"
                                label="Bank"
                                variant="outlined"
                                value={chequeForm.bank}
                                onChange={handleFieldChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Cheque Date"
                                name="cheque_date"
                                fullWidth
                                type="date"
                                value={chequeForm.cheque_date}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Issued Date"
                                name="issued_date"
                                fullWidth
                                type="date"
                                value={chequeForm.issued_date}
                                onChange={handleFieldChange}
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Status"
                                name="status"
                                fullWidth
                                select
                                value={chequeForm.status}
                                onChange={handleFieldChange}
                                required
                            >
                                <MenuItem value={"pending"}>Pending</MenuItem>
                                <MenuItem value={"completed"}>Completed</MenuItem>
                                <MenuItem value={"bounced"}>Bounced</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                name="direction"
                                label="Direction"
                                select
                                value={chequeForm.direction}
                                onChange={handleFieldChange}
                                required
                            >
                                <MenuItem value={"issued"}>Issued</MenuItem>
                                <MenuItem value={"received"}>Received</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label="Remark"
                                name="remark"
                                value={chequeForm.remark}
                                onChange={handleFieldChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <TextField
                                value={chequeForm.store_id}
                                label="Store"
                                fullWidth
                                onChange={handleFieldChange}
                                required
                                name="store_id"
                                select
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

                    <Divider sx={{ py: "0.5rem" }}></Divider>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "15px", fontSize: "1.5rem" }}
                        type="submit"
                        disabled={chequeForm.amount == 0}
                    >
                        {selectedCheque ? "UPDATE CHEQUE" : "ADD CHEQUE"}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
