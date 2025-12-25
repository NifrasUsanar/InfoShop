import React, { useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import BackHandIcon from "@mui/icons-material/BackHand";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddCardIcon from "@mui/icons-material/AddCard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import Grid from "@mui/material/Grid";

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme, useMediaQuery } from '@mui/material';
import { FolderCopy } from "@mui/icons-material";
import { styled, alpha } from '@mui/material/styles';

import { useSales as useCart } from "@/Context/SalesContext";
import { SharedContext } from "@/Context/SharedContext";
import { useAppConfig } from "../contexts/AppConfigContext";

import HeldItemsModal from "./HeldItemsModal";
import CheckoutModal from "./CheckoutModal";
// import PaymentsCheckoutDialog from "@/Components/PaymentsCheckoutDialog";
import QuotationDialog from "./QuotationDialog";
// import CashCheckoutDialog from "./CashCheckoutDialog";
import SaleTemplateDialog from "../SaleTemplate/SaleTemplateDialog";

import Swal from "sweetalert2";

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        [theme.breakpoints.down('sm')]: {
            width: "100%",
        },
        color: 'rgb(55, 65, 81)',
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
        },
        ...theme.applyStyles('dark', {
            color: theme.palette.grey[300],
        }),
    },
}));

export default function CartFooter() {
    const { return_sale, edit_sale } = useAppConfig();

    const { cartState, holdCart, emptyCart } = useCart();
    const { selectedCustomer, saleDate, saleTime } = useContext(SharedContext);
    const [heldModalOpen, setHeldModalOpen] = useState(false);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    // const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
    const [quotationModalOpen, setQuotationModalOpen] = useState(false);
    const [saleTemplateModalOpen, setSaleTemplateModalOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onCartHold = () => {
        handleClose();
        Swal.fire({
            title: "Do you want to hold this cart?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                holdCart();
            }
        });
    };

    const onCartEmpty = () => {
        Swal.fire({
            title: "Do you want to clear this cart?",
            showDenyButton: true,
            confirmButtonText: "YES",
            denyButtonText: `NO`,
        }).then((result) => {
            if (result.isConfirmed) {
                emptyCart();
            }
        });
    };

    return (
        <div className="w-full pb-4">
            <Grid
                container
                spacing={1}
                columns={12}
                sx={{ margin: 0, width: '100%' }}
            >
                {/* EMPTY Button - Desktop: 25% (3/12), Hidden on mobile */}
                {!isMobile && (
                    <Grid size={{ sm: 3 }}>
                        <Button
                            variant="contained"
                            color="error"
                            endIcon={<DeleteForeverIcon />}
                            disabled={
                                cartState.length === 0 || selectedCustomer === null
                            }
                            onClick={onCartEmpty}
                            size="large"
                            fullWidth
                        >
                            EMPTY
                        </Button>
                    </Grid>
                )}

                {/* MORE/ACTIONS Button - Desktop: 25% (3/12), Mobile: 100% (12/12) */}
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Button
                        id="demo-customized-button"
                        aria-controls={open ? 'demo-customized-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        variant="contained"
                        size="large"
                        fullWidth
                        disableElevation
                        onClick={handleClick}
                        endIcon={<MoreVertIcon />}
                        sx={{
                            bgcolor: "#1A2027",
                            '&:hover': {
                                bgcolor: "#2A3346",
                            },
                        }}
                    >
                        {isMobile ? "ACTIONS" : "MORE"}
                    </Button>
                </Grid>

                {/* CHECKOUT Button - Desktop: 50% (6/12), Mobile: 100% (12/12) */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PaymentIcon />}
                        disabled={
                            cartState.length === 0 || selectedCustomer === null || !saleDate
                        }
                        onClick={() => setCheckoutModalOpen(true)}
                        size="large"
                        fullWidth
                    >
                        CHECKOUT
                    </Button>
                </Grid>
            </Grid>

            <StyledMenu
                id="demo-customized-menu"
                MenuListProps={{
                    'aria-labelledby': 'demo-customized-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >

                        {isMobile ? (
                            <div>
                                <MenuItem
                                    disableRipple
                                    disabled={cartState.length === 0 || selectedCustomer === null || return_sale}
                                    onClick={onCartEmpty}
                                >
                                    <DeleteForeverIcon />
                                    EMPTY
                                </MenuItem>
                                {/* <MenuItem
                                    disableRipple
                                    disabled={cartState.length === 0}
                                    onClick={() => {
                                        setPaymentsModalOpen(true);
                                        handleClose();
                                    }}
                                >
                                    <AddCardIcon />
                                    PAYMENT
                                </MenuItem> */}
                            </div>
                        ) : null}

                        <MenuItem disableRipple disabled={
                            cartState.length === 0 || selectedCustomer === null || return_sale
                        } onClick={onCartHold} sx={{ width: '100%' }}>
                            <BackHandIcon />
                            HOLD
                        </MenuItem>
                        <MenuItem disableRipple onClick={() => { setHeldModalOpen(true); handleClose(); }} disabled={return_sale}>
                            <ShoppingCartIcon />
                            HOLD ITEMS
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />
                        <MenuItem disabled={cartState.length === 0} onClick={() => { setSaleTemplateModalOpen(true); handleClose(); }}>
                            <FolderCopy />
                            GROUP ITEMS
                        </MenuItem>
                        <Divider sx={{ my: 0.5 }} />
                        {/* <Link href={`/receipt/1`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <MenuItem>
                                <PrintIcon />
                                PRINT
                            </MenuItem>
                        </Link> */}
                        <MenuItem onClick={() => setQuotationModalOpen(true)} disableRipple disabled={selectedCustomer?.id === 1 || cartState.length === 0 || selectedCustomer === null}
                        >
                            <ReceiptIcon />
                            QUOTATION
                        </MenuItem>
            </StyledMenu>

            {/* <Grid container mt={1}>
                <CashCheckoutDialog
                    disabled={
                        cartState.length === 0 || selectedCustomer === null || !saleDate
                    }
                />
            </Grid> */}

            <HeldItemsModal
                modalOpen={heldModalOpen}
                setModalOpen={setHeldModalOpen}
            />
            <CheckoutModal
                open={checkoutModalOpen}
                onClose={() => setCheckoutModalOpen(false)}
            />
            {/* <PaymentsCheckoutDialog
                useCart={useCart}
                open={paymentsModalOpen}
                setOpen={setPaymentsModalOpen}
                selectedContact={selectedCustomer}
                is_sale={true}
                formData={{ sale_date: saleDate, sale_time: saleTime }}
            /> */}
            <QuotationDialog
                useCart={useCart}
                open={quotationModalOpen}
                setOpen={setQuotationModalOpen}
                selectedContact={selectedCustomer}
            />

            <SaleTemplateDialog open={saleTemplateModalOpen} setOpen={setSaleTemplateModalOpen} />
        </div>
    );
}
