@extends('installer.layout')

@section('title', 'Server Requirements')
@section('step', '2')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Server Requirements</h2>
    
    <!-- PHP Version -->
    <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">PHP Version</h3>
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-medium text-gray-900">{{ $requirements['php']['name'] }}</p>
                    <p class="text-sm text-gray-600">Required: {{ $requirements['php']['required'] }}</p>
                </div>
                <div class="flex items-center">
                    <span class="mr-3 text-gray-600">Current: {{ $requirements['php']['current'] }}</span>
                    @if($requirements['php']['status'])
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @else
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <!-- PHP Extensions -->
    <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">PHP Extensions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @foreach($requirements['extensions'] as $extension => $data)
                <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <span class="font-medium text-gray-900">{{ $data['name'] }}</span>
                    @if($data['status'])
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @else
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @endif
                </div>
            @endforeach
        </div>
    </div>

    <!-- Folder Permissions -->
    <div class="mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Folder Permissions</h3>
        <div class="space-y-3">
            @foreach($requirements['permissions'] as $folder => $data)
                <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p class="font-medium text-gray-900">{{ $data['name'] }}</p>
                        <p class="text-sm text-gray-600">Required: {{ $data['required'] }}</p>
                    </div>
                    @if($data['status'])
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @else
                        <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    @endif
                </div>
            @endforeach
        </div>
    </div>

    @php
        $allRequirementsMet = $requirements['php']['status'] &&
            collect($requirements['extensions'])->every(fn($ext) => $ext['status']) &&
            collect($requirements['permissions'])->every(fn($perm) => $perm['status']);
    @endphp

    @if(!$allRequirementsMet)
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Requirements Not Met</h3>
                    <p class="mt-1 text-sm text-red-700">
                        Please ensure all requirements are met before proceeding with the installation.
                    </p>
                </div>
            </div>
        </div>
    @endif

    <div class="flex justify-between">
        <a href="{{ route('installer.welcome') }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
            <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
            </svg>
            Back
        </a>
        
        @if($allRequirementsMet)
            <a href="{{ route('installer.database') }}" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                Next
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
            </a>
        @else
            <button disabled class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-400 cursor-not-allowed">
                Next
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
            </button>
        @endif
    </div>
</div>
@endsection
