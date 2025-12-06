import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Box, Tabs, Tab } from "@mui/material";
import ArchiveIcon from "@mui/icons-material/Archive";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StorageIcon from "@mui/icons-material/Storage";
import UpdateV2Tab from "./Tabs/UpdateV2Tab";
import DatabaseStructureTab from "./Tabs/DatabaseStructureTab";
import BackupFilesTab from "./Tabs/BackupFilesTab";

export default function Maintenance() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Maintenance
                </h2>
            }
        >
            <Head title="Maintenance" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                sx={{
                                    backgroundColor: '#f9fafb',
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#2563eb',
                                    }
                                }}
                            >
                                <Tab
                                    icon={<CloudUploadIcon />}
                                    iconPosition="start"
                                    label={
                                        <span className="hidden sm:inline">System Update (V2)</span>
                                    }
                                    sx={{
                                        minWidth: 'auto',
                                        px: { xs: 1.5, sm: 2 }
                                    }}
                                />
                                <Tab
                                    icon={<StorageIcon />}
                                    iconPosition="start"
                                    label={
                                        <span className="hidden sm:inline">Database Management</span>
                                    }
                                    sx={{
                                        minWidth: 'auto',
                                        px: { xs: 1.5, sm: 2 }
                                    }}
                                />
                                <Tab
                                    icon={<ArchiveIcon />}
                                    iconPosition="start"
                                    label={
                                        <span className="hidden sm:inline">Backup Files</span>
                                    }
                                    sx={{
                                        minWidth: 'auto',
                                        px: { xs: 1.5, sm: 2 }
                                    }}
                                />
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {activeTab === 0 && <UpdateV2Tab />}
                            {activeTab === 1 && <DatabaseStructureTab />}
                            {activeTab === 2 && <BackupFilesTab />}
                        </Box>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
