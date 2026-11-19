<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('management_evaluations', function (Blueprint $table) {
            $table->id();
            // One evaluation per reporting week; saving again updates it.
            $table->foreignId('reporting_week_id')->unique()->constrained()->restrictOnDelete();
            $table->text('key_concerns')->nullable();
            $table->text('evaluation')->nullable();
            $table->json('recommendations');
            $table->foreignId('prepared_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('management_evaluations');
    }
};
