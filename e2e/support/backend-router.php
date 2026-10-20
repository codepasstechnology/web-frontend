<?php

use App\Jobs\LookupParcelAmenities;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

$backend = realpath(getenv('E2E_BACKEND_DIR') ?: __DIR__.'/../../../backend');
if (getenv('APP_ENV') !== 'testing' || basename(getenv('DB_DATABASE') ?: '') !== 'e2e.sqlite') {
    http_response_code(500);
    exit('The E2E router requires APP_ENV=testing and a disposable e2e.sqlite database.');
}

require $backend.'/vendor/autoload.php';
/** @var Application $app */
$app = require $backend.'/bootstrap/app.php';
$app->useStoragePath(getenv('E2E_STORAGE_DIR') ?: $backend.'/storage');
$app->booted(function () {
    if (! app()->environment('testing') || config('database.default') !== 'sqlite'
        || basename((string) config('database.connections.sqlite.database')) !== 'e2e.sqlite') {
        throw new RuntimeException('Refusing E2E requests outside the disposable test database.');
    }
    Queue::fake([LookupParcelAmenities::class]);
    Event::listen(MessageSending::class, function (MessageSending $event) {
        file_put_contents(storage_path('logs/e2e-mail.html'), $event->message->getHtmlBody());
    });
    Http::preventStrayRequests();
});
$app->handleRequest(Request::capture());
