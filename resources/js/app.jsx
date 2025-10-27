import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { PurchaseProvider } from './Context/PurchaseContext';
import { SharedProvider } from './Context/SharedContext';
import { useCurrencyStore } from './stores/currencyStore';

const appName = import.meta.env.VITE_APP_NAME || 'InfoShop';

import { InertiaProgress } from '@inertiajs/progress';

InertiaProgress.init({
  color:'#0a0a0a',
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
                currency_code: 'LKR',
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
            <PurchaseProvider>
                <SharedProvider>
                    <App {...props} />
                </SharedProvider>
            </PurchaseProvider>
        );
    },
    // progress: {
    //     color: '#00c455',
    //     showSpinner: true,
    // },
    progress: false,
});
