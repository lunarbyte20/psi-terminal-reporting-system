<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Issues now live only in the Issues & Actions tracker (one place, carried
 * forward until completed), so the free-text "Key issues" box on weekly
 * reports is removed. Any text already typed there is kept by appending it
 * to the report's remarks.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('weekly_reports')
            ->whereNotNull('key_issues')->where('key_issues', '!=', '')
            ->orderBy('id')
            ->each(function (object $report): void {
                $remarks = trim((string) $report->remarks);
                DB::table('weekly_reports')->where('id', $report->id)->update([
                    'remarks' => trim(($remarks === '' ? '' : $remarks."\n\n").'Key issues: '.trim((string) $report->key_issues)),
                ]);
            });

        Schema::table('weekly_reports', function (Blueprint $table) {
            $table->dropColumn('key_issues');
        });
    }

    public function down(): void
    {
        Schema::table('weekly_reports', function (Blueprint $table) {
            $table->text('key_issues')->nullable()->after('remarks');
        });
    }
};
