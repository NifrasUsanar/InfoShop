import React, { useState } from 'react';
import {
    Box, Button, Grid, Paper, TextField, Typography,
    IconButton, InputAdornment, Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import QRCode from 'react-qr-code';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function MobileSetting({ settings }) {
    const [apiKey, setApiKey] = useState(settings.sync_api_key ?? '');
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const serverUrl = window.location.origin;
    const qrFull = apiKey ? JSON.stringify({ url: serverUrl, key: apiKey }) : '';
    const qrKeyOnly = apiKey ?? '';

    const handleGenerate = async () => {
        const result = await Swal.fire({
            title: 'Regenerate API Key?',
            text: 'All connected mobile devices will need to re-scan the QR code.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Regenerate',
            confirmButtonColor: '#d33',
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const response = await axios.post('/settings/generate-sync-key');
            setApiKey(response.data.key);
            setVisible(true);
            Swal.fire({ title: 'Done!', text: 'New API key generated.', icon: 'success', timer: 2000, showConfirmButton: false });
        } catch {
            Swal.fire({ title: 'Error', text: 'Failed to generate key.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey);
        Swal.fire({ title: 'Copied!', icon: 'success', timer: 1500, showConfirmButton: false });
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Grid container width={{ xs: '100%', sm: '60%' }} spacing={2}>
                <Grid size={12}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                            Mobile Sync Configuration
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="Server URL"
                                    value={serverUrl}
                                    InputProps={{ readOnly: true }}
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="API Key"
                                    value={apiKey}
                                    type={visible ? 'text' : 'password'}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setVisible(v => !v)} edge="end">
                                                    {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                                <IconButton onClick={handleCopy} edge="end" disabled={!apiKey}>
                                                    <ContentCopyIcon />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    variant="outlined"
                                    size="small"
                                    placeholder={apiKey ? undefined : 'No key generated yet'}
                                />
                            </Grid>

                            <Grid size={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleGenerate}
                                    disabled={loading}
                                >
                                    {apiKey ? 'Regenerate Key' : 'Generate Key'}
                                </Button>
                            </Grid>
                        </Grid>

                        {apiKey && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} mb={1}>
                                            URL + API Key
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                            Scan to auto-configure URL and key
                                        </Typography>
                                        <Box sx={{ display: 'inline-block', p: 2, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                            <QRCode value={qrFull} size={180} />
                                        </Box>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600} mb={1}>
                                            API Key Only
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                            Scan to configure key only
                                        </Typography>
                                        <Box sx={{ display: 'inline-block', p: 2, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                                            <QRCode value={qrKeyOnly} size={180} />
                                        </Box>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
