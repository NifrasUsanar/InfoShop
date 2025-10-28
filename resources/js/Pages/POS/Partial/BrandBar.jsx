import React, { useState } from "react";
import { Box, Tabs, Tab, AppBar } from "@mui/material";
import axios from "axios";

export default function BrandBar({ brands, setProducts, setTemplates }) {
  const [active, setActive] = useState(0);

  const handleTabChange = async (event, newValue) => {
    setActive(newValue);
    try {
      setTemplates([]);
      const payload = newValue && newValue !== 0 ? { brand_id: newValue } : { all_products: true };
      const response = await axios.post(`/pos/filter`, payload);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products by brand:", err);
    }
  };

  return (
    // <Box sx={{ bgcolor: '#000', color: '#fff', borderRadius: 1, mb: 1 }}>
    <AppBar position="fixed" sx={{ top: '80px', bottom: 'auto', mb: 1 }}>
      <Tabs
        value={active}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: 'white' } }}
        sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}
      >
        <Tab label="All Brands" value={0} sx={{ color: '#fff' }} />
        {brands?.map((b) => (
          <Tab key={b.id} label={b.name} value={b.id} sx={{ color: '#fff' }} />
        ))}
      </Tabs>
    </AppBar>
  );
}

