<?php
declare(strict_types=1);

/*
 * InfinityFree production configuration template.
 * Copy this file to php-sql/config.php and replace placeholders.
 * NEVER commit the real config.php to GitHub.
 */

return [
    'db' => [
        // Example format: sql123.infinityfree.com
        'host' => 'YOUR_INFINITYFREE_MYSQL_HOST',
        'port' => 3306,
        'name' => 'YOUR_INFINITYFREE_DATABASE_NAME',
        'user' => 'YOUR_INFINITYFREE_DATABASE_USER',
        'pass' => 'YOUR_INFINITYFREE_DATABASE_PASSWORD',
        'charset' => 'utf8mb4',
    ],

    // Use a long random value; do not reuse the MySQL password.
    'app_secret' => 'REPLACE_WITH_A_LONG_RANDOM_SECRET',
];
