import { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import { renderBarcodeTemplate, generateBarcodeInTemplate } from "@/lib/barcodeTemplateRenderer";

export default function ProoductBarcode({
    product,
    barcode_settings,
    template,
}) {
    const shop_name = usePage().props.settings.shop_name;
    const formattedPrice = product.selling_price ? `${product.selling_price}` : '';

    const parsedBarcodeSettings = barcode_settings.barcode_settings
        ? JSON.parse(barcode_settings.barcode_settings)
        : {};

    const [settings] = useState({
        containerHeight: parsedBarcodeSettings.container_height || "28mm",
        storeFontSize: parsedBarcodeSettings.store_font_size || "0.8em",
        priceFontSize: parsedBarcodeSettings.price_font_size || "0.8em",
        priceMarginTop: parsedBarcodeSettings.price_margin_top || "-3px",
        priceMarginBottom: parsedBarcodeSettings.price_margin_bottom || "-5px",
        barcodeMarginTop: parsedBarcodeSettings.barcode_margin_top || "-10px",
        barcodeHeight: parsedBarcodeSettings.barcode_height || 35,
        barcodeFontSize: parsedBarcodeSettings.barcode_font_size || 14,
        barcodeWidth: parsedBarcodeSettings.barcode_width || 1.5,
        barcodeFormat: parsedBarcodeSettings.barcode_format || "CODE128",
        productNameMarginTop:
            parsedBarcodeSettings.product_name_margin_top || "-4px",
        productNameFontSize:
            parsedBarcodeSettings.product_name_font_size || "0.7em",
    });

    const [renderedTemplate, setRenderedTemplate] = useState("");

    useEffect(() => {
        const renderTemplate = async () => {
            let templateToUse = template;

            // If no template provided from props, try to fetch from settings
            if (!templateToUse) {
                try {
                    const response = await fetch('/api/barcode-template');
                    const data = await response.json();
                    templateToUse = data.template || '';
                } catch (error) {
                    console.error('Error fetching barcode template:', error);
                }
            }

            // Prepare data for template rendering
            const templateData = {
                product_name: product.name || '',
                price: formattedPrice,
                barcode_code: product.barcode || '',
                store_name: shop_name || '',
                date: new Date().toLocaleDateString(),
            };

            // Render the template with data
            const rendered = renderBarcodeTemplate(templateToUse, templateData);
            setRenderedTemplate(rendered);
        };

        renderTemplate();
    }, [product, shop_name, formattedPrice]);

    useEffect(() => {
        const timer = setTimeout(() => {
            generateBarcodeInTemplate({
                elementId: 'barcode-svg',
                barcodeCode: product.barcode,
                format: settings.barcodeFormat,
                width: parseFloat(settings.barcodeWidth),
                height: parseInt(settings.barcodeHeight),
                fontSize: parseInt(settings.barcodeFontSize),
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [renderedTemplate, settings]);

    return (
        <>
            <Head title="Barcode" />
            <div dangerouslySetInnerHTML={{ __html: renderedTemplate }} />
        </>
    );
}
