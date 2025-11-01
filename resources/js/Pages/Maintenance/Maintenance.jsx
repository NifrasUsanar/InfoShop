import * as React from "react";
import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Box, Tabs, Tab } from "@mui/material";
import UpdateV2Tab from "./Tabs/UpdateV2Tab";
import DatabaseStructureTab from "./Tabs/DatabaseStructureTab";

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
                                <Tab label="System Update (V2)" />
                                <Tab label="Database Management" />
                            </Tabs>
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {activeTab === 0 && <UpdateV2Tab />}
                            {activeTab === 1 && <DatabaseStructureTab />}
                        </Box>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
