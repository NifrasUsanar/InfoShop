@extends('installer.layout')

@section('title', 'Database Setup')
@section('step', '3')

@section('content')
<div x-data="{
    driver: 'mysql',
    host: 'localhost',
    port: '3306',
    database: '',
    username: '',
    password: '',
    testResult: null,
    testing: false,
    testDatabase() {
        this.testing = true;
        this.testResult = null;
        
        const data = this.driver === 'sqlite' 
            ? { driver: 'sqlite', database: this.database }
            : {
                driver: this.driver,
                host: this.host,
                port: this.port,
                database: this.database,
                username: this.username,
                password: this.password
            };
        
        fetch('{{ route('installer.database.test') }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            this.testResult = data;
            this.testing = false;
            if (data.success) {
                sessionStorage.setItem('db_driver', this.driver);
                sessionStorage.setItem('db_host', this.host);
                sessionStorage.setItem('db_port', this.port);
                sessionStorage.setItem('db_database', this.database);
                sessionStorage.setItem('db_username', this.username);
                sessionStorage.setItem('db_password', this.password);
            }
        })
        .catch(error => {
            this.testResult = { success: false, message: 'Connection test failed' };
            this.testing = false;
        });
    }
}" x-init="
    driver = sessionStorage.getItem('db_driver') || 'mysql';
    host = sessionStorage.getItem('db_host') || 'localhost';
    port = sessionStorage.getItem('db_port') || '3306';
    database = sessionStorage.getItem('db_database') || '';
    username = sessionStorage.getItem('db_username') || '';
    password = sessionStorage.getItem('db_password') || '';
" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Database Configuration</h2>

    <form @submit.prevent="testDatabase" class="space-y-6">
        <!-- Database Driver -->
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Database Driver</label>
            <select x-model="driver" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                @foreach($drivers as $key => $name)
                    <option value="{{ $key }}">{{ $name }}</option>
                @endforeach
            </select>
            <p class="mt-1 text-sm text-gray-500">Select your database type</p>
        </div>

        <!-- MySQL Fields -->
        <div x-show="driver === 'mysql'" x-cloak class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Database Host</label>
                    <input type="text" x-model="host" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="localhost">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Port</label>
                    <input type="text" x-model="port" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="3306">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
                <input type="text" x-model="database" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="oneshop">
                <p class="mt-1 text-sm text-gray-500">The database should already exist</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input type="text" x-model="username" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="root">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" x-model="password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
            </div>
        </div>

        <!-- SQLite Fields -->
        <div x-show="driver === 'sqlite'" x-cloak>
            <label class="block text-sm font-medium text-gray-700 mb-2">Database File Path</label>
            <input type="text" x-model="database" value="database/database.sqlite" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="database/database.sqlite">
            <p class="mt-1 text-sm text-gray-500">The file will be created automatically if it doesn't exist</p>
        </div>

        <!-- Test Connection Button -->
        <div>
            <button type="submit" :disabled="testing" class="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <template x-if="!testing">
                    <span>Test Database Connection</span>
                </template>
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

        <!-- Test Result -->
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
                        <h3 :class="testResult?.success ? 'text-green-800' : 'text-red-800'" class="text-sm font-medium" x-text="testResult?.success ? 'Connection Successful' : 'Connection Failed'"></h3>
                        <p :class="testResult?.success ? 'text-green-700' : 'text-red-700'" class="mt-1 text-sm" x-text="testResult?.message"></p>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div class="flex justify-between mt-8">
        <a href="{{ route('installer.requirements') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
            <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
            </svg>
            Back
        </a>
        
        <a href="{{ route('installer.settings') }}" x-show="testResult?.success" x-cloak class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
            Next
            <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
        </a>
    </div>
</div>
@endsection
