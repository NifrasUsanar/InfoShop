import numeral from 'numeral';
import { useCurrencyStore } from '../stores/currencyStore';

let localeRegistered = false;

/**
 * Register a custom numeral locale based on currency settings
 * Only registers once, then updates numeral locale for formatting
 */
const registerCurrencyLocale = (settings) => {
    const decimalPlaces = parseInt(settings.decimal_places || 2);

    // Only register if not already registered
    if (!localeRegistered) {
        numeral.register('locale', 'custom-currency', {
            delimiters: {
                thousands: settings.thousands_separator || ',',
                decimal: settings.decimal_separator || '.',
            },
            abbreviations: {
                thousand: 'k',
                million: 'm',
                billion: 'b',
                trillion: 't',
            },
            ordinal: (number) => {
                const b = number % 10;
                return ~~((number % 100) / 10) === 1
                    ? 'th'
                    : b === 1
                    ? 'st'
                    : b === 2
                    ? 'nd'
                    : b === 3
                    ? 'rd'
                    : 'th';
            },
            currency: {
                symbol: settings.currency_symbol || '$',
                position: settings.symbol_position === 'before' ? 'prefix' : 'postfix',
                code: settings.currency_code || 'USD',
            },
        });
        localeRegistered = true;
    }

    // Set the locale to use custom-currency
    numeral.locale('custom-currency');
};

/**
 * Format currency amount based on currency settings
 * @param {number|string} amount - The amount to format (can be string from DB)
 * @param {object} settings - Settings object containing currency configuration
 * @param {boolean} includeCurrencySymbol - Whether to include currency symbol (default: true)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, settings = {}, includeCurrencySymbol = true) => {
    const currencySettings = settings || {};

    // Register custom locale with current settings
    registerCurrencyLocale(currencySettings);
    numeral.locale('custom-currency');

    // Parse amount - handle string inputs that might have separators
    let parsedAmount = 0;
    if (typeof amount === 'string') {
        // Remove any existing separators and parse
        parsedAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    } else {
        parsedAmount = parseFloat(amount) || 0;
    }

    const isNegative = parsedAmount < 0;
    const absAmount = Math.abs(parsedAmount);
    const decimalPlaces = parseInt(currencySettings.decimal_places || 2);

    // Build numeral format string
    let formatString = '0,0';
    if (decimalPlaces > 0) {
        formatString += '.' + '0'.repeat(decimalPlaces);
    }

    // Format using numeral with custom locale
    let formattedNumber = numeral(absAmount).format(formatString);

    // Build formatted result
    let result;
    if (includeCurrencySymbol) {
        const currencyPart = currencySettings.show_currency_code === 'yes'
            ? `${currencySettings.currency_symbol} (${currencySettings.currency_code})`
            : currencySettings.currency_symbol;

        if (currencySettings.symbol_position === 'before') {
            result = `${currencyPart} ${formattedNumber}`;
        } else {
            result = `${formattedNumber} ${currencyPart}`;
        }
    } else {
        result = formattedNumber;
    }

    // Handle negative format
    if (isNegative) {
        if (currencySettings.negative_format === 'parentheses') {
            result = `(${result})`;
        } else {
            result = `-${result}`;
        }
    }

    return result;
};

/**
 * Convert any value to a clean numeric value
 * Removes formatting characters (commas, spaces, etc), handles negatives
 * @param {number|string} value - Value to convert
 * @returns {number} - Clean numeric value
 */
export const toNumeric = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * React hook to use formatCurrency with automatic Zustand-based currency settings
 * @returns {function} - formatCurrency function bound to store settings
 * Usage:
 *   const formatCurrency = useCurrencyFormatter();
 *   formatCurrency(1500)          // With currency symbol: Rs. 1,500.00
 *   formatCurrency(1500, false)   // Plain number: 1,500.00
 */
export const useCurrencyFormatter = () => {
    const storeSettings = useCurrencyStore((state) => state.settings);

    return (amount, includeCurrencySymbol = true) => {
        return formatCurrency(amount, storeSettings, includeCurrencySymbol);
    };
};