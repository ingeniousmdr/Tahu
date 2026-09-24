<?php
declare(strict_types=1);

/*
 * Copy this file to config.php and edit the values.
 * NEVER put production credentials in Git.
 */

return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'tahu',
        'user' => 'tahu_app',
        'pass' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],

    // Used for optional request hardening and future CSRF/auth features.
    // Replace this value on a real server.
    'app_secret' => 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET',
];
