import * as React from 'react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Swal from 'sweetalert2';
import {  Grid } from '@mui/material';

export default function FormDialog({ open, handleClose, store }) {

  const [formState, setFormState] = useState({
    name: '',
    address: '',
    contact_number: '',
    sale_prefix: '',
    current_sale_number: '',
  });

  useEffect(() => {
    if (store) {
      setFormState({
        name: store.name || '',
        address: store.address || '',
        contact_number: store.contact_number || '',
        sale_prefix: store.sale_prefix || '',
        current_sale_number: store.current_sale_number || '',
      });
    }else {
      // Optional: Reset to initial state if store is not provided
      setFormState({
        name: '',
        address: '',
        contact_number: '',
        sale_prefix: '',
        current_sale_number: '',
      });
    }
  }, [store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());

    // Determine the endpoint based on whether we are editing or adding
    const endpoint = store ? `/store/${store.id}` : '/store';
    const method = 'post';

    // Send form data via Inertia
    router[method](endpoint, formJson, {
      onSuccess: (resp) => {
        const responseMessage = resp.props.flash?.message || 'Store created!';

        Swal.fire({
          title: 'Success!',
          text: 'Successfully saved',
          icon: 'success',
          position: 'bottom-start',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          // confirmButtonText: 'OK',
          toast: true,
        })
        handleClose(); // Close dialog on success
      },
      onError: (errors) => {
        console.error('Submission failed with errors:', errors);
      },
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth={true}
        maxWidth={"sm"}
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: handleSubmit,
          }
        }}
      >
        <DialogTitle>Store Information</DialogTitle>
        <DialogContent>
          <Grid container flexDirection={'column'} spacing={2.6}>
           {/* Store Name */}
          <TextField
          sx={{mt:'0.5rem'}}
            autoFocus
            required
            name="name"
            label="Store name"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.name}
            onChange={handleChange}
          />

          {/* Store Address */}
          <TextField
            required
            name="address"
            label="Store Address"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.address}
            onChange={handleChange}
          />
          
          {/* Store Contact Number */}
          <TextField
            required
            name="contact_number"
            label="Contact Number"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.contact_number}
            onChange={handleChange}
          />

          {/* Store Sale Prefix */}
          <TextField
          required
            name="sale_prefix"
            label="Sale Prefeix"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.sale_prefix}
            onChange={handleChange}
          />

          {/* Store Current Sale Number */}
          <TextField
            required
            name="current_sale_number"
            label="Current Sale Number"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.current_sale_number}
            onChange={handleChange}
          />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">SAVE</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
