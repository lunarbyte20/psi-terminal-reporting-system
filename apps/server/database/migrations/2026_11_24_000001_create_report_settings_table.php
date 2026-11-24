<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row of report settings: the names and titles printed in the management
 * report's signature block. Kept as a typed table (not key/value) because
 * there are only a few fixed fields.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('prepared_by_name', 120);
            $table->string('prepared_by_title', 120);
            $table->string('submitted_to_name', 120);
            $table->string('submitted_to_title', 120);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_settings');
    }
};
