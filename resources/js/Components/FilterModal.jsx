import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    IconButton,
    Badge,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import Select2 from 'react-select';

/**
 * Global FilterModal Component
 * 
 * @param {Object} props
 * @param {Array} props.fields - Array of field configurations
 *   Example: [
 *     { name: 'store', label: 'Store', type: 'select', options: [...], size: { xs: 12, sm: 6, md: 6 } },
 *     { name: 'contact_id', label: 'Supplier', type: 'select2', options: [...], size: { xs: 12, sm: 6, md: 6 }, getOptionLabel: (opt) => ... }
 *   ]
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.handleFilterChange - Change handler function
 * @param {String} props.title - Modal title (default: "Advanced Filters")
 * @param {String} props.buttonTitle - Tooltip for filter button (default: "Advanced Filters")
 */
export default function FilterModal({ fields = [], filters = {}, handleFilterChange, title = "Advanced Filters", buttonTitle = "Advanced Filters" }) {
    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleClearFilters = () => {
        // Reset all filter fields to empty/null values
        fields.forEach((field) => {
            const event = {
                target: {
                    name: field.name,
                    value: '',
                }
            };
            handleFilterChange(event);
        });
    };

    // Count active filters
    const activeFiltersCount = fields.filter((field) => {
        const value = filters[field.name];
        return value !== null && value !== undefined && value !== '' && value !== 0;
    }).length;

    const renderField = (field) => {
        const { name, label, type, options = [], size, getOptionLabel, getOptionValue } = field;
        const value = filters[name];

        if (type === 'select') {
            return (
                <Grid key={name} size={size}>
                    <TextField
                        value={value || ''}
                        label={label}
                        onChange={handleFilterChange}
                        name={name}
                        select
                        fullWidth
                        size="small"
                        margin="dense"
                    >
                        {options.map((option) => (
                            <MenuItem key={option.id} value={option.id}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            );
        }

        if (type === 'select2') {
            const selectedOption = value ? options.find(opt => (getOptionValue || ((o) => o.id))(opt) === value) : null;

            return (
                <Grid key={name} size={size}>
                    <div style={{ marginTop: '7px' }}>
                        <Select2
                            placeholder={`Select ${label.toLowerCase()}...`}
                            value={selectedOption}
                            styles={{
                                control: (baseStyles, state) => ({
                                    ...baseStyles,
                                    height: '40px',
                                    minHeight: '40px',
                                    fontSize: '14px',
                                }),
                                menuPortal: base => ({ ...base, zIndex: 9999 })
                            }}
                            options={options}
                            onChange={(selectedOption) => {
                                handleFilterChange(selectedOption);
                            }}
                            isClearable
                            getOptionLabel={getOptionLabel || ((option) => option.name)}
                            getOptionValue={getOptionValue || ((option) => option.id)}
                            menuPortalTarget={document.body}
                        />
                    </div>
                </Grid>
            );
        }

        if (type === 'text') {
            return (
                <Grid key={name} size={size}>
                    <TextField
                        value={value || ''}
                        label={label}
                        onChange={handleFilterChange}
                        name={name}
                        fullWidth
                        size="small"
                        margin="dense"
                        type="text"
                    />
                </Grid>
            );
        }

        if (type === 'number') {
            return (
                <Grid key={name} size={size}>
                    <TextField
                        value={value || ''}
                        label={label}
                        onChange={handleFilterChange}
                        name={name}
                        fullWidth
                        size="small"
                        margin="dense"
                        type="number"
                    />
                </Grid>
            );
        }

        if (type === 'date') {
            return (
                <Grid key={name} size={size}>
                    <TextField
                        value={value || ''}
                        label={label}
                        onChange={handleFilterChange}
                        name={name}
                        fullWidth
                        size="small"
                        margin="dense"
                        type="date"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                    />
                </Grid>
            );
        }

        return null;
    };

    return (
        <>
                {/* Filter Button */}
                <Badge badgeContent={activeFiltersCount > 0 ? activeFiltersCount : null} color="error">
                    <IconButton
                        onClick={handleOpenModal}
                        color="primary"
                        title={buttonTitle}
                        sx={{
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                        }}
                    >
                        <TuneIcon />
                    </IconButton>
                </Badge>
            {/* Filter Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                        {fields.map((field) => renderField(field))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClearFilters} color="error" variant="outlined">
                        Clear All
                    </Button>
                    <Button onClick={handleCloseModal} color="inherit">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
