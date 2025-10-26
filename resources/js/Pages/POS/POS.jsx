import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    Toolbar,
    Typography,
     Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";

import ProductItem from "./Partial/ProductItem";
import CartItems from "./Partial/CartItem";
import CartSummary from "./Partial/CartSummary";
import CartFooter from "./Partial/CartFooter";
import SearchBox from "./Partial/SearchBox";
import CartIcon from "./Partial/CartIcon";

import { SalesProvider } from "@/Context/SalesContext";
import CartItemsTop from "./Partial/CartItemsTop";
import POSBottomBar from "./Partial/POSBottomBar";
import SaleTemplateItem from "./SaleTemplate/SaleTemplateItems";
import Swal from "sweetalert2";

const drawerWidth = 530;

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
}));

const DrawerFooter = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    zIndex: "999",
}));

function POS({ products, customers, return_sale, categories, edit_sale, sale_data, default_charges }) {
    const cartType = edit_sale ? 'sale_edit_cart' : (return_sale ? 'sales_return_cart' : 'sales_cart');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [dataProducts, setDataProducts] = useState(products);
    const [templates, setTemplates] = useState([]);

    const handleDrawerClose = () => {
        setIsClosing(true);
        setMobileOpen(false);
    };

    const handleDrawerTransitionEnd = () => {
        setIsClosing(false);
    };

    const handleDrawerToggle = () => {
        if (!isClosing) {
            setMobileOpen(!mobileOpen);
        }
    };

    useEffect(() => {
        if (cartType === "sales_return_cart") {
            localStorage.setItem('sales_return_cart', JSON.stringify([]));
        }

        if (cartType === "sale_edit_cart") {
            localStorage.setItem('sale_edit_cart', JSON.stringify([]));
        }
    }, [cartType])

    useEffect(() => {
        if (edit_sale && !sale_data.cart_snapshot) {
            Swal.fire({
                title: 'Only recent sales can be edited',
                text: 'Please select a recent sale to edit',
                icon: 'error',
                confirmButtonText: 'Go to Sales',
                showCancelButton: false,
                showCloseButton: false,
                allowOutsideClick: false
            }).then(() => {
                router.get("/sales")
            })
        }
    })


    // useEffect(() => {
    //     document.addEventListener("keydown", detectKyDown, true);
    // },[])

    // const detectKyDown = (e) => {
    //     console.log(e.key);
    // }

    const drawer = (
        <>
            <form
                action="/pos"
                method="post"
                className="p-2 h-[calc(100vh-80px)]"
            >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <CartItemsTop customers={customers} />
                </Box>
                <Divider />
                <Box
                    className="flex flex-col overflow-auto h-full"
                >
                    <Box className="flex-grow">
                        {/* Cart Items - List of all items */}
                        <CartItems />
                        {/* Cart Summary - Total and discount area */}
                        <CartSummary />
                    </Box>
                    <DrawerFooter>
                        {/* Cart footer - Buttons */}
                        <CartFooter />
                    </DrawerFooter>
                </Box>

            </form>
        </>
    );

    return (
        <SalesProvider cartType={cartType} defaultCharges={default_charges}>
            <Head title="Point of Sale" />
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <AppBar
                    position="fixed"
                    sx={{
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                        mr: { sm: `${drawerWidth}px` },
                    }}
                >
                    <Toolbar sx={{ paddingY: "10px" }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 0, display: { sm: "none" } }}
                        >
                            <CartIcon></CartIcon>
                        </IconButton>
                        <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                            <Typography variant="h4" noWrap component="div">
                                POS
                            </Typography>
                        </Box>
                        {/* Product Search Box  */}

                        <SearchBox></SearchBox>

                        <Link href="/dashboard">
                            <IconButton
                                color="inherit"
                                sx={{
                                    ml: 0,
                                    p: "10px",
                                    color: "default", // Unchecked color
                                    "& .MuiSvgIcon-root": {
                                        fontSize: 30, // Customize icon size
                                    },
                                }}
                                type="button"
                            >
                                <HomeIcon />
                            </IconButton>
                        </Link>

                    </Toolbar>
                </AppBar>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                    }}
                >
                    <Toolbar />

                    {/* Product items area  */}
                    <Grid container spacing={1} sx={{ mb: 8 }}>
                        <SaleTemplateItem templates={templates} setTemplates={setTemplates} />
                        {dataProducts?.map((product) => (
                            <Grid
                                key={product.id + product.batch_number}
                                size={{ xs: 6, sm: 6, md: 2 }}
                                sx={{ cursor: "pointer", }}
                            >
                                <ProductItem product={product}></ProductItem>
                            </Grid>
                        ))}

                        {/* Featured and categories */}
                        {!return_sale && (
                            <POSBottomBar drawerWidth={drawerWidth} categories={categories} setProducts={setDataProducts} setTemplates={setTemplates} />
                        )}
                    </Grid>
                </Box>
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    {/* Mobile Drawer */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onTransitionEnd={handleDrawerTransitionEnd}
                        onClose={handleDrawerClose}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                        sx={{
                            display: { xs: "block", sm: "none" },
                            "& .MuiDrawer-paper": {
                                boxSizing: "border-box",
                                width: "100%",
                            },
                        }}
                        anchor="right"
                    >
                        <DrawerHeader>
                            <CartItemsTop customers={customers} />
                            <IconButton onClick={handleDrawerClose}>
                                <ChevronLeftIcon />
                            </IconButton>
                        </DrawerHeader>
                        {drawer}
                    </Drawer>

                    {/* Desktop drawer */}
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: "none", sm: "block" },
                            "& .MuiDrawer-paper": {
                                boxSizing: "border-box",
                                width: drawerWidth,
                            },
                        }}
                        open
                        anchor="right"
                    >
                        {drawer}
                    </Drawer>
                </Box>
            </Box>

        </SalesProvider>
    );
}

export default POS;
