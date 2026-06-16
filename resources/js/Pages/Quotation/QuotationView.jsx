import React, { useEffect, useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Box,  Grid, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import Swal from 'sweetalert2';
import Alpine from 'alpinejs';
import numeral from 'numeral';
import Mustache from 'mustache';
const QuotationView = ({ quotation, template }) => {
    const [renderedTemplate, setRenderedTemplate] = useState('');

    useEffect(() => {
        const renderTemplate = async () => {
            try {
                // e.g. {{quotation.name}} will render "Sample Quotation"
                // e.g. {{#quotation.items}}<p>{{name}}: {{price}}</p>{{/quotation.items}}
                const renderedTemplate = Mustache.render(template, {quotation:quotation});
                setRenderedTemplate(renderedTemplate);
                if (!window.Alpine || !window.Alpine.version) {
                    window.Alpine = Alpine
                    Alpine.start();
                }
            } catch (error) {
                console.error("Error rendering template:", error);
                Swal.fire('Error', 'Failed to render template', 'error');
            }
        };
        renderTemplate();
    }, [quotation.template]);

    return (
        <>
            <Head title="Quotation" />
            <Grid container spacing={2} sx={{ justifyContent: "center", margin: '20px 0' }}>
                <Grid size={12} style={{ textAlign: 'center' }}>
                    <div className="no-print print:hidden">
                        <Button
                            variant="contained"
                            endIcon={<PrintIcon />}
                            onClick={() => window.print()}
                        >
                            Print
                        </Button>
                    </div>
                </Grid>
                <Grid size={12} style={{ marginTop: '20px' }}>
                    <Box dangerouslySetInnerHTML={{ __html: renderedTemplate }} />
                </Grid>
            </Grid>
        </>

    );
};

export default QuotationView;
