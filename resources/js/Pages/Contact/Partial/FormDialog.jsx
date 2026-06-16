import * as React from "react";
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Swal from "sweetalert2";
import axios from "axios";

export default function FormDialog({
    open,
    handleClose,
    contact,
    contactType,
    onSuccess,
}) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        whatsapp:'',
        type: contactType, // Type of contact (customer or vendor)
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value, // Update specific field based on name
        }));
    };

    // Update form state if the contact prop is filled
    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || "", // Update name if available
                email: contact.email || "", // Update email if available
                phone: contact.phone || "", // Update phone if available
                whatsapp: contact.whatsapp || "",
                address: contact.address || "", // Update address if available
                type: contact.type || "", // Update type if available
            });
        }
        else setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            whatsapp: '',
            type: contactType,
        })
    }, [contact]); // Dependency array includes contact

    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        formJson.type = contactType;
        // Determine the endpoint based on whether we are editing or adding
        const endpoint = contact ? `/contact/${contact.id}` : "/contact";

        // Send form data via Axios
        axios
            .post(endpoint, formJson)
            .then((response) => {
                // Notify user of success
                Swal.fire({
                    title: "Success!",
                    text: "Successfully saved",
                    icon: "success",
                    position: "bottom-start",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    toast: true,
                });
                handleClose(); // Close dialog on success
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    whatsapp: '',
                    type: contactType,
                })
                onSuccess(response.data.data);
            })
            .catch((error) => {
                console.error(
                    "Submission failed with errors:",
                    error.response.data.errors
                );

                // Show error message if submission fails
                Swal.fire({
                    title: "Error!",
                    text:
                        error.response.data.message ||
                        "An error occurred while saving.",
                    icon: "error",
                    // position: '-start',
                    showConfirmButton: true,
                });
            });
    };

    return (
        <>
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
                <DialogTitle>Contact Information</DialogTitle>
                <DialogContent>
                    {/* Collection Name */}
                    {/* Name of the contact (both customers and vendors) */}
                    <TextField
                        className="py-8 mb-4"
                        autoFocus
                        required
                        margin="dense"
                        id="name"
                        name="name"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.name} // Use formData object
                        onChange={handleChange} // Single handleChange for all fields
                    />

                    {/* Contact's email */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="email"
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.email} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Phone number */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="phone"
                        name="phone"
                        label="Phone"
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.phone} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Whatsapp number */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        name="whatsapp"
                        placeholder="94XXXXXXXXX"
                        label="Whatsapp"
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.whatsapp} // Use formData object
                        onChange={handleChange}
                    />

                    {/* Address */}
                    <TextField
                        className="py-8 mb-4"
                        margin="dense"
                        id="address"
                        name="address"
                        label="Address"
                        type="text"
                        fullWidth
                        variant="outlined" // Changed variant to "outlined"
                        value={formData.address} // Use formData object
                        onChange={handleChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit">SAVE</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
