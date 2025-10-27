@extends('vendor.installer.layouts.master')

@section('title', trans('installer_messages.final.title'))
@section('container')
    <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 48px; color: #5cb85c; margin-bottom: 20px;">✓</div>
        <p class="paragraph" style="font-size: 18px; margin-bottom: 30px;">
            {{ trans('installer_messages.final.finished') }}
        </p>
        @if(session('message'))
            <div style="background-color: #f0f8f0; padding: 15px; border-radius: 4px; margin-bottom: 30px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                <small style="color: #666;">{{ session('message')['message'] }}</small>
            </div>
        @endif
        <div class="buttons">
            <a href="{{ url('/') }}" class="button" style="display: inline-block;">{{ trans('installer_messages.final.exit') }}</a>
        </div>
    </div>
@stop
