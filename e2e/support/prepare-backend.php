<?php

use Illuminate\Contracts\Console\Kernel;

$backend = realpath(getenv('E2E_BACKEND_DIR') ?: __DIR__.'/../../../backend');
require $backend.'/vendor/autoload.php';
$app = require $backend.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || basename((string) config('database.connections.sqlite.database')) !== 'e2e.sqlite') {
    fwrite(STDERR, "Refusing E2E setup: requires testing environment and an e2e.sqlite database.\n");
    exit(1);
}

foreach (['migrate', 'db:seed'] as $command) {
    $status = $kernel->call($command, ['--force' => true]);
    echo $kernel->output();
    if ($status !== 0) {
        exit($status);
    }
}
