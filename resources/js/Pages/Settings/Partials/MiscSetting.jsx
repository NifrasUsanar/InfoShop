import React from 'react';
import { Box, Button, Grid, Paper, TextField, MenuItem } from '@mui/material';
import { useEffect } from 'react';

const MiscSetting = ({ handleSubmit, settingFormData, handleChange, setSettingFormData, settings }) => {

    useEffect(() => {
        if (!settings?.misc_settings) return;
        try {
            const parsedSettings = JSON.parse(settings.misc_settings);
            setSettingFormData(prev => ({
                ...prev,
                optimize_image_width: parsedSettings.optimize_image_width,
                optimize_image_size: parsedSettings.optimize_image_size,
                cheque_alert: parsedSettings.cheque_alert,
                product_alert: parsedSettings.product_alert,
                cart_first_focus: parsedSettings.cart_first_focus ?? 'quantity',
                enable_unit_discount: parsedSettings.enable_unit_discount ?? 'yes',
                enable_flat_item_discount: parsedSettings.enable_flat_item_discount ?? 'no',
            }));
        } catch (error) {
            console.error("Failed to parse misc settings:", error);
        }
    }, [settings?.misc_settings]);

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'misc_settings'} />
            <Box
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Grid
                    container
                    spacing={2}
                    width={{ xs: "100%", sm: "60%" }}
                    flexDirection={'column'}
                >
                    <Paper sx={{ padding: 2, marginBottom: "1rem", width: '100%' }}>
                        <Grid size={12} container spacing={3}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Cheque Alert"}
                                    name="cheque_alert"
                                    multiline
                                    required
                                    value={settingFormData.cheque_alert}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Product Alert"}
                                    name="product_alert"
                                    multiline
                                    required
                                    value={settingFormData.product_alert}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Cart First Focus"}
                                    name="cart_first_focus"
                                    required
                                    value={settingFormData.cart_first_focus}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="quantity">Quantity</MenuItem>
                                    <MenuItem value="discount">Discount</MenuItem>
                                    <MenuItem value="price">Price</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Enable Unit Discount"}
                                    name="enable_unit_discount"
                                    required
                                    value={settingFormData.enable_unit_discount}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Enable Flat Discount"}
                                    name="enable_flat_item_discount"
                                    required
                                    value={settingFormData.enable_flat_item_discount}
                                    onChange={handleChange}
                                    select
                                >
                                    <MenuItem value="yes">Yes</MenuItem>
                                    <MenuItem value="no">No</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Optimize Image Width"}
                                    name="optimize_image_width"
                                    multiline
                                    required
                                    value={settingFormData.optimize_image_width}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label={"Optimize Image Size"}
                                    name="optimize_image_size"
                                    multiline
                                    required
                                    value={settingFormData.optimize_image_size}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                    <Grid
                        size={12}
                        justifyContent={"end"}
                        sx={{ display: "flex" }}
                    >
                        <Button
                            type="submit"
                            variant="outlined"
                            size="large"
                            color="success"
                            fullWidth
                        >
                            UPDATE
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
};

export default MiscSetting;