import React from 'react';
import { Box, Button, Grid2 as Grid, Paper, TextField } from '@mui/material';
import { useEffect } from 'react';

const TelegramSetting = ({handleSubmit, settingFormData, handleChange, setSettingFormData, settings}) => {

    useEffect(() => {
        try {
            const parsedSettings = JSON.parse(settings.telegram_settings);
            setSettingFormData({
                ...settingFormData,
                token: parsedSettings.token,
                chat_id: parsedSettings.chat_id,
            });
        } catch (error) {
            console.error("Failed to parse telegram settings:", error);
        }
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'telegram_settings'} />
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
                    <Grid container size={12} spacing={2}>
                        <Paper sx={{ padding: { xs: '0.5rem', sm: "1rem" }, marginBottom: "1rem", width:'100%' }}>
                            <Grid size={12} container spacing={2}>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Telegram Bot Token"}
                                        name="token"
                                        required
                                        value={settingFormData.token}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Telegram Chat ID"}
                                        name="chat_id"
                                        required
                                        value={settingFormData.chat_id}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
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
                        >
                            UPDATE
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </form>
    );
};

export default TelegramSetting;

