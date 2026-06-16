import React, { useState, useContext, useEffect } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {
    IconButton,
    TextField,
     Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InputAdornment from "@mui/material/InputAdornment";
import Swal from "sweetalert2";

import { usePurchase } from "@/Context/PurchaseContext";

export default function AddToPurchase({
    product,
    addToPurchaseOpen,
    setAddToPurchaseOpen,
}) {
    const { addToCart } = usePurchase();
    const [isSelectBatch, setIsSelectBatch] = useState(true);
    const [loading, setLoading] = useState(false)
    const [formState, setFormState] = useState([]);

    const handleClose = () => {
        setFormState([])
        setAddToPurchaseOpen(false);
    };

    const handleAddToCartSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;
        setLoading(true);

        let url='/checkBatch';

        axios
        .post(url, formState)
        .then((resp) => {
            if(resp.data.status=='invalid'){
                // setFormState((prevState) => ({
                //     ...prevState, // Keep the existing formState properties
                //     batch_number: '', // Add or update the status property
                // }));

                Swal.fire({
                    title: resp.data.message,
                    text: 'New Batch',
                    icon: "warning",
                });
            }
            else{

                const responseStatus = resp.data.status;
            setFormState((prevState) => ({
                ...prevState, // Keep the existing formState properties
                status: responseStatus, // Add or update the status property
            }));

                Swal.fire({
                    title: "Success!",
                    text: resp.data.message,
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                    toast: true,
                    position:'bottom-end'
                });

                addToCart({ ...formState, status: responseStatus }, formState.quantity);
                handleClose()
            }
        })
        .catch((error) => {
            const errorMessages = Object.values(error.response.data.errors).flat().join(' | ');
            Swal.fire({
                title: "Failed!",
                text: errorMessages,
                icon: "error",
                showConfirmButton: true,
            });
            console.error(error);
        }).finally(() => {
            setLoading(false); // Reset submitting state
        });
        // addToCart(formState,formState.quantity)
        // setLoading(false);
        // handleClose()
    };

    // Update selectedBatch when products change
    useEffect(() => {
       if (product) {
            const copyProduct = { ...product };
            if(copyProduct.product_type==='custom') copyProduct.name='';
            copyProduct.quantity = ''
            // If products is a single object, select that batch
            setFormState(copyProduct);
        }

    }, [product]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;        

        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    return (
        <React.Fragment>
            <Dialog
                fullWidth={true}
                maxWidth={"sm"}
                open={addToPurchaseOpen}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                slotProps={{
                    paper: {
                        component: "form",
                        onSubmit: handleAddToCartSubmit,
                    }
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {formState.name}
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
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="quantity"
                                label="Quantity"
                                variant="outlined"
                                autoFocus
                                value={formState.quantity}
                                onChange={handleInputChange}
                                sx={{
                                    input: { fontSize: "1rem" },
                                }}
                                required
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        // startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                        {product.product_type !== "custom" && (
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label={"Batch"}
                                    value={formState.batch_number}
                                    required
                                    name="batch_number"
                                    onChange={handleInputChange}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                        input: {
                                            sx: { pr: "12px !important" },
                                        },
                                    }}
                                    onFocus={(event) => {
                                        event.target.select();
                                    }}
                                />
                            </Grid>
                        )}
                        {product.product_type === "custom" && (
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    label={"Description"}
                                    name={'name'}
                                    value={formState.name}
                                    required
                                    onChange={handleInputChange}
                                    slotProps={{
                                        inputLabel: {
                                            shrink: true,
                                        },
                                        input: {
                                            sx: { pr: "12px !important" },
                                        },
                                    }}
                                />
                            </Grid>
                        )}
                        
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="cost"
                                label="Cost"
                                variant="outlined"
                                required
                                value={formState.cost}
                                onChange={handleInputChange}
                                sx={{
                                    input: { fontSize: "1rem" },
                                }}
                                onFocus={(event) => {
                                    event.target.select();
                                }}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                    input: {
                                        // startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="price"
                                label="Price"
                                variant="outlined"
                                required
                                value={formState.price}
                                onChange={handleInputChange}
                                sx={{
                                    input: { fontSize: "1rem" },
                                }}
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
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ paddingY: "10px", fontSize: "1.2rem" }}
                        type="submit"
                        // onClick={handleClose}
                        disabled={loading}
                    >
                        ADD TO CART
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}
