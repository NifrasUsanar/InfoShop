@extends('installer.layout')

@section('title', 'Database Setup')
@section('step', '3')

@section('content')
<div x-data="{
    host: '',
    port: '3306',
    database: '',
    username: '',
    password: '',
    testResult: null,
    testing: false,
    testDatabase() {
        this.testing = true;
        this.testResult = null;

        fetch('{{ route('installer.database.test') }}', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: this.host,
                port: this.port,
                database: this.database,
                username: this.username,
                password: this.password
            })
        })
        .then(r => r.json())
        .then(data => {
            this.testResult = data;
            this.testing = false;
        })
        .catch(() => {
            this.testResult = { success: false, message: 'Connection test failed. Please try again.' };
            this.testing = false;
        });
    },
    submitSave() {
        document.getElementById('save_host').value     = this.host;
        document.getElementById('save_port').value     = this.port;
        document.getElementById('save_database').value = this.database;
        document.getElementById('save_username').value = this.username;
        document.getElementById('save_password').value = this.password;
        document.getElementById('saveForm').submit();
    }
}" x-init="
    host     = sessionStorage.getItem('db_host')     || 'localhost';
    port     = sessionStorage.getItem('db_port')     || '3306';
    database = sessionStorage.getItem('db_database') || '';
    username = sessionStorage.getItem('db_username') || '';
    password = sessionStorage.getItem('db_password') || '';
" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">

    <h2 class="text-2xl font-bold text-gray-900 mb-2">Database Configuration</h2>
    <p class="text-gray-500 text-sm mb-6">MySQL 8.0+ required. The database must already exist.</p>

    @if(session('db_error'))
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-700">{{ session('db_error') }}</p>
        </div>
    @endif

    {{-- Hidden form that does the real POST to save .env --}}
    <form id="saveForm" method="POST" action="{{ route('installer.database.save') }}">
        @csrf
        <input type="hidden" id="save_host"     name="host">
        <input type="hidden" id="save_port"     name="port">
        <input type="hidden" id="save_database" name="database">
        <input type="hidden" id="save_username" name="username">
        <input type="hidden" id="save_password" name="password">
    </form>

    <form @submit.prevent="testDatabase" class="space-y-6">

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input type="text" x-model="host" required
                    @input="testResult = null"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="localhost">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input type="text" x-model="port" required
                    @input="testResult = null"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="3306">
            </div>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
            <input type="text" x-model="database" required
                @input="testResult = null"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="infoshop">
            <p class="mt-1 text-sm text-gray-500">The database must already exist on your MySQL server.</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" x-model="username" required
                @input="testResult = null"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="root">
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" x-model="password"
                @input="testResult = null"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••">
        </div>

        <div>
            <button type="submit" :disabled="testing"
                class="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <template x-if="!testing"><span>Test Database Connection</span></template>
                <template x-if="testing">
                    <span class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                    </span>
                </template>
            </button>
        </div>

        <div x-show="testResult" x-cloak>
            <div :class="testResult?.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'" class="border rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg x-show="testResult?.success" class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        <svg x-show="!testResult?.success" class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 :class="testResult?.success ? 'text-green-800' : 'text-red-800'" class="text-sm font-medium"
                            x-text="testResult?.success ? 'Connection Successful' : 'Connection Failed'"></h3>
                        <p :class="testResult?.success ? 'text-green-700' : 'text-red-700'"
                            class="mt-1 text-sm" x-text="testResult?.message"></p>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div class="flex justify-between mt-8">
        <a href="{{ route('installer.requirements') }}"
            class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition">
            <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
            </svg>
            Back
        </a>

        <button @click="submitSave()" x-show="testResult?.success" x-cloak
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition">
            Next
            <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
        </button>
    </div>
</div>
@endsection
