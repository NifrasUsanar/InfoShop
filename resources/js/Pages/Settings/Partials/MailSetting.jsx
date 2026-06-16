import React from 'react';
import { Box, Button,  Grid, Paper, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';

const MailSetting = ({ handleSubmit, settingFormData, handleChange, setSettingFormData, settings }) => {

    useEffect(() => {
        try {
            const parsedSettings = JSON.parse(settings.mail_settings);
            setSettingFormData({
                ...settingFormData,
                mail_host: parsedSettings.mail_host,
                mail_port: parsedSettings.mail_port,
                mail_username: parsedSettings.mail_username,
                mail_password: parsedSettings.mail_password,
                mail_encryption: parsedSettings.mail_encryption,
                mail_from_address: parsedSettings.mail_from_address,
                mail_from_name: parsedSettings.mail_from_name,
                admin_email: parsedSettings.admin_email,
            });
        } catch (error) {
            console.error("Failed to parse mail settings:", error);
        }
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            method="post"
        >
            <input type="hidden" name="setting_type" value={'mail_settings'} />
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
                                        label={"Mail Host"}
                                        name="mail_host"
                                        required
                                        value={settingFormData.mail_host}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail Port"}
                                        name="mail_port"
                                        required
                                        value={settingFormData.mail_port}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail Username"}
                                        name="mail_username"
                                        required
                                        value={settingFormData.mail_username}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail Password"}
                                        name="mail_password"
                                        required
                                        value={settingFormData.mail_password}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail Encryption"}
                                        name="mail_encryption"
                                        required
                                        value={settingFormData.mail_encryption}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail From Address"}
                                        name="mail_from_address"
                                        required
                                        value={settingFormData.mail_from_address}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Mail From Name"}
                                        name="mail_from_name"
                                        required
                                        value={settingFormData.mail_from_name}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid size={6}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label={"Admin Email"}
                                        name="admin_email"
                                        required
                                        value={settingFormData.admin_email}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>

                            <Grid
                        size={12}
                        sx={{ display: "flex", justifyContent: "end", mt: 1 }}
                        spacing={1}
                        container
                    >
                        <Button
                            variant="outlined"
                            size="large"
                            color="primary"
                            onClick={() => {
                                axios.post('/test-mail', { test_mail: settingFormData.admin_email })
                                    .then(response => {
                                        alert('Test mail sent successfully!');
                                    })
                                    .catch(error => {
                                        console.error("Error sending test mail:", error);
                                    });
                            }}
                        >
                            Test Mail
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

export default MailSetting;
