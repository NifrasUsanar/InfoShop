import React, { useState, useContext, useMemo } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
    Grid2 as Grid,
    Divider,
    MenuItem,
    FormControlLabel,
    Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Swal from "sweetalert2";

const initialFormState = {
    name: "",
    type: 'Tax',
    rate: '',
    is_percentage: true
};

export default function TaxAndFeeDialog({
    open,
    setOpen,
    refreshTaxesAndFees
}) {

    const [taxAndFeeForm, setPaymentFormState] = useState(initialFormState);

    const handleClose = () => {
        setOpen(false);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setPaymentFormState({
            ...taxAndFeeForm,
            [name]: value,
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const submittedFormData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(submittedFormData.entries());

        let url = '/taxes-and-fees';

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
                refreshTaxesAndFees(window.location.pathname)
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
                PaperProps={{
                    component: "form",
                    onSubmit: handleSubmit,
                }}
            >
                <DialogTitle id="alert-dialog-title">TAX AND FEE</DialogTitle>
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
                    <Grid container size={{ xs: 12, sm: 12 }} spacing={2}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                label={"Name"}
                                name="name"
                                placeholder="Name"
                                value={taxAndFeeForm.note}
                                onChange={handleFieldChange}
                                required
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Type"
                                name="type"
                                fullWidth
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                                value={taxAndFeeForm.type}
                                onChange={handleFieldChange}
                                required
                                select
                            >
                                <MenuItem value={"Tax"}>
                                    Tax
                                </MenuItem>
                                <MenuItem value={"Fee"}>Fee</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                name="rate"
                                label="Rate"
                                variant="outlined"
                                autoFocus
                                required
                                value={taxAndFeeForm.rate}
                                onChange={handleFieldChange}
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 4 }} display={'flex'}>
                            <FormControlLabel
                                control={<Switch defaultChecked={taxAndFeeForm.is_percentage} />}
                                label="Is percentage?"
                                name="is_percentage"
                                onChange={handleFieldChange}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ py: "0.5rem" }}></Divider>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "8px", fontSize: "1.2rem" }}
                        type="submit"
                        disabled={taxAndFeeForm.rate == 0}
                    >
                        UPDATE
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
