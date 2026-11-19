<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operational_issues', function (Blueprint $table) {
            $table->id();
            $table->string('key_issue', 500);
            $table->text('action_plan')->nullable();
            $table->string('responsible_person', 120)->nullable();
            $table->string('department', 120)->nullable();
            $table->date('target_date')->nullable();
            $table->string('status', 20);
            $table->boolean('requires_ceo_decision')->default(false);
            $table->text('remarks')->nullable();
            $table->foreignId('terminal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained()->nullOnDelete();
            // The week the issue was raised in; open issues carry forward to later weeks.
            $table->foreignId('reporting_week_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'target_date']);
            $table->index(['terminal_id', 'status']);
            $table->index(['supervisor_id', 'status']);
            $table->index(['requires_ceo_decision', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_issues');
    }
};
