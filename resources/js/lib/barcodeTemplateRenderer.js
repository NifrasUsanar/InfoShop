import JsBarcode from 'jsbarcode';

/**
 * Render barcode template with variable replacement
 * @param {string} template - HTML template with {{variable}} placeholders
 * @param {object} data - Data object with variables to replace
 * @returns {string} - Rendered HTML
 */
export const renderBarcodeTemplate = (template, data) => {
    if (!template) return '';

    let rendered = template;

    // Replace each variable in the data object
    Object.entries(data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        rendered = rendered.split(placeholder).join(htmlEscape(String(value || '')));
    });

    // Remove any remaining unreplaced placeholders
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, '');

    return rendered;
};

/**
 * Generate barcode SVG and render it
 * @param {object} options - Configuration options
 */
export const generateBarcodeInTemplate = (options) => {
    const {
        elementId = 'barcode-svg',
        barcodeCode,
        format = 'CODE128',
        width = 1.5,
        height = 35,
        fontSize = 14,
    } = options;

    try {
        const element = document.getElementById(elementId);
        if (!element || !barcodeCode) return;

        JsBarcode(element, barcodeCode, {
            format,
            width,
            height,
            fontSize,
        });
    } catch (error) {
        console.error('Error generating barcode:', error);
    }
};

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const htmlEscape = (text) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Fetch barcode template from settings
 * @returns {Promise<string>} - Template HTML
 */
export const fetchBarcodeTemplate = async () => {
    try {
        const response = await fetch('/api/barcode-template');
        const data = await response.json();
        return data.template || '';
    } catch (error) {
        console.error('Error fetching barcode template:', error);
        return '';
    }
};

export default {
    renderBarcodeTemplate,
    generateBarcodeInTemplate,
    fetchBarcodeTemplate,
};
