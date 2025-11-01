@extends('vendor.installer.layouts.master')

@section('title', trans('installer_messages.environment.title'))
@section('style')
    <link href="{{ asset('installer/froiden-helper/helper.css') }}" rel="stylesheet"/>
    <style>
        .form-control{
            height: 36px;
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #333;
        }
        .has-error{
            color: red;
        }
        .has-error input{
            color: black;
            border:1px solid red !important;
        }
    </style>
@endsection
@section('container')
    <p style="margin-bottom: 20px; color: #666;">{{ trans('installer_messages.environment.helpText') }}</p>

    <form method="get" action="{{ route('LaravelInstaller::environmentSave') }}" id="env-form">

        <div class="form-group">
            <label>{{ trans('installer_messages.database.host') }}</label>
            <input type="text" name="hostname" class="form-control" placeholder="localhost" value="localhost">
        </div>

        <div class="form-group">
            <label>{{ trans('installer_messages.database.port') }}</label>
            <input type="text" name="port" class="form-control" placeholder="3306" value="3306">
        </div>

        <div class="form-group">
            <label>{{ trans('installer_messages.database.username') }}</label>
            <input type="text" name="username" class="form-control" placeholder="root">
        </div>

        <div class="form-group">
            <label>{{ trans('installer_messages.database.password') }}</label>
            <input type="password" class="form-control" name="password" placeholder="">
        </div>

        <div class="form-group">
            <label>{{ trans('installer_messages.database.database') }}</label>
            <input type="text" name="database" class="form-control" placeholder="infoshop">
        </div>

        <div class="form-group">
            <label>{{ trans('installer_messages.app.timezone') }}</label>
            <select name="timezone" class="form-control" style="height: 36px; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                <option value="UTC" selected>UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Denver">America/Denver (MST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
        </div>

        <div class="buttons" style="margin-top: 30px;">
            <button class="button" type="button" onclick="checkEnv();return false">
                {{ trans('installer_messages.welcome.next_button') }}
            </button>
        </div>
    </form>

    <script>
        function checkEnv() {
            $.easyAjax({
                url: "{!! route('LaravelInstaller::environmentSave') !!}",
                type: "GET",
                data: $("#env-form").serialize(),
                container: "#env-form",
                messagePosition: "inline"
            });
        }
    </script>
@stop

@section('scripts')
    <script src="{{ asset('installer/js/jQuery-2.2.0.min.js') }}"></script>
    <script src="{{ asset('installer/froiden-helper/helper.js')}}"></script>
    <script>
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });
    </script>
@endsection
