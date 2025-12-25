import React, { useState, useEffect } from "react";
import {
    AppBar,
    Alert,
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
    Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import HomeIcon from "@mui/icons-material/Home";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SyncIcon from "@mui/icons-material/Sync";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { Folder, FolderOpen } from "lucide-react";
import { Button, CircularProgress, Tooltip } from "@mui/material";

import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getProductsByCollection, getAllProducts } from "./services/productsService";
import { useSyncContext } from "./contexts/SyncContext";

import ProductItem from "./Partial/ProductItem";
import CartItems from "./Partial/CartItem";
import CartSummary from "./Partial/CartSummary";
import CartFooter from "./Partial/CartFooter";
import SearchBox from "./Partial/SearchBox";
import CartIcon from "./Partial/CartIcon";
import UnsyncedSalesDialog from "./Partial/UnsyncedSalesDialog";

import { SalesProvider } from "@/Context/SalesContext";
import CartItemsTop from "./Partial/CartItemsTop";
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

function POS({ products, allProducts, customers, return_sale, categories, edit_sale, sale_data, default_charges, all_collections, onProductsUpdate }) {
    const cartType = edit_sale ? 'sale_edit_cart' : (return_sale ? 'sales_return_cart' : 'sales_cart');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [dataProducts, setDataProducts] = useState(products); // Featured products for display
    const [templates, setTemplates] = useState([]);
    const [viewMode, setViewMode] = useState('products'); // 'products' or 'collections'
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [selectedChildCategories, setSelectedChildCategories] = useState([]);
    const [showUnsyncedSales, setShowUnsyncedSales] = useState(false);
    const isOnline = useNetworkStatus();
    const { syncState, startSync, resetSync } = useSyncContext();

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
        if (edit_sale && sale_data && !sale_data.cart_snapshot) {
            Swal.fire({
                title: 'Only recent sales can be edited',
                text: 'Please select a recent sale to edit',
                icon: 'error',
                confirmButtonText: 'Go to Sales',
                showCancelButton: false,
                showCloseButton: false,
                allowOutsideClick: false
            }).then(() => {
                window.location.href = "/sales";
            })
        }
    }, [edit_sale, sale_data])


    // useEffect(() => {
    //     document.addEventListener("keydown", detectKyDown, true);
    // },[])

    // const detectKyDown = (e) => {
    //     console.log(e.key);
    // }

    const handleSync = async () => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        if (!isOnline) {
            Toast.fire({
                icon: 'warning',
                title: 'No Internet Connection',
                text: 'Please connect to sync products',
            });
            return;
        }

        try {
            const result = await startSync(async (freshProducts) => {
                // Update parent component if callback provided (this handles allProducts and featuredProducts)
                if (onProductsUpdate) {
                    onProductsUpdate(freshProducts);
                }

                // Reset view to show featured products only
                const featured = freshProducts.filter(p => p.is_featured === true || p.is_featured === 1);
                setDataProducts(featured);
                setSelectedCollection(null);
                setSelectedChildCategories([]);
            });

            if (result.success) {
                const { productCount, chargeCount, collectionCount, contactCount } = result;
                Toast.fire({
                    icon: 'success',
                    title: 'Sync Complete!',
                    text: `Synced: ${productCount} products, ${chargeCount} charges, ${collectionCount} collections, ${contactCount} contacts`,
                });
            } else {
                throw new Error(result.error || 'Sync failed');
            }
        } catch (error) {
            console.error('Sync error:', error);
            Toast.fire({
                icon: 'error',
                title: 'Sync Failed',
                text: error.message || 'Failed to sync',
            });
        }
    };

    const handleResetSync = async () => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        if (!isOnline) {
            Toast.fire({
                icon: 'warning',
                title: 'No Internet Connection',
                text: 'Please connect to reset and sync',
            });
            return;
        }

        // Confirm reset
        const result = await Swal.fire({
            title: 'Reset Sync Data?',
            text: 'This will clear all cached products and sync fresh data from the server.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset and sync',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            Toast.fire({
                icon: 'info',
                title: 'Resetting...',
                text: 'Clearing cached data',
            });

            const resetResult = await resetSync(async (freshProducts) => {
                // Update parent component if callback provided (this handles allProducts and featuredProducts)
                if (onProductsUpdate) {
                    onProductsUpdate(freshProducts);
                }

                // Reset view to show featured products only
                const featured = freshProducts.filter(p => p.is_featured === true || p.is_featured === 1);
                setDataProducts(featured);
                setSelectedCollection(null);
                setSelectedChildCategories([]);
            });

            if (resetResult.success) {
                const { productCount, chargeCount, collectionCount, contactCount } = resetResult;
                Toast.fire({
                    icon: 'success',
                    title: 'Reset Complete!',
                    text: `Synced: ${productCount} products, ${chargeCount} charges, ${collectionCount} collections, ${contactCount} contacts`,
                });
            } else {
                throw new Error(resetResult.error || 'Reset failed');
            }
        } catch (error) {
            console.error('Reset error:', error);
            Toast.fire({
                icon: 'error',
                title: 'Reset Failed',
                text: error.message || 'Failed to reset',
            });
        }
    };

    const handleCollectionClick = async (collection) => {
        try {
            // Filter from all products (not just featured)
            const filtered = await getProductsByCollection(collection.id);

            setDataProducts(filtered);
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
            console.error('Error loading collection products:', error);
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
                        {/* Product Search Box - searches all products */}

                        <SearchBox products={allProducts || products}></SearchBox>

                        {/* Sync Button */}
                        <Tooltip title={isOnline ? "Sync Products" : "No Internet Connection"}>
                            <span>
                                <IconButton
                                    color="inherit"
                                    onClick={handleSync}
                                    disabled={!isOnline || syncState.status === 'syncing'}
                                    sx={{
                                        ml: 1,
                                        p: "10px",
                                        color: "default",
                                        "& .MuiSvgIcon-root": {
                                            fontSize: 30,
                                        },
                                    }}
                                    type="button"
                                >
                                    {syncState.status === 'syncing' ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        <SyncIcon />
                                    )}
                                </IconButton>
                            </span>
                        </Tooltip>

                        <a href="/pos" style={{ textDecoration: 'none', color: 'inherit' }}>
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
                                title="Online Mode"
                            >
                                <WifiIcon />
                            </IconButton>
                        </a>

                        <a href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
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
                        </a>

                    </Toolbar>
                </AppBar>
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        pb: 12,
                        width: { sm: `calc(100% - ${drawerWidth}px)` },
                    }}
                >
                    <Toolbar />

                    {/* Product items area  */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
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
                                            // Reset to featured products only (use current products prop)
                                            if (!selectedCollection) {
                                                // Already on home, no need to update
                                                return;
                                            }
                                            setDataProducts(products);
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
                                        key={`${product.id}-${product.batch_id || product.batch_number}`}
                                        size={{ xs: 6, sm: 6, md: 2 }}
                                        sx={{ cursor: "pointer", }}
                                    >
                                        <ProductItem product={product}></ProductItem>
                                    </Grid>
                                ))}
                            </>
                        )}

                        {/* Collections Grid - Displayed when no specific collection is selected */}
                        {!selectedCollection && (
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
                    </Grid>

                    {/* Offline Mode Indicator - Fixed Bottom Bar */}
                    <AppBar
                        position="fixed"
                        sx={{
                            top: 'auto',
                            bottom: 0,
                            left: 0,
                            width: { sm: `calc(100% - ${drawerWidth}px)` },
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
                            p: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Alert
                            severity="warning"
                            icon={<WifiOffIcon />}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                backgroundColor: 'transparent',
                                color: '#856404',
                                border: 'none',
                                fontWeight: 500,
                                m: 0,
                                p: 0,
                                flex: 1,
                                '& .MuiAlert-icon': {
                                    mr: 1.5,
                                    p: 0,
                                },
                                '& .MuiAlert-message': {
                                    p: 0,
                                    ml: 0,
                                    textAlign: 'left',
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    OFFLINE MODE - All data is stored locally on this device
                                </Typography>

                                {/* Sync Status Messages */}
                                {syncState.status === 'syncing' && (
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 600 }}>
                                        🔄 Syncing: {syncState.progress}% - {syncState.message}
                                    </Typography>
                                )}

                                {syncState.status === 'success' && (
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9, color: '#155724', fontWeight: 600 }}>
                                        ✓ {syncState.message}
                                    </Typography>
                                )}

                                {syncState.status === 'error' && (
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.9, color: '#721c24', fontWeight: 600 }}>
                                        ✗ {syncState.message}
                                    </Typography>
                                )}

                                {syncState.status === 'idle' && syncState.lastSyncedAt && (
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                        Last synced: {new Date(syncState.lastSyncedAt).toLocaleString()} •
                                        Local: {syncState.localProducts} products, {syncState.localCharges} charges, {syncState.localCollections} collections, {syncState.localContacts} contacts
                                    </Typography>
                                )}
                            </Box>
                        </Alert>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                            {/* View Sales Button */}
                            <Tooltip title="View unsynced sales pending sync to server">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowUnsyncedSales(true)}
                                    startIcon={<ReceiptIcon />}
                                    sx={{
                                        borderColor: '#856404',
                                        color: '#856404',
                                        fontSize: '0.7rem',
                                        py: 0.5,
                                        px: 1,
                                        minWidth: 'auto',
                                        '&:hover': {
                                            borderColor: '#533f03',
                                            backgroundColor: 'rgba(133, 100, 4, 0.08)',
                                        },
                                    }}
                                >
                                    View Sales
                                </Button>
                            </Tooltip>

                            {/* Reset Sync Button */}
                            <Tooltip title="Clear cached data and sync fresh from server">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleResetSync}
                                        disabled={!isOnline || syncState.status === 'syncing'}
                                        startIcon={<SyncIcon />}
                                        sx={{
                                            borderColor: '#856404',
                                            color: '#856404',
                                            fontSize: '0.7rem',
                                            py: 0.5,
                                            px: 1,
                                            minWidth: 'auto',
                                            '&:hover': {
                                                borderColor: '#533f03',
                                                backgroundColor: 'rgba(133, 100, 4, 0.08)',
                                            },
                                            '&:disabled': {
                                                borderColor: 'rgba(133, 100, 4, 0.3)',
                                                color: 'rgba(133, 100, 4, 0.3)',
                                            },
                                        }}
                                    >
                                        Reset Sync
                                    </Button>
                                </span>
                            </Tooltip>

                            <Chip
                                icon={isOnline ? <WifiIcon sx={{ fontSize: '16px' }} /> : <WifiOffIcon sx={{ fontSize: '16px' }} />}
                                label={isOnline ? 'Connected' : 'No Internet'}
                                size="small"
                                sx={{
                                    backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
                                    color: isOnline ? '#155724' : '#721c24',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    '& .MuiChip-icon': {
                                        color: isOnline ? '#155724' : '#721c24',
                                    },
                                }}
                            />
                        </Box>
                    </AppBar>
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

            {/* Unsynced Sales Dialog */}
            <UnsyncedSalesDialog
                open={showUnsyncedSales}
                onClose={() => setShowUnsyncedSales(false)}
            />

        </SalesProvider>
    );
}

export default POS;
