@extends('installer.layout')

@section('title', 'Application Settings')
@section('step', '4')

@section('content')
<div x-data="settingsData()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Application Settings</h2>

    <form @submit.prevent="submitForm()" class="space-y-6">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
            <input type="text" x-model="app_name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="InfoShop">
            <p class="mt-1 text-sm text-gray-500">The name of your application</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
            <input type="url" x-model="app_url" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://yourshop.com">
            <p class="mt-1 text-sm text-gray-500">The URL where your application will be accessible</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Environment</label>
            <select x-model="app_env" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="production">Production</option>
                <option value="local">Local/Development</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">Select 'Production' for live site, 'Local' for testing</p>
        </div>

        <div class="relative" @click.away="open = false">
            <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <div class="relative">
                <input 
                    type="text" 
                    x-model="timezoneSearch"
                    @focus="open = true"
                    @input="open = true"
                    placeholder="Search timezone..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autocomplete="off"
                >
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            
            <!-- Selected Timezone Display -->
            <div x-show="app_timezone && !open" class="mt-2 text-sm text-gray-600">
                Selected: <span class="font-medium text-gray-900" x-text="app_timezone"></span>
            </div>
            
            <!-- Dropdown List -->
            <div 
                x-show="open" 
                x-cloak
                class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
                <template x-if="getFilteredTimezones().length === 0">
                    <div class="px-4 py-3 text-sm text-gray-500">No timezones found</div>
                </template>
                <template x-for="timezone in getFilteredTimezones()" :key="timezone">
                    <div 
                        @click="selectTimezone(timezone)"
                        :class="app_timezone === timezone ? 'bg-blue-50 text-blue-700' : 'text-gray-900 hover:bg-gray-100'"
                        class="px-4 py-2 cursor-pointer text-sm"
                        x-text="timezone"
                    ></div>
                </template>
            </div>
            
            <p class="mt-1 text-sm text-gray-500">Search and select your local timezone</p>
        </div>

        <div class="flex justify-between mt-8">
            <a href="{{ route('installer.database') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
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
function settingsData() {
    return {
        app_name: 'InfoShop',
        app_url: window.location.origin,
        app_env: 'production',
        app_timezone: 'UTC',
        timezoneSearch: '',
        open: false,
        timezones: @json($timezones),
        
        init() {
            this.app_name = sessionStorage.getItem('app_name') || 'InfoShop';
            this.app_url = sessionStorage.getItem('app_url') || window.location.origin;
            this.app_env = sessionStorage.getItem('app_env') || 'production';
            this.app_timezone = sessionStorage.getItem('app_timezone') || 'UTC';
        },
        
        getFilteredTimezones() {
            if (!this.timezoneSearch) return this.timezones;
            return this.timezones.filter(tz => 
                tz.toLowerCase().includes(this.timezoneSearch.toLowerCase())
            );
        },
        
        selectTimezone(timezone) {
            this.app_timezone = timezone;
            this.timezoneSearch = '';
            this.open = false;
        },
        
        submitForm() {
            sessionStorage.setItem('app_name', this.app_name);
            sessionStorage.setItem('app_url', this.app_url);
            sessionStorage.setItem('app_env', this.app_env);
            sessionStorage.setItem('app_timezone', this.app_timezone);
            window.location.href = '{{ route('installer.store') }}';
        }
    }
}
</script>
@endsection
