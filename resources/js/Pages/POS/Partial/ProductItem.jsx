import React, { useContext } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { Typography, Box } from "@mui/material";
import { usePage } from "@inertiajs/react";

import { useSales as useCart } from "@/Context/SalesContext";
import { SharedContext } from "@/Context/SharedContext";
import productplaceholder from "@/Pages/Product/product-placeholder.webp";
import { useCurrencyFormatter } from "@/lib/currencyFormatter";

export default function ProductItem({ product }) {
    const return_sale = usePage().props.return_sale;
    const formatCurrency = useCurrencyFormatter();

    const { name, price, image_url, quantity, sku } = product;
    const brandName = product.brand_name || null;
    const { addToCart, cartState } = useCart();
    const { setCartItemModalOpen, setSelectedCartItem } = useContext(SharedContext);

    return (
        <Card
            onClick={() => {
                if (return_sale) product.quantity = -1;
                else product.quantity = 1;

                if (product.discount_percentage && Number(product.discount_percentage) !== 0) {
                    const discount = (product.price * product.discount_percentage) / 100;
                    product.discount = discount;
                }

                addToCart(product, product.quantity);

                if (product.product_type === "reload") {
                    const lastAddedIndex = cartState.length > 0 ? cartState.length : 0;
                    product.cart_index = lastAddedIndex;
                }

                setSelectedCartItem(product);
                setCartItemModalOpen(true);
            }}
            sx={{
                height: "100%",
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
                },
                "&:active": {
                    transform: "scale(0.98)",
                },
            }}
            elevation={2}
        >
            {/* Product Image */}
            <CardMedia
                sx={{
                    height: { xs: 80, sm: 110 },
                    objectFit: "cover",
                    position: "relative",
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))",
                    },
                }}
                image={image_url || productplaceholder}
                title={name}
            />

            {/* Product Name */}
            <CardContent
                sx={{
                    p: 1.2,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 600,
                        color: (theme) => theme.palette.text.primary,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                    }}
                >
                    {name}
                </Typography>
            </CardContent>

            {/* Price Tag */}
            {price > 0 && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        backgroundColor: "rgba(25,118,210,0.9)",
                        color: "white",
                        px: 1,
                        py: 0.3,
                        borderRadius: "5px",
                        fontSize: "0.80rem",
                        fontWeight: 600,
                        color: ""
                    }}
                >
                    {formatCurrency(price, false)}
                </Box>
            )}

            {/* Brand Label */}
            {brandName && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        color: "white",
                        px: 1,
                        py: 0.3,
                        borderRadius: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 500,
                        textTransform: "capitalize",
                    }}
                >
                    {brandName}
                </Box>
            )}
        </Card>
    );
}
