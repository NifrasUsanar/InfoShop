import { useEffect, useState } from 'react';
import { Card, CardContent, Box } from '@mui/material';
import JsBarcode from 'jsbarcode';

const BarcodePreview = ({ template, barcodeSettings, templateData, maxHeight = '600px', maxWidth = '320px', isPrint = false }) => {
    const [previewHtml, setPreviewHtml] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const renderPreview = async () => {
            if (!template) {
                setPreviewHtml('');
                return;
            }

            try {
                // Simple variable replacement with safety checks
                let rendered = template;
                
                if (templateData) {
                    Object.entries(templateData).forEach(([key, value]) => {
                        rendered = rendered.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            value ? String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
                        );
                    });
                }

                // Remove any unused variables
                rendered = rendered.replace(/\{\{(\w+)\}\}/g, '');

                setPreviewHtml(rendered);
                setError(null);

                // Generate barcode if barcode SVG element is present
                setTimeout(() => {
                    try {
                        const barcodeElement = document.getElementById('barcode-svg');
                        if (barcodeElement && templateData?.barcode_code) {
                            JsBarcode(barcodeElement, templateData.barcode_code, {
                                format: barcodeSettings?.format || 'CODE128',
                                width: barcodeSettings?.width || 2,
                                height: barcodeSettings?.height || 35,
                                fontSize: barcodeSettings?.fontSize || 14,
                            });
                        }
                    } catch (err) {
                        console.error('Error generating barcode:', err);
                    }
                }, 100);
            } catch (err) {
                console.error('Error rendering template:', err);
                setError('Failed to render template');
                setPreviewHtml('');
            }
        };

        renderPreview();
    }, [template, barcodeSettings, templateData]);

    return (
        <Card sx={{
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            maxHeight,
            '@media print': {
                backgroundColor: 'white',
                boxShadow: 'none',
                border: 'none',
            },
        }}>
            <CardContent sx={{
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                '@media print': {
                    p: 0,
                    backgroundColor: 'white',
                },
            }}>
                {error ? (
                    <Box sx={{ color: 'error.main', textAlign: 'center' }}>
                        {error}
                    </Box>
                ) : previewHtml ? (
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            width: '100%',
                            maxWidth,
                            '@media print': {
                                p: 0,
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: 0,
                            },
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
                            maxWidth,
                            color: '#999',
                            textAlign: 'center',
                        }}
                    >
                        No preview available
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default BarcodePreview;
