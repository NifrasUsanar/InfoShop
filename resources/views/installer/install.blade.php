@extends('installer.layout')

@section('title', 'Installation')
@section('step', '7')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Ready to Install</h2>

    <form id="installForm" method="POST" action="{{ route('installer.process') }}" class="space-y-6">
        @csrf

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">Installation Process</h3>
                    <p class="mt-1 text-sm text-blue-700">
                        The installation will create database tables, set up your admin account, and configure your store. This may take a few minutes.
                    </p>
                </div>
            </div>
        </div>

        <!-- Hidden fields populated from sessionStorage -->
        <input type="hidden" name="db_driver" id="db_driver">
        <input type="hidden" name="db_host" id="db_host">
        <input type="hidden" name="db_port" id="db_port">
        <input type="hidden" name="db_database" id="db_database">
        <input type="hidden" name="db_username" id="db_username">
        <input type="hidden" name="db_password" id="db_password">

        <input type="hidden" name="app_name" id="app_name">
        <input type="hidden" name="app_url" id="app_url">
        <input type="hidden" name="app_env" id="app_env">
        <input type="hidden" name="app_timezone" id="app_timezone">

        <input type="hidden" name="store_name" id="store_name">
        <input type="hidden" name="store_address" id="store_address">
        <input type="hidden" name="store_contact" id="store_contact">
        <input type="hidden" name="sale_prefix" id="sale_prefix">

        <input type="hidden" name="currency_symbol" id="currency_symbol">
        <input type="hidden" name="currency_code" id="currency_code">
        <input type="hidden" name="symbol_position" id="symbol_position">
        <input type="hidden" name="decimal_separator" id="decimal_separator">
        <input type="hidden" name="thousands_separator" id="thousands_separator">
        <input type="hidden" name="decimal_places" id="decimal_places">
        <input type="hidden" name="negative_format" id="negative_format">
        <input type="hidden" name="show_currency_code" id="show_currency_code">

        <input type="hidden" name="admin_name" id="admin_name">
        <input type="hidden" name="admin_username" id="admin_username">
        <input type="hidden" name="admin_email" id="admin_email">
        <input type="hidden" name="admin_password" id="admin_password">
        <input type="hidden" name="admin_password_confirmation" id="admin_password_confirmation">

        <div class="flex justify-between">
            <a href="{{ route('installer.admin') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                </svg>
                Back
            </a>
            
            <button type="submit" class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed" id="submitBtn">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <span id="btnText">Install InfoShop</span>
            </button>
        </div>
    </form>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('installForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');

    // Populate form from sessionStorage
    const fields = [
        'db_driver', 'db_host', 'db_port', 'db_database', 'db_username', 'db_password',
        'app_name', 'app_url', 'app_env', 'app_timezone',
        'store_name', 'store_address', 'store_contact', 'sale_prefix',
        'currency_symbol', 'currency_code', 'symbol_position', 'decimal_separator',
        'thousands_separator', 'decimal_places', 'negative_format', 'show_currency_code',
        'admin_name', 'admin_username', 'admin_email', 'admin_password'
    ];

    fields.forEach(field => {
        const element = document.getElementById(field);
        const value = sessionStorage.getItem(field);
        if (element && value) {
            element.value = value;
        }
    });

    // Populate confirmation field
    const adminPassword = sessionStorage.getItem('admin_password');
    if (adminPassword) {
        document.getElementById('admin_password_confirmation').value = adminPassword;
    }

    // Validate required fields before submit
    form.addEventListener('submit', function(e) {
        const requiredFields = {
            'db_driver': 'Database Driver',
            'db_database': 'Database Name',
            'app_name': 'App Name',
            'app_url': 'App URL',
            'app_timezone': 'Timezone',
            'store_name': 'Store Name',
            'store_address': 'Store Address',
            'admin_name': 'Admin Name',
            'admin_email': 'Admin Email',
            'admin_password': 'Admin Password'
        };

        const missing = [];
        for (const [fieldId, fieldName] of Object.entries(requiredFields)) {
            const element = document.getElementById(fieldId);
            if (!element || !element.value) {
                missing.push(fieldName);
            }
        }

        if (missing.length > 0) {
            e.preventDefault();
            alert('Missing required information:\n\n' + missing.join('\n') + '\n\nPlease complete all steps.');
            return false;
        }

        // Disable submit button to prevent double submission
        submitBtn.disabled = true;
        btnText.textContent = 'Installing... Please wait...';
    });
});
</script>
@endsection
