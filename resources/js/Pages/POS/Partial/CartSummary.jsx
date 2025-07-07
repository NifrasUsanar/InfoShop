import React, { useEffect, useState, useContext } from "react";
import List from "@mui/material/List";
import { ListItem, TextField, Divider, Typography, MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import numeral from "numeral";
import { useSales as useCart } from '@/Context/SalesContext';
import { usePage } from "@inertiajs/react";

export default function CartSummary() {
    const taxAndFees = usePage().props.taxAndFees;
    const { cartState, cartTotal, totalQuantity, selectedBillType, setSelectedBillType, setTaxesAndFees, appliedTaxesAndFees } = useCart();

    useEffect(() => {
        setTaxesAndFees(taxAndFees);
    }, []);

    return (
        <List sx={{ width: "100%", bgcolor: "background.paper", }}>
            <Divider
                sx={{
                    borderBottom: "2px dashed",
                    borderColor: "grey.500",
                    my: "1.5rem",
                }}
            />
            <ListItem
                secondaryAction={
                    <TextField
                        select
                        variant="standard"
                        value={selectedBillType}
                        onChange={(e) => {
                            setSelectedBillType(e.target.value);
                        }}
                    >
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="tax">Tax applied</MenuItem>
                    </TextField>
                }
            >
                <ListItemText primary="Bill type" />
            </ListItem>

            <ListItem
                secondaryAction={
                    <Typography variant="h5" color="initial" sx={{ fontSize: { sm: '1rem', xs: '1.2rem' } }}>
                        <strong>{cartState.length} | Qty. {totalQuantity}</strong>
                    </Typography>
                }
            >
                <ListItemText primary="Total Items" />
            </ListItem>

            {selectedBillType === "tax" && (
                <>
                    {Object.entries(appliedTaxesAndFees).map(([name, amount]) => (
                        <ListItem
                            key={name}
                            secondaryAction={
                                <Typography
                                    variant="h6"
                                    color="initial"
                                    sx={{ fontSize: { sm: "1rem", xs: "1.2rem" } }}
                                >
                                    Rs.{numeral(amount).format("0,0.00")}
                                </Typography>
                            }
                        >
                            <ListItemText primary={name} />
                        </ListItem>
                    ))}
                </>
            )}

            <ListItem
                secondaryAction={
                    <Typography variant="h5" color="initial" sx={{ fontSize: { sm: '1rem', xs: '1.2rem' } }}>
                        {/* Rs.{(cartTotal-discount).toFixed(2)} */}
                        <strong>Rs.{numeral(cartTotal).format('0,00.00')}</strong>
                    </Typography>
                }
            >
                <ListItemText primary="Total" />
            </ListItem>
        </List>
    );
}
