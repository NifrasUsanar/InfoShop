import * as React from 'react';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react'
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Swal from 'sweetalert2';


export default function UserFormDialog({ open, handleClose, user, stores, roles }) {
    const [formState, setFormState] = useState({
      name: '',
      email: '',
      password: '',
      user_name: '',
      user_role: '',
      store_id:'',
    });
  
    useEffect(() => {
      if (user) {
        setFormState({
          name: user.name || '',
          email: user.email || '',
          password: '', // Password should not be pre-filled for security reasons
          user_name: user.user_name || '',
          user_role: user.user_role || '',
          store_id: user.store_id || '',
        });
      } else {
        setFormState({
          name: '',
          email: '',
          password: '',
          user_name: '',
          user_role: 'user',
          store_id: stores[0].id,
        });
      }
    }, [user]);
  
    const handleChange = (event) => {
      const { name, value } = event.target;
      setFormState((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };
  
    const handleSubmit = (event) => {
      event.preventDefault();
  
      const endpoint = user ? `/user/${user.id}` : '/user';
  
      router.post(endpoint, formState, {
        onSuccess: (resp) => {
          const responseMessage = resp.props.flash?.message || 'User created!';
  
          Swal.fire({
            title: 'Success!',
            text: responseMessage,
            icon: 'success',
            position: 'bottom-start',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
          });
          handleClose(); // Close dialog on success
        },
        onError: (errors) => {
            const errorMessages = Object.values(errors).flat().join(' | ');
            Swal.fire({
                title: 'Error!',
                text: errorMessages || 'An unexpected error occurred.',
                icon: 'error',
                // position: 'bottom-start',
                confirmButtonText: 'OK',
                // showConfirmButton: false,
                // timer: 3000,
                timerProgressBar: true,
                // toast: true,
              });
        },
      });
    };
  
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: handleSubmit,
          }
        }}
      >
        <DialogTitle>User Information</DialogTitle>
        <DialogContent>
            {/* User Username */}
          <TextField
            className="py-8"
            required
            margin="dense"
            id="user_name"
            name="user_name"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.user_name}
            autoFocus
            onChange={handleChange}
          />

          {/* User Name */}
          <TextField
            className="py-8"
            
            required
            margin="dense"
            id="name"
            name="name"
            label="Profile Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formState.name}
            onChange={handleChange}
          />
  
          {/* User Email */}
          <TextField
            className="py-8"
            required
            margin="dense"
            id="email"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formState.email}
            onChange={handleChange}
          />
  
          {/* User Password */}
          <TextField
            className="py-8"
            required={!user}
            margin="dense"
            id="password"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formState.password}
            onChange={handleChange}
          />
  
          
  
          {/* User Role */}
          <FormControl fullWidth variant="outlined" className="py-8" sx={{mt:'0.8rem'}}>
            <InputLabel id="user_role-label">User Role</InputLabel>
            <Select
              labelId="user_role-label"
              id="user_role"
              name="user_role"
              label="User Role"
              value={formState.user_role}
              onChange={handleChange}
              required
            >
              {/* <MenuItem value="super-admin">Super Admin</MenuItem> */}
              {roles?.map(role => (
                <MenuItem value={role.name}>{(role.name).toUpperCase()}</MenuItem>
              ))}
              
            </Select>
          </FormControl>

          <FormControl sx={{ width:'100%', mt:'1rem' }}>
            <InputLabel>Store</InputLabel>
            <Select
                value={formState.store_id}
                label="Store"
                onChange={handleChange}
                required
                name="store_id"
            >
                {stores?.map((store) => (
                    <MenuItem key={store.id} value={store.id}>
                        {store.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">SAVE</Button>
        </DialogActions>
      </Dialog>
    );
  }
