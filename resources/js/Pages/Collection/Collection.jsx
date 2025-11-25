import * as React from 'react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import Grid from '@mui/material/Grid';
import { Button, Box, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { DataGrid } from '@mui/x-data-grid';

import FormDialog from './Partial/FormDialog';
import { X } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const columns = (handleAction) => [
  {
    field: 'name', headerName: 'Name', width: 200,
    renderCell: (params) => (
      <p className='cursor-pointer font-bold' onClick={() => handleAction(params.row, 'edit')}>
        {params.value}
      </p>
    )
  },
  { field: 'collection_type', headerName: 'Collection Type', width: 150 },
  {
    field: 'parent',
    headerName: 'Parent Collection',
    width: 180,
    renderCell: (params) => (
      <span className="text-gray-600">
        {params.row.parent ? params.row.parent.name : '—'}
      </span>
    )
  },
  { field: 'description', headerName: 'Description', width: 250 },
  { field: 'created_at', headerName: 'Created At', width: 150 },
  {
    field: 'action',
    headerName: 'Actions',
    width: 150,
    renderCell: (params) => (
      <>
        <IconButton onClick={() => handleAction(params.row, 'delete')} color='error' variant="filled">
          <X />
        </IconButton>
      </>
    ),
  },
];

export default function Collection({ collections }) {
  const auth = usePage().props.auth.user;
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const handleClickOpen = () => {
    setSelectedCollection(null);
    setOpen(true);
  };

  const handleAction = (collection, action) => {
    if (action === "edit") {
      setSelectedCollection(collection); // Set selected collection for editing
      setOpen(true);
    }
    else if (action === "delete") {
      console.log(collection.id);
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {

          axios.delete(`/collections/${collection.id}`)
            .then((response) => {
              Swal.fire(
                'Deleted!',
                'Collection has been deleted.',
                'success'
              );
              router.reload();
            })
            .catch((error) => {
              console.error(error);
              Swal.fire(
                'Error!',
                'Something went wrong.',
                'error'
              );
            });
        }
      });
    }
  }

  const handleClose = () => {
    setSelectedCollection(null);
    setOpen(false);
  };

  return (
    <AuthenticatedLayout>
      <Head title="Collection" />

      <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
        <Grid size={12} container justifyContent="end">
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleClickOpen}>
            Add Collection
          </Button>
        </Grid>

        <Box className="py-6 w-full" sx={{ display: 'grid', gridTemplateColumns: '1fr' }}>
          <DataGrid
            rows={collections}
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

      <FormDialog open={open} handleClose={handleClose} collection={selectedCollection} />
    </AuthenticatedLayout>
  );
}
