<?php

namespace App\Modules\Terminals;

use App\Support\Modules\ModuleServiceProvider;

class TerminalsServiceProvider extends ModuleServiceProvider
{
    protected function modulePath(): string
    {
        return __DIR__;
    }
}
