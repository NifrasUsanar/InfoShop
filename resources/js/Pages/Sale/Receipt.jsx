import React, { useRef, useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import {
    Button,
    Box,
    Typography,
    Paper,
    Card,
    CardMedia,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    colors
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { styled } from "@mui/material/styles";
import numeral from "numeral";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import Barcode from "./Barcode";
import { snapdom } from '@zumer/snapdom';
import { Download, ReceiptText } from "lucide-react";
import stringWidth from "string-width";
import { convert } from "html-to-text";
import { useCurrencyFormatter } from "../../lib/currencyFormatter";

export default function Receipt({ sale, salesItems, settings, user_name, credit_sale = false }) {
    const user = usePage().props.auth.user;
    const contentRef = useRef(null);
    const reactToPrintFn = useReactToPrint({ contentRef });
    const [receiptNo, setReceiptNo] = useState(' ' + sale.sale_prefix + "/" + sale.invoice_number);
    const formatCurrency = useCurrencyFormatter();

    const handleWhatsAppShare = () => {
        const currentUrl = window.location.href; // Get the current URL
        const message = `Your purchase at ${settings.shop_name} receipt: \n${currentUrl}`; // Customize your message
        const encodedMessage = encodeURIComponent(message); // URL encode the message
        let whatsappNumber = sale.whatsapp; // Get the contact number from sale

        // Check if the WhatsApp number is empty
        if (!whatsappNumber) {
            // Prompt the user for their WhatsApp number
            whatsappNumber = prompt("Please enter the WhatsApp number (including country code):", '94');

            // If the user cancels the prompt, exit the function
            if (!whatsappNumber) {
                alert("WhatsApp number is required to share the message.");
                return;
            }
        }

        // Construct the WhatsApp URL
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank'); // Open in a new tab
    };

    const handleImageDownload = async (addPadding = false, format = 'png') => {
        if (!contentRef.current) return;

        // Clone the element to avoid affecting the original
        const elementToCapture = contentRef.current.cloneNode(true);

        // Off-screen styling
        Object.assign(elementToCapture.style, {
            width: '500px',
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            overflow: 'hidden',
            fontSize: '14px',
            padding: addPadding ? '20px' : '0',
        });

        elementToCapture.querySelectorAll('table').forEach(table => {
            table.style.width = '450px';
            table.style.minWidth = '0';
            table.style.tableLayout = 'auto';
            table.style.overflow = 'hidden';
        });

        document.body.appendChild(elementToCapture);

        try {
            await snapdom.download(elementToCapture, {
                filename: `receipt-${sale.id}.${format}`,
                format,
                scale: 2,
                quality: 1,
                dpr: 2,
            });

            console.log('Image downloaded successfully!');
        } catch (error) {
            console.error('Failed to capture and download:', error);
        } finally {
            document.body.removeChild(elementToCapture);
        }
    };


    const handleReceiptDownload = async (addPadding, format) => {
        const element = contentRef.current;
        if (!element) return;

        const cloned = element.cloneNode(true);
        if (addPadding) cloned.style.padding = "20px";

        const blob = await snapdom(cloned, { format: "png", scale: 2, dpr: 2 });
        const reader = new FileReader();
        reader.onloadend = () => {
            window.ReactNativeWebView.postMessage(reader.result);
        };
        reader.readAsDataURL(blob);
    };

    useEffect(() => {
        window.handleImageDownload = handleImageDownload;
        window.snapdom = snapdom;
    }, []);

    const ReceiptContainer = styled(Paper)(({ theme }) => ({
        width: "500px",
        padding: theme.spacing(3),
        textAlign: "center",
        "@media print": {
            boxShadow: "none", // Remove shadow for print
            // padding:0
            color: "black",
        },
    }));

    const ReceiptPrintContainer = styled(Paper)(({ theme }) => ({
        width: "100%",
        fontFamily: settings.sale_print_font,
        textAlign: "center",
        boxShadow: "none",
        "@media print": {
            boxShadow: "none", // Remove shadow for print
            color: "black",
        },
    }));

    // Optimized styles using rem
    const baseFont = { fontFamily: settings.sale_print_font };

    const styles = {
        printArea: {
            ...baseFont,
            fontSize: "16px", // base font size for screen
            paddingRight: parseFloat(settings.sale_print_padding_right),
            paddingLeft: parseFloat(settings.sale_print_padding_left),
            color: "black !important",
        },
        receiptTopText: { ...baseFont, fontSize: "0.8em", fontWeight: "bold" },   // 13px
        receiptSummaryText: { ...baseFont, fontSize: "0.8em", fontWeight: "bold", padding: 0, borderBottom: "none", color: "black" },
        receiptSummaryTyp: { ...baseFont, fontSize: "1em", fontWeight: "bold", color: "black" },
        itemsHeader: { ...baseFont, fontSize: "0.8em", fontWeight: "bold", padding: "0.25rem 0" }, // py:1
        itemsHeaderTyp: { ...baseFont, fontSize: "1em", fontWeight: "bold" }, // 14px
        itemsCells: { ...baseFont, fontSize: "0.9em", fontWeight: "bold", padding: "0.25rem 0", verticalAlign: "middle" },
        itemsCellsTyp: { ...baseFont, fontSize: "0.9em", fontWeight: "bold" },
    };


    if (!sale || Object.keys(sale).length === 0) {
        return (
            <Box className="flex justify-center mt-10 p-0">
                <Typography variant="h6" color="error">
                    No pending sales available.
                </Typography>
            </Box>
        );
    }

    // Filter out charge items and calculate totals
    const productItems = salesItems.filter(item => !item.charge_id);
    const chargeItems = salesItems.filter(item => item.charge_id);
    const itemDiscount = productItems.reduce((acc, item) => acc + item.discount * item.quantity, 0);

    // Calculate line total of all products
    const productLineTotal = productItems.reduce((acc, item) => {
        const lineTotal = (Number(item.quantity) * (item.unit_price - item.discount)) - Number(item.flat_discount);
        return acc + lineTotal;
    }, 0);

    return (
        <>
            <Head title="Sale Receipt" />
            <Box className="flex justify-center mt-10 p-0 text-black">
                <ReceiptContainer square={false} className="receipt-container">
                    <Box className="flex justify-between mb-3 print:hidden text-black">

                        {user && (
                            <Button
                                onClick={() => window.history.back()}
                                variant="outlined"
                                startIcon={<ArrowBackIosIcon />}
                            >
                                Back
                            </Button>
                        )}
                        {user && (
                            // <Button
                            //     onClick={handleWhatsAppShare}
                            //     variant="contained"
                            //     color="success"
                            //     endIcon={<WhatsAppIcon />}
                            // >
                            //     Whatsapp
                            // </Button>
                            <IconButton onClick={handleWhatsAppShare} color="success"><WhatsAppIcon fontSize="medium" /></IconButton>
                        )}

                        <IconButton onClick={() => handleImageDownload(true, 'jpg')}>
                            <Download />
                        </IconButton>

                        {/* <IconButton onClick={(event) => { console.log(event); }}>
                            <ReceiptText />
                        </IconButton> */}

                        <Button
                            onClick={reactToPrintFn}
                            variant="contained"
                            endIcon={<PrintIcon />}
                        >
                            Print
                        </Button>

                        {/* {user && isAndroid && (
                            <Button
                                onClick={()=>shareToPrint(sale.id)}
                                variant="contained"
                                endIcon={<PrintIcon />}
                            >
                                BT Print
                            </Button>
                        )} */}

                    </Box>
                    <div
                        id="print-area"
                        ref={contentRef}
                        className="p-0 bg-white"
                        style={styles.printArea}
                    >
                        <ReceiptPrintContainer square={false}>
                            <Box className="flex justify-center items-center mt-0 flex-col">
                                <Card sx={{ width: 160, boxShadow: 0 }}>
                                    <CardMedia
                                        component="img"
                                        image={
                                            window.location.origin +
                                            "/" +
                                            settings.shop_logo
                                        }
                                    />
                                </Card>
                                {settings.show_receipt_shop_name == 1 && (
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontSize: "20px",
                                            fontFamily:
                                                settings.sale_print_font,
                                            fontWeight: "bold",
                                        }}
                                        color="black"
                                        className="receipt-shop-name"
                                    >
                                        {settings.shop_name}
                                    </Typography>
                                )}

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontSize: "15px",
                                        fontFamily: settings.sale_print_font,
                                    }}
                                    color="black"
                                    className="receipt-address"
                                >
                                    {sale.address}
                                    <br />
                                    {sale.contact_number}
                                </Typography>
                            </Box>
                            <Divider
                                sx={{
                                    borderBottom: "1px dashed",
                                    borderColor: "black",
                                    my: "1rem",
                                }}
                                className="receipt-divider-after-address"
                            />
                            <Box className="flex items-start flex-col justify-start receipt-meta text-black">


                                {!credit_sale && (
                                    <>
                                        <Typography
                                            sx={styles.receiptTopText}
                                            color="black"
                                        >
                                            Receipt No:{receiptNo}
                                        </Typography>
                                        <Typography
                                            sx={styles.receiptTopText}
                                            color="black"
                                            textAlign={"start"}
                                        >
                                            Date:
                                            {dayjs(sale.created_at).format(
                                                "DD-MMM-YYYY, h:mm A"
                                            ) + " "}
                                            By: {user_name}
                                        </Typography>
                                    </>
                                )}
                                {credit_sale && (
                                    <>
                                        <Typography
                                            sx={styles.receiptTopText}
                                            color="black"
                                            textAlign={"start"}
                                        >
                                            Print date:
                                            {dayjs(sale.created_at).format(
                                                "DD-MMM-YYYY, h:mm A"
                                            ) + " "}
                                        </Typography>
                                    </>
                                )}

                                <Typography
                                    sx={styles.receiptTopText}
                                    color="black"
                                >
                                    Customer: {sale.name}
                                </Typography>
                            </Box>
                            <Divider
                                sx={{
                                    borderBottom: "1px dashed",
                                    borderColor: "black",
                                    my: "1rem",
                                }}
                                className="receipt-divider-after-details"
                            />

                            <TableContainer sx={{ height: "100%", overflow: "hidden" }}>
                                <Table
                                    sx={{ padding: "0", height: "100%" }}
                                    id="receipt-items-table"
                                >
                                    <TableHead>
                                        <TableRow className="receipt-items-header">
                                            <TableCell sx={styles.itemsHeader}>
                                                <Typography
                                                    sx={styles.itemsHeaderTyp}
                                                    color="black"
                                                >
                                                    Item
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.itemsHeader}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={styles.itemsHeaderTyp}
                                                    color="black"
                                                >
                                                    Qty.
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.itemsHeader}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={styles.itemsHeaderTyp}
                                                    color="black"
                                                >
                                                    U.Price
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.itemsHeader}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={styles.itemsHeaderTyp}
                                                    color="black"
                                                >
                                                    Disc.
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.itemsHeader}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={styles.itemsHeaderTyp}
                                                    color="black"
                                                >
                                                    Total
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {productItems.map((item, index) => (
                                            <React.Fragment key={`item-${index}`}>
                                                {/* First Row: Product Name */}
                                                <TableRow
                                                    key={`name-row-${index}`}
                                                    className="receipt-product-row"
                                                >
                                                    <TableCell
                                                        colSpan={5}
                                                        sx={{
                                                            ...styles.itemsCells,
                                                            borderBottom:
                                                                "none",
                                                            paddingBottom: 0,
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            <strong>
                                                                {" "}
                                                                {index + 1}.
                                                                {item.name}{" "}
                                                                {item.account_number
                                                                    ? "| " +
                                                                    item.account_number
                                                                    : ""}
                                                            </strong>
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>

                                                <TableRow
                                                    key={`details-row-${index}`}
                                                    className="receipt-details-row"
                                                >
                                                    <TableCell
                                                        sx={styles.itemsCells}
                                                        align="right"
                                                        colSpan={2}
                                                    >
                                                        <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            <strong>{item.quantity}</strong>
                                                            {Number(item.free_quantity) !== 0 && (
                                                                <strong> + [Free: {item.free_quantity}]</strong>
                                                            )}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={styles.itemsCells}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            {formatCurrency(item.unit_price, false)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={styles.itemsCells}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            {formatCurrency(Number(item.discount * item.quantity) + Number(item.flat_discount), false)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={styles.itemsCells}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            <strong>
                                                                {Number(item.quantity) * (item.unit_price - item.discount) === 0 ? 'Free' : formatCurrency((Number(item.quantity) * (item.unit_price - item.discount)) - Number(item.flat_discount), false)}
                                                            </strong>
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}

                                        {/* Spacer Row */}
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                sx={{
                                                    padding: "7px 0",
                                                    borderBottom: "none",
                                                }}
                                            />
                                        </TableRow>

                                        {/* Total Row (Products Total) */}
                                        <TableRow
                                            sx={{ border: "none" }}
                                            className="receipt-summary-row"
                                        >
                                            <TableCell
                                                sx={{ ...styles.receiptSummaryText, paddingTop: 2 }}
                                                colSpan={4}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    Total:
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{ ...styles.receiptSummaryText, paddingTop: 2 }}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(productLineTotal)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {/* Discount Row */}
                                        {parseFloat(sale.discount) !== 0 && (
                                            <TableRow
                                                sx={{ border: "none" }}
                                                className="receipt-summary-row"
                                            >
                                                <TableCell
                                                    sx={styles.receiptSummaryText}
                                                    colSpan={4}
                                                    align="right"
                                                >
                                                    <Typography
                                                        sx={
                                                            styles.receiptSummaryTyp
                                                        }
                                                        color="black"
                                                    >
                                                        Discount:
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    sx={styles.receiptSummaryText}
                                                    align="right"
                                                >
                                                    <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(sale.discount)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        )}

                                        {/* Subtotal Row */}
                                        <TableRow
                                            sx={{ border: "none" }}
                                            className="receipt-summary-row"
                                        >
                                            <TableCell
                                                sx={{ ...styles.receiptSummaryText, paddingBottom: 2 }}
                                                colSpan={4}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    Subtotal:
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{ ...styles.receiptSummaryText, paddingBottom: 2 }}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(productLineTotal - parseFloat(sale.discount))}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {/* Charges Breakdown */}
                                        {chargeItems.length > 0 && (
                                            <>
                                                {chargeItems.map((charge, index) => (
                                                    <TableRow
                                                        key={`charge-${index}`}
                                                        sx={{ border: "none" }}
                                                        className="receipt-charge-row"
                                                    >
                                                        <TableCell
                                                            sx={styles.itemsCells}
                                                            colSpan={3}
                                                        >
                                                            <Typography
                                                                sx={
                                                                    styles.itemsCellsTyp
                                                                }
                                                                color="black"
                                                            >
                                                                {charge.description} {charge.rate_type === 'percentage' ? `(${charge.rate_value}%)` : '(Fixed)'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell
                                                            sx={styles.itemsCells}
                                                            align="right"
                                                            colSpan={2}
                                                        >
                                                            <Typography
                                                            sx={
                                                                styles.itemsCellsTyp
                                                            }
                                                            color="black"
                                                        >
                                                            {formatCurrency(charge.unit_price)}
                                                        </Typography>
                                                    </TableCell>
                                                    </TableRow>
                                                ))}
                                            </>
                                        )}

                                        {/* Payable Amount Row - Only show if there are charges */}
                                        {chargeItems.length > 0 && (
                                            <TableRow
                                                sx={{ border: "none" }}
                                                className="receipt-summary-row"
                                            >
                                                <TableCell
                                                    sx={{ ...styles.receiptSummaryText, paddingTop: 2, paddingBottom: 2 }}
                                                    colSpan={4}
                                                    align="right"
                                                >
                                                    <Typography
                                                        sx={
                                                            styles.receiptSummaryTyp
                                                        }
                                                        color="black"
                                                    >
                                                        Payable Amount:
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    sx={{ ...styles.receiptSummaryText, paddingTop: 2, paddingBottom: 2 }}
                                                    align="right"
                                                >
                                                    <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(sale.total_amount)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        )}

                                        <TableRow
                                            sx={{ border: "none" }}
                                            className="receipt-summary-row"
                                        >
                                            <TableCell
                                                sx={styles.receiptSummaryText}
                                                colSpan={4}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    Paid:
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.receiptSummaryText}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(sale.amount_received)}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow
                                            sx={{ border: "none" }}
                                            className="receipt-summary-row"
                                        >
                                            <TableCell
                                                sx={styles.receiptSummaryText}
                                                colSpan={4}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    Balance:
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={styles.receiptSummaryText}
                                                align="right"
                                            >
                                                <Typography
                                                    sx={
                                                        styles.receiptSummaryTyp
                                                    }
                                                    color="black"
                                                >
                                                    {formatCurrency(parseFloat(sale.amount_received) - parseFloat(sale.total_amount))}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>

                                        {/* Conditional row for Old Balance */}
                                        {credit_sale && parseFloat(sale.amount_received) - parseFloat(sale.total_amount) !== parseFloat(sale.balance) && (
                                            <>
                                                <TableRow
                                                    sx={{ border: "none" }}
                                                    className="receipt-summary-row"
                                                >
                                                    <TableCell
                                                        sx={styles.receiptSummaryText}
                                                        colSpan={4}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={styles.receiptSummaryTyp}
                                                            color="black"
                                                        >
                                                            Old Balance:
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={styles.receiptSummaryText}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={styles.receiptSummaryTyp}
                                                            color="black"
                                                        >
                                                            {formatCurrency(
                                                                parseFloat(sale.balance) -
                                                                (parseFloat(sale.amount_received) -
                                                                    parseFloat(sale.total_amount))
                                                            )}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow
                                                    sx={{ border: "none" }}
                                                    className="receipt-summary-row"
                                                >
                                                    <TableCell
                                                        sx={styles.receiptSummaryText}
                                                        colSpan={4}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={styles.receiptSummaryTyp}
                                                            color="black"
                                                        >
                                                            Total Balance:
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell
                                                        sx={styles.receiptSummaryText}
                                                        align="right"
                                                    >
                                                        <Typography
                                                            sx={styles.receiptSummaryTyp}
                                                            color="black"
                                                        >
                                                            {formatCurrency(sale.balance)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Divider
                                sx={{
                                    borderBottom: "1px dashed",
                                    borderColor: "black",
                                    my: "1rem",
                                }}
                                className="receipt-divider-before-footer"
                            />
                            <div className="receipt-barcode flex justify-center">
                                <Barcode value={sale.invoice_number} />
                            </div>

                            <Divider
                                sx={{
                                    borderBottom: "1px dashed",
                                    borderColor: "black",
                                    my: "1rem",
                                }}
                                className="receipt-divider-before-footer"
                            />

                            <div
                                className="receipt-footer"
                                style={styles.receiptSummaryText}
                                dangerouslySetInnerHTML={{
                                    __html: settings.sale_receipt_note,
                                }}
                            />
                            <div
                                className="receipt-second-note"
                                style={styles.receiptSummaryText}
                                dangerouslySetInnerHTML={{
                                    __html: settings.sale_receipt_second_note,
                                }}
                            />
                        </ReceiptPrintContainer>
                    </div>
                </ReceiptContainer>
            </Box>
        </>
    );
}
