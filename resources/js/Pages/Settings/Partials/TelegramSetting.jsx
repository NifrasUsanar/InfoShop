import React from 'react';
import { Box, Button,  Grid, Paper, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';

const TelegramSetting = ({ handleSubmit, settingFormData, handleChange, setSettingFormData, settings }) => {

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
                    sx={{ width: { xs: "100%", sm: "60%" }, flexDirection: 'column' }}
                >
                    <Grid container size={12} spacing={2}>
                        <Paper sx={{ padding: { xs: '0.5rem', sm: "1rem" }, marginBottom: "1rem", width: '100%' }}>
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

                            <Grid
                                size={12}
                                spacing={1}
                                container
                                sx={{ justifyContent: "end", display: "flex", mt: 1 }}
                            >
                                <Button
                                    type="button"
                                    variant="outlined"
                                    size="large"
                                    color="primary"
                                    onClick={() => {
                                        axios.post(
                                            `https://api.telegram.org/bot${settingFormData.token}/sendMessage`,
                                            {
                                                chat_id: settingFormData.chat_id,
                                                text: "Testing from the settings panel",
                                            }
                                        ).then((res) => {
                                            console.log(res);
                                        }).catch((err) => {
                                            console.error(err);
                                        });
                                    }}
                                >
                                    TEST TELEGRAM
                                </Button>

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

export default TelegramSetting;
