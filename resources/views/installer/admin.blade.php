@extends('installer.layout')

@section('title', 'Admin Account')
@section('step', '6')

@section('content')
<div x-data="{
    admin_name: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
    showPassword: false
}" x-init="
    admin_name = sessionStorage.getItem('admin_name') || '';
    admin_username = sessionStorage.getItem('admin_username') || '';
    admin_email = sessionStorage.getItem('admin_email') || '';
" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Create Admin Account</h2>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Administrator Credentials</h3>
                <p class="mt-1 text-sm text-blue-700">
                    This account will have full access to all features. Keep these credentials secure.
                </p>
            </div>
        </div>
    </div>

    <form @submit.prevent="
        if (admin_password !== admin_password_confirmation) {
            alert('Passwords do not match!');
            return;
        }
        sessionStorage.setItem('admin_name', admin_name);
        sessionStorage.setItem('admin_username', admin_username);
        sessionStorage.setItem('admin_email', admin_email);
        sessionStorage.setItem('admin_password', admin_password);
        window.location.href = '{{ route('installer.install') }}';
    " class="space-y-6">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input type="text" x-model="admin_name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe">
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" x-model="admin_username" required pattern="[a-zA-Z0-9_-]+" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin">
            <p class="mt-1 text-sm text-gray-500">Use only letters, numbers, hyphens, and underscores</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" x-model="admin_email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin@example.com">
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" x-model="admin_password" required minlength="8" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12" placeholder="••••••••">
                <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <svg x-show="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <svg x-show="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                    </svg>
                </button>
            </div>
            <p class="mt-1 text-sm text-gray-500">Minimum 8 characters</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input :type="showPassword ? 'text' : 'password'" x-model="admin_password_confirmation" required minlength="8" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••">
        </div>

        <div x-show="admin_password && admin_password_confirmation && admin_password !== admin_password_confirmation" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-700">Passwords do not match</p>
        </div>

        <div class="flex justify-between mt-8">
            <a href="{{ route('installer.store') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                </svg>
                Back
            </a>
            
            <button type="submit" :disabled="!admin_password || !admin_password_confirmation || admin_password !== admin_password_confirmation" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Next
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
            </button>
        </div>
    </form>
</div>
@endsection
