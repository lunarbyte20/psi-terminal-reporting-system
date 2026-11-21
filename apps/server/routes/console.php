<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('psi:generate-reporting-weeks')->dailyAt('00:10')->withoutOverlapping();
Schedule::command('psi:send-report-reminders')->weeklyOn(1, '08:00')->withoutOverlapping();
