import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    AppBar,
    Box,
    Breadcrumbs,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    Toolbar,
    Typography,
    Grid,
    Link as MuiLink,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { Folder, FolderOpen } from "lucide-react";
import { Button } from "@mui/material";

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
import CollectionItem from "./Partial/CollectionItem";
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
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    zIndex: "999",
}));

function POS({ products, customers, return_sale, categories, edit_sale, sale_data, default_charges, all_collections }) {
    const cartType = edit_sale ? 'sale_edit_cart' : (return_sale ? 'sales_return_cart' : 'sales_cart');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [dataProducts, setDataProducts] = useState(products);
    const [templates, setTemplates] = useState([]);
    const [viewMode, setViewMode] = useState('products'); // 'products' or 'collections'
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [selectedChildCategories, setSelectedChildCategories] = useState([]);
    const [tabValue, setTabValue] = useState(0);

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

    const handleCollectionClick = async (collection) => {
        try {
            // Fetch products for this collection (parent or child)
            const payload = { collection_id: collection.id };
            const response = await axios.post(`/pos/filter`, payload);

            setDataProducts(response.data);
            setTemplates([]);
            setSelectedCollection(collection);

            // Show child categories if this collection has children
            if (collection.children && collection.children.length > 0) {
                setSelectedChildCategories(collection.children);
            } else {
                setSelectedChildCategories([]);
            }

            setViewMode('products');
        } catch (error) {
            console.error("Error fetching products for collection:", error);
        }
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        // If switching view mode via bottom bar (tabs), clear selected collection and child categories
        if (mode === 'products' || mode === 'collections') {
            setSelectedCollection(null);
            setSelectedChildCategories([]);
        }
    };

    const drawer = (
        <>
            <Box
                component="form"
                action="/pos"
                method="post"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    p: 2,
                    pb: 0
                }}
            >
                {/* Top Group: CartItemsTop + Items + Summary */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0
                    }}
                >
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <CartItemsTop customers={customers} />
                    </Box>
                    <Divider />
                    <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                        {/* Cart Items - List of all items */}
                        <CartItems />
                        {/* Cart Summary - Total and discount area */}
                        <CartSummary />
                    </Box>
                </Box>

                {/* Bottom Group: Footer Buttons */}
                <DrawerFooter sx={{ flexShrink: 0, mt: 2 }}>
                    {/* Cart footer - Buttons */}
                    <CartFooter />
                </DrawerFooter>
            </Box>
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

                        <a href="/pos-offline">
                            <IconButton
                                color="inherit"
                                sx={{
                                    ml: 0,
                                    p: "10px",
                                    color: "default",
                                    "& .MuiSvgIcon-root": {
                                        fontSize: 30,
                                    },
                                }}
                                type="button"
                                title="Offline Mode"
                            >
                                <WifiOffIcon />
                            </IconButton>
                        </a>

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

                        {/* Breadcrumb Navigation */}
                        {viewMode === 'products' && selectedCollection && (
                            <Grid size={12} sx={{ mb: 2 }}>
                                <Breadcrumbs separator="/" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <MuiLink
                                        component="button"
                                        variant="body2"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedCollection(null);
                                            setSelectedChildCategories([]);
                                            if (tabValue === 0) {
                                                setDataProducts(products);
                                            }
                                        }}
                                        sx={{ cursor: 'pointer', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                    >
                                        <HomeIcon sx={{ fontSize: '18px' }} />
                                        Home
                                    </MuiLink>
                                    {selectedCollection.parent_id && (
                                        <MuiLink
                                            component="button"
                                            variant="body2"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const parentCollection = all_collections?.find(c => c.id === selectedCollection.parent_id);
                                                if (parentCollection) {
                                                    handleCollectionClick(parentCollection);
                                                }
                                            }}
                                            sx={{ cursor: 'pointer', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                        >
                                            <Folder size={18} />
                                            {all_collections?.find(c => c.id === selectedCollection.parent_id)?.name}
                                        </MuiLink>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary', fontWeight: 'bold' }}>
                                        <FolderOpen size={18} />
                                        {selectedCollection.name}
                                    </Box>
                                </Breadcrumbs>
                            </Grid>
                        )}

                        {viewMode === 'products' && (
                            <>
                                {/* Display child categories if parent is selected */}
                                {selectedChildCategories && selectedChildCategories.length > 0 && (
                                    <>
                                        <Grid size={12} sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                Subcategories
                                            </Typography>
                                        </Grid>
                                        {selectedChildCategories.map((child) => (
                                            <Grid
                                                key={child.id}
                                                size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                                                sx={{ p: 1 }}
                                            >
                                                <CollectionItem
                                                    collection={child}
                                                    onClick={handleCollectionClick}
                                                    hasChildren={child.children && child.children.length > 0}
                                                />
                                            </Grid>
                                        ))}
                                        <Grid size={12} sx={{ my: 2 }}>
                                            <Divider />
                                        </Grid>
                                    </>
                                )}

                                {/* Display products */}
                                {dataProducts?.map((product) => (
                                    <Grid
                                        key={product.id + product.batch_number}
                                        size={{ xs: 6, sm: 6, md: 2 }}
                                        sx={{ cursor: "pointer", }}
                                    >
                                        <ProductItem product={product}></ProductItem>
                                    </Grid>
                                ))}
                            </>
                        )}

                        {/* Collections Grid - Displayed below featured items (Tab 0) when no specific collection is selected */}
                        {tabValue === 0 && !selectedCollection && (
                            <>
                                <Grid size={12} sx={{ mt: 4, mb: 2 }}>
                                    <Divider textAlign="left">
                                        <Typography variant="h6" color="text.secondary">
                                            Collections
                                        </Typography>
                                    </Divider>
                                </Grid>
                                {all_collections?.map((collection) => (
                                    <Grid
                                        key={collection.id}
                                        size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                                        sx={{ p: 1 }}
                                    >
                                        <CollectionItem
                                            collection={collection}
                                            onClick={handleCollectionClick}
                                            hasChildren={collection.children && collection.children.length > 0}
                                        />
                                    </Grid>
                                ))}
                            </>
                        )}

                        {/* Featured and categories */}
                        {!return_sale && (
                            <POSBottomBar
                                drawerWidth={drawerWidth}
                                categories={categories}
                                setProducts={setDataProducts}
                                setTemplates={setTemplates}
                                onViewModeChange={handleViewModeChange}
                                tabValue={tabValue}
                                onTabChange={setTabValue}
                            />
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
