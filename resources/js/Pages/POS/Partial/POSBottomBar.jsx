import React, { useContext, useState } from "react";
import { Typography, Toolbar, Box, AppBar, Tab, Tabs } from "@mui/material";

import axios from "axios";

export default function POSBottomBar({ setProducts, drawerWidth, categories, setTemplates }) {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = async (event, newValue) => {
        setTabValue(newValue);

        if (newValue === 'template') {
            setProducts([]);
            const response = await axios.get(`/sale-templates`);
            setTemplates(response.data);
        }
        else {
            try {
                const response = await axios.post(`/pos/filter`, { category_id: newValue });
                setTemplates([])
                setProducts(response.data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        }
    };

    return (
        <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, left: 0, width: { sm: `calc(100% - ${drawerWidth}px)` }, padding: 1, }}>
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons
                textColor="inherit"
                TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
            >
                <Tab label="Featured" value={0} />
                <Tab label="Group Items" value={'template'} />
                {categories.map((category) => (
                    <Tab key={category.id} label={category.name} value={category.id} />
                ))}
            </Tabs>
        </AppBar>
    );
}
