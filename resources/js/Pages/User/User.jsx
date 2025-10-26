import * as React from 'react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Grid from '@mui/material/Grid';
import { Button, Box, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';

import { DataGrid} from '@mui/x-data-grid';

import FormDialog from './UserFormDialog';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';


  const columns = (handleAction) => [
    { field: 'name', headerName: 'Profile Name', width: 200,
      renderCell: (params) => (
        <p
          onClick={() => handleAction(params.row, 'edit')}
          className='cursor-pointer font-bold'
        >
          {params.value}
        </p>
      ),
    },
    { field: 'user_name', headerName: 'User Name', width: 150 },
    { field: 'user_role', headerName: 'User Role', width: 150 },
    { field: 'email', headerName: 'Email', width: 150 },
    { field: 'store_name', headerName: 'Store', width: 150 },
    { field: 'created_at', headerName: 'Created At', width: 200,
      renderCell: (params) => (
        <p>{dayjs(params.value).format('YYYY-MM-DD hh:mm A')}</p>
      )
     },
     {field: "action", headerName: "Actions", width: 100,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleAction(params.row, 'deactivate')}
          variant="contained"
          color='error'
          sx={{fontWeight:'bold'}}
        >
          <X />
        </IconButton>
      ),
     }
  ];

 export default function User({users, stores, roles}) {
    const auth = usePage().props.auth.user
    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleClickOpen = () => {
        setSelectedUser(null);
        setOpen(true);
    };

    const handleAction = (user, action) => {
        if (action === "edit") {
          setSelectedUser(user); // Set selected user for editing
          setOpen(true);
        }
        else if (action === "deactivate") {
          console.log(user.id);
          Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this action!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, deactivate!'
          }).then((result) => {
            if (result.isConfirmed) {
              axios.post(`/users/${user.id}/deactivate`)
                .then((response) => {
                  Swal.fire(
                    'Deactivated!',
                    `User ${user.name} has been deactivated.`,
                    'success'
                  );
                  router.reload();
                })
                .catch((error) => {
                  Swal.fire(
                    'Failed',
                    error.response.data.message,
                    'error'
                  );
                });
            }
          });
        }
    }

    const handleClose = () => {
        setSelectedUser(null);
        setOpen(false);
    };

   
    return (
        <AuthenticatedLayout>
          
            <Head title="User" />
                <Grid container spacing={2} alignItems='center' sx={{ width: "100%" }}>
                    <Grid size={12} container justifyContent='end'>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>Add User</Button>
                    </Grid>

                    <Box className='py-6 w-full' sx={{display: 'grid', gridTemplateColumns: '1fr'}}>
                      <DataGrid 
                      rows={users}
                      columns={columns(handleAction)}
                      pageSize={5}
                      slotProps={{
                          toolbar: {
                            showQuickFilter: true,
                          },
                        }}
                      />
                  </Box>
                </Grid>

                <FormDialog open={open} handleClose={handleClose} stores={stores} user={selectedUser} roles={roles}/>
            
        </AuthenticatedLayout>
    );
}