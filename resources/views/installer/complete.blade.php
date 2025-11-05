@extends('installer.layout')

@section('title', 'Installation Complete')
@section('step', '8')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
    <div class="mb-8">
        <div class="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Installation Complete!</h2>
        <p class="text-gray-600">InfoShop has been successfully installed and configured.</p>
    </div>

    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
        <h3 class="text-lg font-semibold text-green-900 mb-3">What's Next?</h3>
        <ul class="space-y-2 text-sm text-green-800">
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Log in with your admin credentials</span>
            </li>
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Configure your store settings and products</span>
            </li>
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Add your products and start selling!</span>
            </li>
        </ul>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Security Reminder</h3>
                <p class="mt-1 text-sm text-yellow-700">
                    For security purposes, you can re-run the installer anytime by deleting the <code class="bg-yellow-100 px-1 rounded">storage/installed</code> file.
                </p>
            </div>
        </div>
    </div>

    <a href="/login" class="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-lg">
        Go to Login
        <svg class="ml-2 -mr-1 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
        </svg>
    </a>

    <p class="mt-8 text-sm text-gray-500">
        Thank you for choosing InfoShop!
    </p>
</div>
@endsection
