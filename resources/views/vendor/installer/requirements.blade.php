@extends('vendor.installer.layouts.master')

@section('title', trans('installer_messages.requirements.title'))
@section('container')
    @if (isset($requirements['errors']))
        <div style="color: #d9534f; margin-bottom: 20px;">
            <strong>{{ trans('installer_messages.requirements.problem') }}</strong>
        </div>
    @else
        <div style="color: #5cb85c; margin-bottom: 20px;">
            <strong>{{ trans('installer_messages.requirements.success') }}</strong>
        </div>
    @endif

    <ul class="list">
        <li class="list__item {{ $phpSupportInfo['supported'] ? 'success' : 'error' }}">
            <i class="fa" style="margin-right: 10px;"></i>PHP Version >= {{ $phpSupportInfo['minimum'] }}
        </li>

        @foreach($requirements['requirements'] as $extention => $enabled)
            <li class="list__item {{ $enabled ? 'success' : 'error' }}">
                <i class="fa" style="margin-right: 10px;"></i>{{ $extention }}
            </li>
        @endforeach
    </ul>

    @if ( ! isset($requirements['errors']) && $phpSupportInfo['supported'] == 'success')
        <div class="buttons">
            <a class="button" href="{{ route('LaravelInstaller::permissions') }}">
                {{ trans('installer_messages.welcome.next_button') }}
            </a>
        </div>
    @endif
@stop
