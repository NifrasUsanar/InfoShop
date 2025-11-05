@extends('installer.layout')

@section('title', 'Store & Currency')
@section('step', '5')

@section('content')
<div x-data="storeData()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Store & Currency Configuration</h2>

    <form @submit.prevent="submitForm()" class="space-y-8">
        <!-- Store Information -->
        <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                    <input type="text" x-model="store_name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                    <textarea x-model="store_address" required rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input type="text" x-model="store_contact" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Sale Prefix</label>
                    <input type="text" x-model="sale_prefix" required maxlength="10" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-sm text-gray-500">Invoice numbers will be: OS-0001, OS-0002, etc.</p>
                </div>
            </div>
        </div>

        <!-- Currency Settings -->
        <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Currency Settings</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Currency Symbol</label>
                        <input type="text" x-model="currency_symbol" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Currency Code</label>
                        <input type="text" x-model="currency_code" required maxlength="10" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Symbol Position</label>
                        <select x-model="symbol_position" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="before" x-text="'Before (' + currency_symbol + '100)'"></option>
                            <option value="after" x-text="'After (100' + currency_symbol + ')'"></option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Decimal Places</label>
                        <select x-model="decimal_places" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="0">0 (100)</option>
                            <option value="2">2 (100.00)</option>
                            <option value="3">3 (100.000)</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Decimal Separator</label>
                        <select x-model="decimal_separator" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value=".">Dot (.)</option>
                            <option value=",">,Comma (,)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Thousands Separator</label>
                        <select x-model="thousands_separator" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value=",">Comma (,)</option>
                            <option value=".">Dot (.)</option>
                            <option value=" ">Space ( )</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Negative Format</label>
                        <select x-model="negative_format" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="minus">Minus (-100)</option>
                            <option value="parentheses">Parentheses ((100))</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Show Currency Code</label>
                        <select x-model="show_currency_code" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="no" x-text="'No (' + currency_symbol + '100)'"></option>
                            <option value="yes" x-text="'Yes (' + currency_symbol + '100 ' + currency_code + ')'"></option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-between">
            <a href="{{ route('installer.settings') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                </svg>
                Back
            </a>
            
            <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                Next
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
            </button>
        </div>
    </form>
</div>

<script>
function storeData() {
    const defaultCurrency = @json($defaultCurrency);
    
    return {
        store_name: 'Main Store',
        store_address: '',
        store_contact: '',
        sale_prefix: 'OS',
        currency_symbol: defaultCurrency.currency_symbol,
        currency_code: defaultCurrency.currency_code,
        symbol_position: defaultCurrency.symbol_position,
        decimal_separator: defaultCurrency.decimal_separator,
        thousands_separator: defaultCurrency.thousands_separator,
        decimal_places: defaultCurrency.decimal_places,
        negative_format: defaultCurrency.negative_format,
        show_currency_code: defaultCurrency.show_currency_code,
        
        init() {
            this.store_name = sessionStorage.getItem('store_name') || 'Main Store';
            this.store_address = sessionStorage.getItem('store_address') || '';
            this.store_contact = sessionStorage.getItem('store_contact') || '';
            this.sale_prefix = sessionStorage.getItem('sale_prefix') || 'OS';
            this.currency_symbol = sessionStorage.getItem('currency_symbol') || defaultCurrency.currency_symbol;
            this.currency_code = sessionStorage.getItem('currency_code') || defaultCurrency.currency_code;
            this.symbol_position = sessionStorage.getItem('symbol_position') || defaultCurrency.symbol_position;
            this.decimal_separator = sessionStorage.getItem('decimal_separator') || defaultCurrency.decimal_separator;
            this.thousands_separator = sessionStorage.getItem('thousands_separator') || defaultCurrency.thousands_separator;
            this.decimal_places = sessionStorage.getItem('decimal_places') || defaultCurrency.decimal_places;
            this.negative_format = sessionStorage.getItem('negative_format') || defaultCurrency.negative_format;
            this.show_currency_code = sessionStorage.getItem('show_currency_code') || defaultCurrency.show_currency_code;
        },
        
        submitForm() {
            sessionStorage.setItem('store_name', this.store_name);
            sessionStorage.setItem('store_address', this.store_address);
            sessionStorage.setItem('store_contact', this.store_contact);
            sessionStorage.setItem('sale_prefix', this.sale_prefix);
            sessionStorage.setItem('currency_symbol', this.currency_symbol);
            sessionStorage.setItem('currency_code', this.currency_code);
            sessionStorage.setItem('symbol_position', this.symbol_position);
            sessionStorage.setItem('decimal_separator', this.decimal_separator);
            sessionStorage.setItem('thousands_separator', this.thousands_separator);
            sessionStorage.setItem('decimal_places', this.decimal_places);
            sessionStorage.setItem('negative_format', this.negative_format);
            sessionStorage.setItem('show_currency_code', this.show_currency_code);
            window.location.href = '{{ route('installer.admin') }}';
        }
    }
}
</script>
@endsection
