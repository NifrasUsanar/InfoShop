import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { PurchaseProvider } from './Context/PurchaseContext';
import { SharedProvider } from './Context/SharedContext';
import { useCurrencyStore } from './stores/currencyStore';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import theme from './theme';

const appName = import.meta.env.VITE_APP_NAME || 'ARSASOFT';

import { InertiaProgress } from '@inertiajs/progress';

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/nprogress/0.2.0/nprogress.min.css" />

InertiaProgress.init({
    color: '#0a0a0a',
    includeCSS: true,
    showSpinner: true,
})

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Initialize currency store from Inertia props
        let currencySettingsFromServer = props.initialPage?.props?.settings?.currency_settings || {};

        // Parse if it's a JSON string
        if (typeof currencySettingsFromServer === 'string') {
            try {
                currencySettingsFromServer = JSON.parse(currencySettingsFromServer);
            } catch (e) {
                console.error('Failed to parse currency settings:', e);
                currencySettingsFromServer = {};
            }
        }

        useCurrencyStore.setState({
            settings: {
                currency_symbol: 'Rs.',
                currency_code: 'PKR',
                symbol_position: 'before',
                decimal_separator: '.',
                thousands_separator: ',',
                decimal_places: '2',
                negative_format: 'minus',
                show_currency_code: 'no',
                ...currencySettingsFromServer,
            },
        });

        // Debug: Log currency store values
        console.log('🏪 Currency Store Initialized:', useCurrencyStore.getState().settings);
        console.log('📦 Server Currency Settings:', currencySettingsFromServer);

        root.render(
            <ThemeProvider theme={theme}>
                <CssBaseline /> {/* Ensures global background + text styles */}
                <GlobalStyles
                    styles={(theme) => ({
                        '*::-webkit-scrollbar': {
                            width: 8,
                            height: 8,
                        },
                        '*::-webkit-scrollbar-track': {
                            background: theme.palette.background.default,
                        },
                        '*::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: 10,
                        },
                        '*::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: theme.palette.primary.dark,
                        },
                        '*': {
                            scrollbarWidth: 'thin',
                            scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.default}`,
                        },
                    })}
                />
                <PurchaseProvider>
                    <SharedProvider>
                        <App {...props} />
                    </SharedProvider>
                </PurchaseProvider>
            </ThemeProvider>
        );
    },
    // progress: {
    //     color: '#00c455',
    //     showSpinner: true,
    // },
    progress: false,
});
