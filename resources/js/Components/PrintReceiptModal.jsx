import React, { useEffect } from "react";
import { Dialog, CircularProgress, Box } from "@mui/material";
import { ReceiptDisplay } from "@/Pages/Sale/ReceiptDisplay";

export default function PrintReceiptModal({
    open,
    onClose,
    receiptData,
}) {
    const isLoading = !receiptData;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            hideBackdrop={true}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        display: "none", // Hide the modal visually
                    }
                }
            }}
        >
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 4,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <ReceiptDisplay
                    sale={receiptData?.sale}
                    salesItems={receiptData?.salesItems}
                    settings={receiptData?.settings}
                    user_name={receiptData?.user_name}
                    credit_sale={false}
                    autoTriggerPrint={true}
                    hideActionButtons={true}
                />
            )}
        </Dialog>
    );
}
