import React, { useContext, useState } from "react";
import { Typography, Toolbar, Box, AppBar, Tab, Tabs } from "@mui/material";
import { getProductsByCategory, getFeaturedProducts } from "../services/productsService";

export default function POSBottomBar({
    setProducts,
    drawerWidth,
    categories,
    setTemplates,
    onViewModeChange,
    tabValue,
    onTabChange,
    allProducts = [],
    allTemplates = []
}) {

    const handleTabChange = async (event, newValue) => {
        onTabChange(newValue);

        if (newValue === 'template') {
            // Phase 1: Use provided templates (will be from Dexie in Phase 2)
            setProducts([]);
            setTemplates(allTemplates);
            if (onViewModeChange) onViewModeChange('products');
        }
        else {
            // Phase 2: Use Dexie for filtering
            setTemplates([]);

            try {
                if (newValue === 0) {
                    // Featured products from Dexie
                    const featured = await getFeaturedProducts();
                    setProducts(featured);
                } else {
                    // Filter by category from Dexie
                    const filtered = await getProductsByCategory(newValue);
                    setProducts(filtered);
                }

                if (onViewModeChange) onViewModeChange('products');
            } catch (error) {
                console.error('Error filtering products:', error);
            }
        }
    };

    return (
        <AppBar position="fixed" color="primary" sx={{ top: 'auto', bottom: 0, left: 0, width: { sm: `calc(100% - ${drawerWidth}px)` }, padding: 1 }}>
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
