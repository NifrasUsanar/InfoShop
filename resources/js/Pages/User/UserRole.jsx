import * as React from 'react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import Grid from '@mui/material/Grid';
import { Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';

import { DataGrid, GridToolbar} from '@mui/x-data-grid';
import UserRoleDialog from './UserRoleDialog';

  const columns = (handleEdit) => [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Profile Name', width: 200,
      renderCell: (params) => (
        <Button
          onClick={() => handleEdit(params.row)}
          variant="text"
          sx={{fontWeight:'bold'}}
        >
          {params.value}
        </Button>
      ),
    },
    { field: 'permissions_list', headerName: 'User Name', width: 500 },
  ];

 export default function UserRole({roles, permissions}) {
    const auth = usePage().props.auth.user
    const [open, setOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState()

    const handleClickOpen = () => {
        setSelectedRole(null);
        setOpen(true);
    };

    const handleEdit = (role) => {
        setSelectedRole(role); // Set selected user for editing
        setOpen(true); // Open the dialog
      };

    const handleClose = () => {
        setSelectedRole(null);
        setOpen(false);
    };

   
    return (
        <AuthenticatedLayout>
          
            <Head title="User Roles" />
                <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'end' }}>
                    <Grid size={{xs:12, sm:4, md:3}}>
                        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>Add Role</Button>
                    </Grid>
                </Grid>

                <Box className='py-6 w-full' sx={{display: 'grid', gridTemplateColumns: '1fr'}}>
                      <DataGrid 
                      rows={roles} 
                      columns={columns(handleEdit)}
                      pageSize={5}
                      slots={{ toolbar: GridToolbar }}
                      slotProps={{
                          toolbar: {
                            showQuickFilter: true,
                          },
                        }}
                      />
                  </Box>

                  <UserRoleDialog  open={open} handleClose={handleClose} user_role={selectedRole} permissions={permissions}>  </UserRoleDialog>
            
        </AuthenticatedLayout>
    );
}
