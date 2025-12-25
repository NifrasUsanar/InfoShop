import React, { useState, useEffect, useContext } from 'react';
import { Autocomplete, TextField, Grid, Tooltip, Box, Divider, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import FormDialog from '@/Pages/Contact/Partial/FormDialog';
import { useAppConfig } from "../contexts/AppConfigContext";
import dayjs from 'dayjs';
import MUIDatePicker from '@/Components/ui/MUIDatePicker';
import MUITimePicker from '@/Components/ui/MUITimePicker';

import { SharedContext } from '@/Context/SharedContext';

export default function CartItemsTop({ customers }) {
  const { return_sale } = useAppConfig();
  const [open, setOpen] = useState(false);
  const [customerList, setCustomerList] = useState(customers)
  const [isTimeEditMode, setIsTimeEditMode] = useState(false);
  const { selectedCustomer, setSelectedCustomer, saleDate, setSaleDate, saleTime, setSaleTime, isSaleTimeManual, setIsSaleTimeManual } = useContext(SharedContext);

  // Special option for creating a new customer
  const CREATE_NEW_OPTION = {
    id: 'create-new',
    name: 'Add new customer',
    isCreateNew: true
  };

  // Include "Add new customer" at the top of the list
  const optionsWithCreateNew = [CREATE_NEW_OPTION, ...customerList];

  const handleClose = () => {
    setOpen(false);
  };

  //   Reload the table after form success
  const handleFormSuccess = (contact) => {

    setCustomerList((prevCustomers) => {
      // Create the new customer object
      const newCustomer = { id: contact.id, name: contact.name, balance: contact.balance };

      // Update the customer list
      const updatedCustomerList = [...prevCustomers, newCustomer];

      // Select the newly added customer directly
      setSelectedCustomer(newCustomer); // Set selected customer to the new customer

      return updatedCustomerList; // Return the updated list
    });
  };

  useEffect(() => {
    if (customerList) {
      const initialCustomer = customerList.find(customer => customer.id === 1) || customerList[0];
      setSelectedCustomer(initialCustomer || null);
    }
  }, [customerList]); // Depend on customerList instead of customers to prevent unnecessary updates


  const handleTimeEditClick = () => {
    setIsSaleTimeManual(true); // Stop auto-updates immediately
    setIsTimeEditMode(true);
  };

  const handleTimeSave = () => {
    setIsTimeEditMode(false);
  };

  const handleTimeReset = () => {
    setIsSaleTimeManual(false); // Resume auto-updates
    setSaleTime(dayjs().format('HH:mm')); // Set to current time immediately
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid sx={{ width: '100%', marginY: { xs: '1rem', sm: '1.2rem' }, alignItems: 'center', justifyContent:'space-between' }} container spacing={2} flexDirection={{ xs: 'column-reverse', sm: 'row' }} alignItems={'center'}>
      <Tooltip
        title={!saleDate ? "Sale date is required" : ""}
        arrow
        placement="top"
        open={!saleDate}
        disableHoverListener
        PopperProps={{
          disablePortal: true,
        }}
      >
        <Grid size={{ xs: 12, sm: 6 }} width={'100%'}>
          <MUIDatePicker
            name="sale_date"
            label="Date"
            value={saleDate}
            onChange={setSaleDate}
            size="small"
          />
        </Grid>
      </Tooltip>

      <Tooltip
        title={!saleTime ? "Sale time is required" : ""}
        arrow
        placement="top"
        open={!saleTime}
        disableHoverListener
        PopperProps={{
          disablePortal: true,
        }}
      >
        <Grid size={{ xs: 12, sm: 6 }} width={'100%'}>
          {isTimeEditMode ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <MUITimePicker
                name="sale_time"
                label="Time"
                value={saleTime}
                onChange={setSaleTime}
                size="small"
                sx={{ flex: 1 }}
              />
              <IconButton
                size="small"
                onClick={handleTimeSave}
                color="primary"
                title="Save time"
              >
                <CheckIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                name="sale_time"
                label="Time"
                value={dayjs(saleTime, 'HH:mm').format('hh:mm A')}
                size="small"
                fullWidth
                disabled
                slotProps={{
                  input: {
                    readOnly: true,
                  }
                }}
              />
              <IconButton
                size="small"
                onClick={handleTimeEditClick}
                color="primary"
                title="Edit time"
              >
                <EditIcon />
              </IconButton>
              {isSaleTimeManual && (
                <IconButton
                  size="small"
                  onClick={handleTimeReset}
                  color="secondary"
                  title="Reset to current time"
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Grid>
      </Tooltip>

      <Grid size={{ xs: 12, sm: 12 }} width={'100%'}>
        {Array.isArray(customerList) && (
          <Autocomplete
            disablePortal
            options={optionsWithCreateNew}
            fullWidth
            value={selectedCustomer || null}
            getOptionKey={(option) => option.id}
            getOptionLabel={(option) => {
              if (option.isCreateNew) {
                return '+ Add new customer';
              }
              return typeof option === 'string' ? option : option.name + ' | ' + parseFloat(option.balance).toFixed(2);
            }}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;

              if (option.isCreateNew) {
                return (
                  <Box key={key}>
                    <Box
                      component="li"
                      {...otherProps}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': {
                          backgroundColor: 'primary.100',
                          color: 'primary.900'
                        }
                      }}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                      Add new customer
                    </Box>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                );
              }
              return (
                <Box component="li" key={key} {...otherProps}>
                  {option.name} | {parseFloat(option.balance).toFixed(2)}
                </Box>
              );
            }}
            onChange={(event, newValue) => {
              // Check if "Add new customer" option was selected
              if (newValue?.isCreateNew) {
                setOpen(true); // Open the form dialog
                return; // Don't set this as the selected customer
              }
              setSelectedCustomer(newValue);
            }}
            size='small'
            renderInput={(params) => <TextField {...params} label="Customer" />}
          />
        )}
      </Grid>

      <FormDialog open={open} handleClose={handleClose} onSuccess={handleFormSuccess} contactType={'customer'} />
      </Grid>
    </Box>
  );
}
