@extends('vendor.installer.layouts.master')

@section('title', trans('installer_messages.permissions.title'))
@section('container')
    @if (isset($permissions['errors']))
        <div style="color: #d9534f; margin-bottom: 20px;">
            <strong>{{ trans('installer_messages.permissions.problem') }}</strong>
        </div>
    @else
        <div style="color: #5cb85c; margin-bottom: 20px;">
            <strong>{{ trans('installer_messages.permissions.success') }}</strong>
        </div>
    @endif

    <ul class="list">
        @foreach($permissions['permissions'] as $permission)
        <li class="list__item list__item--permissions {{ $permission['isSet'] ? 'success' : 'error' }}">
            {{ $permission['folder'] }}<span>{{ $permission['permission'] }}</span>
        </li>
        @endforeach
    </ul>

    <div class="buttons">
        @if ( ! isset($permissions['errors']))
            <a class="button" href="{{ route('LaravelInstaller::environment') }}">
                {{ trans('installer_messages.welcome.next_button') }}
            </a>
        @else
            <a class="button" href="javascript:window.location.href='';">
                {{ trans('installer_messages.checkPermissionAgain') }}
            </a>
        @endif
    </div>

@stop
