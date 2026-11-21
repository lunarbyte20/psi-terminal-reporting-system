<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the issue fields from the PSI requirements on top of the prototype's:
 * priority, the date the issue was reported, actions taken and results.
 * Existing issues become Medium priority, reported on the day they were created.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operational_issues', function (Blueprint $table) {
            $table->string('priority', 10)->default('medium')->after('status');
            $table->date('reported_on')->nullable()->after('priority');
            $table->text('actions_taken')->nullable()->after('action_plan');
            $table->text('results')->nullable()->after('actions_taken');
            $table->index(['priority', 'status']);
        });

        DB::table('operational_issues')->whereNull('reported_on')->update(['reported_on' => DB::raw('date(created_at)')]);
    }

    public function down(): void
    {
        Schema::table('operational_issues', function (Blueprint $table) {
            $table->dropIndex(['priority', 'status']);
            $table->dropColumn(['priority', 'reported_on', 'actions_taken', 'results']);
        });
    }
};
