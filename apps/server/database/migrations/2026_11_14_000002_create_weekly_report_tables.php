<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reporting_weeks', function (Blueprint $table) {
            $table->id();
            $table->date('starts_on')->unique();
            $table->date('ends_on');
            // The Monday after the week ends; weeks are cut at month end, so some are shorter than 7 days.
            $table->date('due_on');
            $table->timestamps();

            $table->index(['ends_on']);
        });

        Schema::create('weekly_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('terminal_id')->constrained()->restrictOnDelete();
            $table->foreignId('reporting_week_id')->constrained()->restrictOnDelete();
            // Snapshot of the supervisor at the time of reporting, so reassigning a terminal never rewrites history.
            $table->foreignId('supervisor_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('status', 20);

            foreach (['dispatch', 'membership', 'depot_slot', 'penalty', 'sticker', 'others', 'trips', 'monthly_fee', 'weekly_fee'] as $category) {
                $table->decimal($category, 14, 2)->default(0);
            }
            $table->decimal('total_sales', 15, 2)->default(0);
            $table->unsignedBigInteger('total_ridership')->default(0);
            $table->text('remarks')->nullable();
            $table->text('key_issues')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['terminal_id', 'reporting_week_id']);
            $table->index(['reporting_week_id', 'status']);
            $table->index(['supervisor_id', 'reporting_week_id']);
            $table->index(['status', 'submitted_at']);
        });

        Schema::create('ridership_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_type_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('passengers_per_trip');
            $table->unsignedInteger('trips');
            $table->unsignedBigInteger('ridership');
            $table->timestamps();

            $table->unique(['weekly_report_id', 'vehicle_type_id']);
            $table->index(['vehicle_type_id']);
        });

        Schema::create('report_status_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('weekly_report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['weekly_report_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_status_changes');
        Schema::dropIfExists('ridership_lines');
        Schema::dropIfExists('weekly_reports');
        Schema::dropIfExists('reporting_weeks');
    }
};
