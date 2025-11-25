import * as React from 'react';
import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Grid } from '@mui/material';

import Swal from 'sweetalert2';


export default function FormDialog({ open, handleClose, collection }) {
  const { allCollections } = usePage().props;
  const [name, setName] = useState('');
  const [collectionType, setCollectionType] = useState('category');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (collection) {
      setName(collection.name || '');
      setCollectionType(collection.collection_type || 'category');
      setDescription(collection.description || '');
      setParentId(collection.parent_id || '');
    } else {
      setName('');
      setCollectionType('category');
      setDescription('');
      setParentId('');
    }
  }, [collection]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries(formData.entries());

    // Determine the endpoint based on whether we are editing or adding
    const endpoint = collection ? `/collection/${collection.id}` : '/collection';
    const method = 'post';

    // Send form data via Inertia
    router[method](endpoint, formJson, {
      onSuccess: (resp) => {
        Swal.fire({
          title: 'Success!',
          text: 'Successfully saved',
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
          confirmButtonText: 'OK',
        });
      },
    });
  };

  // Collection type select box
  const handleChange = (event) => {
    const newType = event.target.value;
    setCollectionType(newType);

    // Reset parent ID if type is not category
    if (newType !== 'category') {
      setParentId('');
    }
  };

  // Build hierarchical collection list for dropdown
  const buildHierarchicalOptions = () => {
    if (!allCollections) return [];

    const collectionsMap = {};
    const rootCollections = [];

    // Create a map of all collections
    allCollections.forEach(col => {
      collectionsMap[col.id] = { ...col, children: [] };
    });

    // Build the tree structure
    allCollections.forEach(col => {
      if (col.parent_id && collectionsMap[col.parent_id]) {
        collectionsMap[col.parent_id].children.push(collectionsMap[col.id]);
      } else {
        rootCollections.push(collectionsMap[col.id]);
      }
    });

    // Flatten the tree with indentation
    const flattenWithIndent = (collections, level = 0) => {
      let result = [];
      collections.forEach(col => {
        // Skip current collection when editing to prevent self-reference
        if (collection && col.id === collection.id) return;

        result.push({
          id: col.id,
          name: col.name,
          level: level
        });

        if (col.children && col.children.length > 0) {
          result = result.concat(flattenWithIndent(col.children, level + 1));
        }
      });
      return result;
    };

    return flattenWithIndent(rootCollections);
  };

  const hierarchicalCollections = buildHierarchicalOptions();

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
        }}
      >
        <DialogTitle>Collection Information</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              {/* Collection Name */}
              <TextField
                autoFocus
                required
                margin="dense"
                name="name"
                label="Collection Name"
                type="text"
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>

            <Grid size={12}>
              {/* Collection Type */}
              <TextField
                value={collectionType}
                label="Type"
                onChange={handleChange}
                name="collection_type"
                required
                select
                fullWidth
                margin="dense"
                variant="outlined"
                style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}
              >
                <MenuItem value={'category'}>Category</MenuItem>
                <MenuItem value={'brand'}>Brand</MenuItem>
                <MenuItem value={'tag'}>Tag</MenuItem>
              </TextField>
            </Grid>

            {collectionType === 'category' && (
              <Grid size={12}>
                {/* Parent Collection */}
                <TextField
                  value={parentId}
                  label="Parent Collection (Optional)"
                  onChange={(e) => setParentId(e.target.value)}
                  name="parent_id"
                  select
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}
                >
                  <MenuItem value="">
                    <em className="text-gray-500">None (Root Level)</em>
                  </MenuItem>
                  {hierarchicalCollections.map((col) => (
                    <MenuItem key={col.id} value={col.id}>
                      <span className={`pl-${col.level * 4}`}>
                        {col.level > 0 && '└─ '}
                        {col.name}
                      </span>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid size={12}>
              {/* Collection Description */}
              <TextField
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
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
