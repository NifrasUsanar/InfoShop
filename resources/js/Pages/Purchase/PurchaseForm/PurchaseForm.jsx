import * as React from "react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Button,
    Box,
    Divider,
    Typography,
    Grid2 as Grid,
    InputLabel,
    IconButton,
    Autocomplete,
    TextField,
    Select,
    MenuItem,
    FormControl,
    AppBar,
    Toolbar,
    Breadcrumbs
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import Swal from "sweetalert2";
import SaveIcon from "@mui/icons-material/Save";
import PaymentsIcon from "@mui/icons-material/Payments";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import axios from "axios";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import FormDialog from "@/Pages/Contact/Partial/FormDialog";
import ProductSearch from "./ProductSearch";
import PurchaseCartItems from "./PurchaseCartItems";
import PaymentsCheckoutDialog from "@/Components/PaymentsCheckoutDialog";

import { usePurchase } from "@/Context/PurchaseContext";

export default function PurchaseForm({ vendors, purchase, stores }) {
    const { cartState, cartTotal, totalQuantity, removeFromCart, updateProductQuantity, emptyCart } = usePurchase();
    const [store, setStore] = React.useState("");

    const [open, setOpen] = useState(false);
    const [vendorList, setvendorList] = useState(vendors);
    const [selectedvendor, setSelectedvendor] = useState(null);
    const [openPayment, setOpenPayment] = useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    //   Reload the table after form success
    const handleFormSuccess = (contact) => {
        setvendorList((prevvendors) => {
            // Create the new vendor object
            const newvendor = {
                id: contact.id,
                name: contact.name,
                balance: contact.balance,
            };

            // Update the vendor list
            const updatedvendorList = [...prevvendors, newvendor];

            // Select the newly added vendor directly
            setSelectedvendor(newvendor); // Set selected vendor to the new vendor

            return updatedvendorList; // Return the updated list
        });
    };

    useEffect(() => {
        if (vendorList) {
            const initialvendor = vendorList.find((vendor) => vendor.id === 1);
            setSelectedvendor(initialvendor || null);
        }
    }, [vendors]);

    const handleStoreChange = (event) => {
        setStore(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const submittedFormData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(submittedFormData.entries());
        formJson.cartItems = cartState
        formJson.total_amount = cartTotal
        formJson.amount_paid = cartTotal

        axios.post('/purchase/store', formJson)
        .then((resp) => {
            Swal.fire({
                title: "Success!",
                text: resp.data.message,
                icon: "success",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
            //emptyCart() //Clear the cart from the Context API
            // router.visit('/reciept/'+resp.data.sale_id)      
        })
        .catch((error) => {
            console.error("Submission failed with errors:", error);
            console.log(formJson);
        });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Add Purchase" />
            
                <Box className="mb-10">
                    <Breadcrumbs aria-label="breadcrumb">
                        <Link
                            underline="hover"
                            sx={{ display: "flex", alignItems: "center" }}
                            color="inherit"
                            href="/"
                        >
                            <HomeIcon
                                sx={{ mr: 0.5, mb: "3px" }}
                                fontSize="inherit"
                            />
                            Home
                        </Link>
                        <Link
                            underline="hover"
                            color="inherit"
                            href="/purchases"
                        >
                            Purchases
                        </Link>
                        <Typography sx={{ color: "text.primary" }}>
                            {purchase ? "Edit Product" : "Add Purchase"}
                        </Typography>
                    </Breadcrumbs>
                </Box>

                <form
                id="purchase-form"
                encType="multipart/form-data"
                onSubmit={handleSubmit}
            >

                <Grid container spacing={2}>
                    <Grid size={3}>
                        <FormControl fullWidth>
                            <InputLabel>Store</InputLabel>
                            <Select
                                value={store}
                                label="Store"
                                onChange={handleStoreChange}
                                required
                                name="store_id"
                            >
                                {stores.map((store) => (
                                    <MenuItem key={store.id} value={store.id}>
                                        {store.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={2}>
                        <TextField
                            label="Reference No"
                            name="reference_no"
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid size={3}>
                        <TextField
                            label="Purchase Date"
                            name="purchase_date"
                            placeholder="Purchase Date"
                            fullWidth
                            type="date"
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            defaultValue={
                                new Date().toISOString().split("T")[0]
                            }
                            required
                        />
                    </Grid>
                    <Grid size={4} className="flex items-center">
                        {Array.isArray(vendorList) && (
                            <Autocomplete
                                disablePortal
                                // sx={{width:'300px'}}
                                options={vendorList}
                                fullWidth
                                required
                                value={selectedvendor || null}
                                getOptionKey={(option) => option.id}
                                getOptionLabel={(option) =>
                                    typeof option === "string"
                                        ? option
                                        : option.name +
                                          " | " +
                                          parseFloat(option.balance).toFixed(2)
                                }
                                onChange={(event, newValue) => {
                                    setSelectedvendor(newValue);
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Vendor" />
                                )}
                            />
                        )}
                        <IconButton
                            onClick={() => setOpen(true)}
                            size="large"
                            sx={{
                                ml: "1rem",
                                bgcolor: "success.main",
                                width: "50px",
                                height: "50px",
                                color: "white",
                                "&:hover": {
                                    bgcolor: "success.dark", // Change the background color on hover
                                },
                            }}
                        >
                            <PersonAddIcon fontSize="inherit" />
                        </IconButton>
                        <FormDialog
                            open={open}
                            handleClose={handleClose}
                            onSuccess={handleFormSuccess}
                            contactType={"vendor"}
                        />
                    </Grid>
                </Grid>
                </form>

                <Divider sx={{ my: "1rem" }} />
                <ProductSearch></ProductSearch>
                <Divider sx={{ my: "1rem" }} />
                <PurchaseCartItems/>        

                <AppBar
                    position="fixed"
                    variant="contained"
                    sx={{ top: "auto", bottom: 0 }}
                >
                    <Toolbar>
                        <Box sx={{ flexGrow: 1 }} />
                        <Link
                            underline="hover"
                            color="inherit"
                            href="/purchases"
                        >
                            <Button
                                variant="contained"
                                color="warning"
                                size="large"
                                startIcon={<ArrowBackIosNewIcon />}
                                sx={{ mr: "1rem" }}
                            >
                                BACK
                            </Button>
                        </Link>

                        <Button
                            variant="contained"
                            type="submit"
                            color="success"
                            size="large"
                            endIcon={<PaymentsIcon />}
                            onClick={()=>setOpenPayment(true)}
                            
                        >
                            PAYMENTS
                        </Button>
                    </Toolbar>
                </AppBar>
                <PaymentsCheckoutDialog open={openPayment} setOpen={setOpenPayment} useCart={usePurchase}/>
        </AuthenticatedLayout>
    );
}