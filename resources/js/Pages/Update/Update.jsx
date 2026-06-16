import * as React from "react";
import { useState, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
    Typography,
     Grid,
    Button,
    Paper,
} from "@mui/material";

import Swal from "sweetalert2";
import axios from "axios";
import { useDropzone } from 'react-dropzone';

export default function Update() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false)

    const onDrop = useCallback((acceptedFiles) => {
        // Only set the file if it's a zip file and not already selected
        if (acceptedFiles[0].name.endsWith('.zip')) {
            setFile(acceptedFiles[0]);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Only zip files are allowed',
            });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: '.zip', // Only accept zip files
        multiple: false, // Only one file allowed
    });

    const handleUpload = async (event) => {
        event.preventDefault();
        if (loading) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('zip_file', file);

        try {
            const response = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Swal.fire({
                title: 'Success!',
                text: response.data.success,
                icon: 'success',
                confirmButtonText: 'OK',
            }).then(() => {
                axios.get('/clear-cache');
            });

        } catch (error) {
            console.log(error);
            Swal.fire({
                title: 'Error!',
                text: error.response.data.error,
                icon: 'error',
                confirmButtonText: 'OK',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Update
                </h2>
            }
        >
            <Head title="Update" />
            <Grid container sx={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <Grid spacing={2} size={6}>
                  {/* Dropzone area */}
                <div
                    {...getRootProps()}
                    style={{
                        border: '2px dashed #3f51b5',
                        padding: '30px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        height: "150px",
                        justifyContent: "center",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <Typography>Drop the zip file here...</Typography>
                    ) : (
                        <Typography>Drag 'n' drop a zip file here, or click to select one</Typography>
                    )}
                </div>

                {/* If a file is selected, show details */}
                {file && (
                    <Paper elevation={3} style={{ padding: '10px', marginTop: '20px' }}>
                        <Typography variant="h6">Selected File:</Typography>
                        <Typography>{file.name}</Typography>
                    </Paper>
                )}

                {/* Optionally, you can add a button to remove the file */}
                {file && (
                    <Grid container spacing={2} style={{ marginTop: '10px' }}>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setFile(null)}
                        >
                            Remove File
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                    </Grid>
                )}
                </Grid>
                
            </Grid>

        </AuthenticatedLayout>
    );
}
