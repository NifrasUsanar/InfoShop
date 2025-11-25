import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import axios from 'axios';

/**
 * QuickAddCollectionDialog - WordPress-style inline collection creation
 * Allows users to quickly create a new collection without leaving the current page
 */
export default function QuickAddCollectionDialog({
    open,
    onClose,
    onSuccess,
    collectionType,
    label
}) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/collections/quick-create', {
                name: name.trim(),
                collection_type: collectionType
            });

            if (response.data.success) {
                // Call success callback with new collection
                onSuccess(response.data.collection);

                // Reset and close
                setName('');
                onClose();
            }
        } catch (err) {
            if (err.response?.data?.errors?.name) {
                setError(err.response.data.errors.name[0]);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to create collection. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setName('');
            setError('');
            onClose();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit(e);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>
                Create New {label}
            </DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label={`${label} Name`}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        placeholder={`Enter ${label.toLowerCase()} name...`}
                        helperText="Slug will be auto-generated from the name"
                    />
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !name.trim()}
                    startIcon={loading && <CircularProgress size={16} />}
                >
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
