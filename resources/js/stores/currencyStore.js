import { create } from 'zustand';

const defaultSettings = {
    currency_symbol: 'Rs.',
    currency_code: 'LKR',
    symbol_position: 'before',
    decimal_separator: '.',
    thousands_separator: ',',
    decimal_places: '2',
    negative_format: 'minus',
    show_currency_code: 'no',
};

export const useCurrencyStore = create((set) => ({
    settings: defaultSettings,

    // Update multiple settings at once
    updateSettings: (newSettings) => {
        set((state) => ({
            settings: {
                ...state.settings,
                ...newSettings,
            },
        }));
    },

    // Reset to defaults
    resetSettings: () => {
        set({ settings: defaultSettings });
    },
}));
