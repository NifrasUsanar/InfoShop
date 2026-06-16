import React, { useState } from 'react';
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material';
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
                    const { key, ...otherProps } = props;
                    if (option.isCreateNew) {
                        return (
                            <Box
                                key={key}
                                component="li"
                                {...otherProps}
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
                        <Box key={key} component="li" {...otherProps}>
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
                    value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                            <Chip
                                key={key || option.id}
                                label={option.label}
                                {...tagProps}
                                onDelete={() => {
                                    onCollectionChange(
                                        selectedCollections.filter(c => c.id !== option.id)
                                    );
                                }}
                            />
                        );
                    })
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
