import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Grid,
    Paper,
    TextField,
    Typography,
    Card,
    CardContent,
    Alert,
    Divider,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Save, RotateCcw, ChevronDown } from 'lucide-react';
import JsBarcode from 'jsbarcode';

const BarcodeTemplateEditor = ({ settings }) => {
    const [template, setTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [barcodeSettings, setBarcodeSettings] = useState({
        format: 'CODE128',
        width: 2,
        height: 35,
        fontSize: 14,
    });

    const barcodeFormats = [
        'CODE128',
        'EAN13',
        'CODE39',
        'UPC',
    ];

    const allowedVariables = [
        { name: 'product_name', description: 'Product/item name' },
        { name: 'price', description: 'Product price' },
        { name: 'barcode_code', description: 'Barcode code/number' },
        { name: 'store_name', description: 'Store/shop name' },
        { name: 'date', description: 'Current date' },
    ];

    const [sampleData, setSampleData] = useState({
        product_name: 'ABC Product - XYZ',
        price: '1,000.00 Rs.',
        barcode_code: '8718719850268',
        store_name: 'Main Store',
        date: new Date().toLocaleDateString(),
    });

    useEffect(() => {
        fetchBarcodeTemplate();
    }, []);

    useEffect(() => {
        if (template) {
            generatePreview();
        }
    }, [template, sampleData, barcodeSettings]);

    const fetchBarcodeTemplate = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/barcode-template');
            setTemplate(response.data.template || '');
            if (response.data.barcode_settings) {
                setBarcodeSettings(response.data.barcode_settings);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching template:', err);
            setError('Failed to load barcode template');
            setTemplate('');
        } finally {
            setLoading(false);
        }
    };

    const generatePreview = async () => {
        if (!template.trim()) {
            setPreviewHtml('');
            setValidationErrors([]);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('template', btoa(template)); // Base64 encode template
            formData.append('sample_data', JSON.stringify(sampleData));
            formData.append('barcode_settings', JSON.stringify(barcodeSettings));

            const response = await axios.post('/api/barcode-template/preview', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setPreviewHtml(response.data.rendered);
            setValidationErrors([]);

            // Generate barcode if barcode SVG element is present
            setTimeout(() => {
                try {
                    const barcodeElement = document.getElementById('barcode-svg');
                    if (barcodeElement && sampleData.barcode_code) {
                        JsBarcode(barcodeElement, sampleData.barcode_code, {
                            format: barcodeSettings.format,
                            width: barcodeSettings.width,
                            height: barcodeSettings.height,
                            fontSize: barcodeSettings.fontSize,
                        });
                    }
                } catch (err) {
                    console.error('Error generating barcode:', err);
                }
            }, 100);
        } catch (err) {
            if (err.response?.data?.errors) {
                setValidationErrors(err.response.data.errors);
            } else {
                setValidationErrors([err.message || 'Error rendering preview']);
            }
            setPreviewHtml('');
        }
    };

    const handleTemplateSave = async () => {
        if (!template.trim()) {
            Swal.fire('Warning', 'Template cannot be empty', 'warning');
            return;
        }

        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('template', btoa(template)); // Base64 encode template
            formData.append('barcode_settings', JSON.stringify(barcodeSettings));

            await axios.post('/api/barcode-template', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Swal.fire({
                title: 'Success!',
                text: 'Barcode template updated successfully',
                icon: 'success',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to save template';
            const errors = err.response?.data?.errors || [];

            Swal.fire({
                title: 'Error',
                html: `
                    <div style="text-align: left;">
                        <p>${errorMessage}</p>
                        ${errors.length > 0 ? `<ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
                    </div>
                `,
                icon: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSampleDataChange = (field, value) => {
        setSampleData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const insertVariable = (variableName) => {
        const textarea = document.getElementById('template-textarea');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newTemplate = template.substring(0, start) + `{{${variableName}}}` + template.substring(end);
            setTemplate(newTemplate);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + variableName.length + 4;
                textarea.focus();
            }, 0);
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading template...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && (
                <Alert severity="error">{error}</Alert>
            )}

            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Barcode Template Editor
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Save Template">
                            <IconButton
                                size="large"
                                onClick={handleTemplateSave}
                                disabled={saving}
                                color="success"
                                sx={{
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    },
                                }}
                            >
                                <Save size={24} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset Template">
                            <IconButton
                                size="large"
                                onClick={fetchBarcodeTemplate}
                                disabled={saving}
                                color="info"
                                sx={{
                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    },
                                }}
                            >
                                <RotateCcw size={24} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Barcode Settings Accordion */}
                <Accordion defaultExpanded sx={{ mb: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            Barcode Format Settings
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
                                        Format
                                    </Typography>
                                    <select
                                        value={barcodeSettings.format}
                                        onChange={(e) => setBarcodeSettings({ ...barcodeSettings, format: e.target.value })}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid #ccc',
                                            fontFamily: 'inherit',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {barcodeFormats.map(format => (
                                            <option key={format} value={format}>{format}</option>
                                        ))}
                                    </select>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
                                        Width
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={barcodeSettings.width}
                                        onChange={(e) => setBarcodeSettings({ ...barcodeSettings, width: parseFloat(e.target.value) || 0 })}
                                        inputProps={{ step: 0.1, min: 0.5, max: 10 }}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
                                        Height
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={barcodeSettings.height}
                                        onChange={(e) => setBarcodeSettings({ ...barcodeSettings, height: parseInt(e.target.value) || 0 })}
                                        inputProps={{ step: 1, min: 10, max: 200 }}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#666' }}>
                                        Font Size
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={barcodeSettings.fontSize}
                                        onChange={(e) => setBarcodeSettings({ ...barcodeSettings, fontSize: parseInt(e.target.value) || 0 })}
                                        inputProps={{ step: 1, min: 8, max: 32 }}
                                        size="small"
                                        fullWidth
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                <Grid container spacing={3}>
                    {/* Left Column: Editor */}
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Template Editor */}
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                                Template HTML
                            </Typography>
                            <TextField
                                id="template-textarea"
                                multiline
                                fullWidth
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                placeholder="Enter HTML template with {{variable}} placeholders"
                                rows={12}
                                sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    backgroundColor: '#f5f5f5',
                                    '& .MuiOutlinedInput-input': {
                                        resize: 'vertical',
                                    },
                                }}
                                variant="outlined"
                            />
                        </Box>

                        {/* Accordions for Variables and Sample Data */}
                        <Box sx={{ mt: 1 }}>
                            <Accordion defaultExpanded sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                                <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                        Variables (Click to Insert)
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                        {allowedVariables.map(variable => (
                                            <Chip
                                                key={variable.name}
                                                label={`{{${variable.name}}}`}
                                                onClick={() => insertVariable(variable.name)}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                                sx={{ cursor: 'pointer' }}
                                                title={variable.description}
                                            />
                                        ))}
                                    </Stack>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', mt: 1 }}>
                                <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                        Sample Data for Preview
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 1 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                        {allowedVariables.map(variable => (
                                            <TextField
                                                key={variable.name}
                                                size="small"
                                                label={variable.name.replace(/_/g, ' ').toUpperCase()}
                                                value={sampleData[variable.name] || ''}
                                                onChange={(e) => handleSampleDataChange(variable.name, e.target.value)}
                                                placeholder={`{{${variable.name}}}`}
                                                fullWidth
                                            />
                                        ))}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    </Grid>

                    {/* Right Column: Preview */}
                    <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                            Live Preview
                        </Typography>

                        {validationErrors.length > 0 && (
                            <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem' }}>
                                    {validationErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}

                        <Card sx={{ backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
                            <CardContent sx={{ overflowY: 'auto', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                {previewHtml ? (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: 'white',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '4px',
                                            width: '100%',
                                            maxWidth: '320px',
                                            fontFamily: settings.sale_print_font || 'Arial, sans-serif',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: 'white',
                                            border: '1px dashed #cccccc',
                                            borderRadius: '4px',
                                            width: '100%',
                                            maxWidth: '320px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#999',
                                            textAlign: 'center',
                                            minHeight: '300px',
                                        }}
                                    >
                                        <Typography variant="body2">
                                            Enter template on the left to see preview
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f0f7ff', border: '1px solid #b3d9ff' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#0066cc' }}>
                    💡 Template Tips
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    • Use HTML and CSS to structure your barcode template
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    • Insert variables using double curly braces: <code>{"{{variable_name}}"}</code>
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    • For barcodes, create an SVG element with <code>id="barcode-svg"</code>
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                    • Click any variable chip on the left to insert it into your template
                </Typography>
            </Paper>
        </Box>
    );
};

export default BarcodeTemplateEditor;
