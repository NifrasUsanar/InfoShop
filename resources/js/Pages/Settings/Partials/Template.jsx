import React from 'react';
import { Box, Button,  Grid, Paper, TextField, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import TinyMCEEditor from '@/Components/TinyMCEEditor';

const Template = () => {
    const [templateContent, setTemplateContent] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState("");

    const handleSubmit = () => {
        if (!selectedTemplate) {
            Swal.fire("Warning", "Template name is not selected", "warning");
            return;
        }

        axios.post('/settings/save-template', { template_name: selectedTemplate, template: templateContent })
            .then(response => {
                Swal.fire({
                    position: 'bottom-end',
                    title: "Success",
                    text: "Template updated successfully!",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                    toast: true,
                });
            })
            .catch(error => {
                Swal.fire("Error", error.message, "error");
            });
    }

    const handleTemplateChange = (value) => {
        axios.post('/settings/get-template', { template_name: value })
            .then(response => {
                setTemplateContent(response.data.template);
                setSelectedTemplate(value);
            })
            .catch(error => {
                console.error(error);
            });
    }

    return (
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
                sx={{ width: { xs: "100%", sm: "80%" }, flexDirection: 'column' }}
            >
                <Grid container size={12} spacing={2}>
                    <Paper sx={{ padding: { xs: '0.5rem', sm: "1rem" }, marginBottom: "1rem", width: '100%' }}>
                        <Grid size={12} container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    id="template"
                                    name="template"
                                    select
                                    label="Template"
                                    value={selectedTemplate}
                                    onChange={(event) => handleTemplateChange(event.target.value)}
                                    fullWidth
                                >
                                    <MenuItem value="invoice-template">Invoice Template</MenuItem>
                                    <MenuItem value="quotation-template">Quotation Template</MenuItem>
                                    {/* <MenuItem value="receipt-template">Receipt Template</MenuItem>
                                    <MenuItem value="barcode-template">Barcode Template</MenuItem> */}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid
                    size={12}
                    sx={{ display: "flex", justifyContent: "end" }}
                >
                    <Button
                        type="submit"
                        variant="outlined"
                        size="large"
                        color="success"
                        onClick={handleSubmit}
                        fullWidth
                    >
                        UPDATE
                    </Button>
                </Grid>
                    <TinyMCEEditor content={templateContent} setContent={setTemplateContent} selectedTemplate={selectedTemplate}/>
            </Grid>
        </Box>
    );
};

export default Template;
