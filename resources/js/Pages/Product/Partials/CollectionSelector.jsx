import React, { useState } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import QuickAddCollectionDialog from './QuickAddCollectionDialog';

/**
 * CollectionSelector - Multi-select component for product collections
 * Handles both Categories and Tags selection with inline creation
 */
export default function CollectionSelector({
    collections,
    selectedCollections,
    onCollectionChange,
    collectionType,
    label,
    placeholder,
    onCollectionCreated // Callback to refresh collections in parent
}) {
    const [dialogOpen, setDialogOpen] = useState(false);

    // Filter collections by type
    const filteredCollections = collections
        .filter(col => col.collection_type === collectionType)
        .map(col => ({
            id: col.id,
            label: col.name,
            collection_type: col.collection_type
        }));

    // Add "Create New" option at the beginning
    const CREATE_NEW_OPTION = {
        id: 'create-new',
        label: `Create New ${label}`,
        isCreateNew: true
    };

    const optionsWithCreateNew = [CREATE_NEW_OPTION, ...filteredCollections];

    const handleChange = (event, newValue) => {
        // Check if "Create New" was selected
        const createNewSelected = newValue.find(item => item.isCreateNew);

        if (createNewSelected) {
            // Open dialog
            setDialogOpen(true);
            // Don't add the "Create New" option to selected values
            return;
        }

        onCollectionChange(newValue);
    };

    const handleCollectionCreated = (newCollection) => {
        // Add the newly created collection to selected items
        const newCollectionOption = {
            id: newCollection.id,
            label: newCollection.name,
            collection_type: newCollection.collection_type
        };

        onCollectionChange([...selectedCollections, newCollectionOption]);

        // Notify parent to refresh collections list
        if (onCollectionCreated) {
            onCollectionCreated(newCollection);
        }
    };

    return (
        <>
            <Autocomplete
                multiple
                size="small"
                value={selectedCollections}
                onChange={handleChange}
                options={optionsWithCreateNew}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                renderOption={(props, option) => {
                    if (option.isCreateNew) {
                        return (
                            <Box
                                component="li"
                                {...props}
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 600,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        backgroundColor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }
                                }}
                            >
                                <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                                {option.label}
                            </Box>
                        );
                    }
                    return (
                        <Box component="li" {...props}>
                            {option.label}
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        size="small"
                        placeholder={placeholder}
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <span
                            key={option.id}
                            {...getTagProps({ index })}
                            className="inline-flex items-center px-2 py-1 mr-1 mb-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800"
                        >
                            {option.label}
                            <button
                                type="button"
                                onClick={() => {
                                    onCollectionChange(
                                        selectedCollections.filter(c => c.id !== option.id)
                                    );
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    ))
                }
            />

            <QuickAddCollectionDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSuccess={handleCollectionCreated}
                collectionType={collectionType}
                label={label}
            />
        </>
    );
}
