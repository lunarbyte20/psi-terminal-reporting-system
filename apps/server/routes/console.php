<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('psi:generate-reporting-weeks')->dailyAt('00:10')->withoutOverlapping();
