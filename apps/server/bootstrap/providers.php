<?php

use App\Modules\Accounts\AccountsServiceProvider;
use App\Modules\Evaluations\EvaluationsServiceProvider;
use App\Modules\Issues\IssuesServiceProvider;
use App\Modules\Reporting\ReportingServiceProvider;
use App\Modules\Terminals\TerminalsServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;

return [
    AppServiceProvider::class,
    AccountsServiceProvider::class,
    TerminalsServiceProvider::class,
    ReportingServiceProvider::class,
    IssuesServiceProvider::class,
    EvaluationsServiceProvider::class,
    FortifyServiceProvider::class,
];
