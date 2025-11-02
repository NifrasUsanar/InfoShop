import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Box, Button, CircularProgress } from '@mui/material';
import { Printer } from 'lucide-react';
import BarcodePreview from '@/Components/BarcodePreview';

export default function ProductBarcodeV2({ product }) {
    const [barcodeSettings, setBarcodeSettings] = useState({
        format: 'CODE128',
        width: 2,
        height: 35,
        fontSize: 14,
    });
    const [template, setTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const shop_name = usePage().props.settings.shop_name;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/barcode-template');
                const data = await response.json();
                setTemplate(data.template || '');
                if (data.barcode_settings) {
                    setBarcodeSettings(data.barcode_settings);
                }
            } catch (error) {
                console.error('Error fetching barcode template:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const templateData = {
        product_name: product.name || '',
        price: product.selling_price ? `${product.selling_price}` : '',
        barcode_code: product.barcode || product.batch_number || '',
        store_name: shop_name || '',
        date: new Date().toLocaleDateString(),
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <Head title={`Barcode - ${product.name}`} />
            <Box sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                '@media print': {
                    p: 0,
                    gap: 0,
                },
            }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Printer size={20} />}
                    onClick={handlePrint}
                    sx={{
                        mb: 2,
                        '@media print': {
                            display: 'none',
                        },
                    }}
                >
                    Print Barcode
                </Button>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        '@media print': {
                            p: 0,
                            m: 0,
                            background: 'white',
                        },
                    }}
                >
                    <BarcodePreview
                        template={template}
                        barcodeSettings={barcodeSettings}
                        templateData={templateData}
                        maxHeight="none"
                        maxWidth="400px"
                        isPrint={true}
                    />
                </Box>
            </Box>
        </>
    );
}
