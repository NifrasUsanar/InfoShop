import React from 'react';
import { Box, Button,  Grid, Paper, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';

const LoyaltyPointsSetting = ({ handleSubmit, settingFormData, handleChange, setSettingFormData, settings }) => {

    useEffect(() => {
        try {
            const parsedSettings = JSON.parse(settings.loyalty_points_settings);
            setSettingFormData({
                ...settingFormData,
                amount_per_point: parsedSettings.amount_per_point,
                max_points_per_purchase: parsedSettings.max_points_per_purchase,
                points_expiration_days: parsedSettings.points_expiration_days,
                min_points_for_redeem: parsedSettings.min_points_for_redeem,
            });
        } catch (error) {
            console.error("Failed to parse loyalty points settings:", error);
        }
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'loyalty_points_settings'} />
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
                    sx={{ width: { xs: "100%", sm: "60%" }, flexDirection: 'column' }}
                >
                    <Grid container size={12} spacing={2}>
                        <Paper sx={{ padding: { xs: '0.5rem', sm: "1rem" }, marginBottom: "1rem", width: '100%' }}>
                            <Grid size={12} container spacing={2}>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Amount per point"}
                                        name="amount_per_point"
                                        value={settingFormData.amount_per_point}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Max points per purchase"}
                                        name="max_points_per_purchase"
                                        value={settingFormData.max_points_per_purchase}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Points expiration days"}
                                        name="points_expiration_days"
                                        value={settingFormData.points_expiration_days}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Min points for redeem"}
                                        name="min_points_for_redeem"
                                        value={settingFormData.min_points_for_redeem}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>

                            <Grid
                                size={12}
                                spacing={1}
                                container
                                sx={{ justifyContent: "end", display: "flex", mt: 1 }}
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
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
};

export default LoyaltyPointsSetting;
