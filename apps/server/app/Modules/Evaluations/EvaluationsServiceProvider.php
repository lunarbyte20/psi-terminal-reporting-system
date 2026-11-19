<?php

namespace App\Modules\Evaluations;

use App\Support\Modules\ModuleServiceProvider;

class EvaluationsServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return __DIR__;
    }
}
