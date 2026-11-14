<?php

use App\Modules\Organization\OrganizationServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;

return [
    AppServiceProvider::class,
    OrganizationServiceProvider::class,
    FortifyServiceProvider::class,
];
