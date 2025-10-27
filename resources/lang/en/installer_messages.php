<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Installer Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines are used by the infoshop installer.
    |
    */

    'requirements' => [
        'title' => 'System Requirements',
        'info' => 'Checking System Requirements:',
        'helpText' => 'Your server must meet the following requirements to run Infoshop. Please ensure all items are checked:',
        'success' => '✓ All system requirements are met. You\'re ready to continue!',
        'problem' => '✗ Some system requirements are not met. Please fix the errors below before continuing:',
    ],

    'permissions' => [
        'title' => 'Folder Permissions',
        'info' => 'Checking Folder Permissions:',
        'helpText' => 'Infoshop needs write access to certain folders. Please ensure the following directories have proper permissions:',
        'success' => '✓ All folder permissions are correct. You\'re ready to continue!',
        'problem' => '✗ Some folders don\'t have proper write permissions. Please fix them and try again:',
    ],

    'environment' => [
        'title' => 'Database Configuration',
        'save' => 'Save Configuration',
        'success' => '✓ Configuration saved successfully. Your .env file has been created.',
        'errors' => '✗ Unable to save configuration file. Please create .env manually with the settings above.',
        'helpText' => 'Please enter your database credentials below. Infoshop will use this information to connect to your database.',
    ],

    'final' => [
        'title' => 'Installation Complete',
        'finished' => '✓ Infoshop has been successfully installed! Your point of sale system is ready to use.',
        'migration' => 'Database migration output:',
        'console' => 'Installation console output:',
        'log' => 'Installation log:',
        'env' => 'Configuration file (.env):',
        'exit' => 'Go to Infoshop',
    ],

    'welcome' => [
        'title' => 'Welcome to Infoshop',
        'message' => 'Welcome! Let\'s set up your Infoshop point of sale system. This wizard will guide you through the installation process.',
        'next_button' => 'Check System Requirements',
    ],

    'forms' => [
        'name_required' => 'Environment name is required.',
        'app_name_required' => 'Application name is required.',
        'app_name_max' => 'Application name must not exceed 50 characters.',
        'app_url_required' => 'Application URL is required.',
        'db_connection_required' => 'Database type is required.',
        'db_host_required' => 'Database host is required.',
        'db_port_required' => 'Database port is required.',
        'db_database_required' => 'Database name is required.',
        'db_username_required' => 'Database username is required.',
        'db_password_required' => 'Database password is required.',
    ],

    'title' => 'Infoshop Installation',
    'next' => 'Next Step',
    'back' => 'Back',
    'finish' => 'Finish',
    'status' => 'Status',
    'checkPermissionAgain' => 'Check Permissions Again',
    'database' => [
        'title' => 'Database Configuration',
        'host' => 'Database Host',
        'port' => 'Database Port',
        'username' => 'Database Username',
        'password' => 'Database Password',
        'database' => 'Database Name',
        'connection' => 'Database Connection Type',
    ],

    'app' => [
        'timezone' => 'Application Timezone',
    ],

];
