<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisors', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('phone', 40)->nullable();
            // One sign-in account per supervisor; a supervisor can exist before the account does.
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['archived_at', 'name']);
        });

        Schema::create('terminals', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('location', 160)->nullable();
            $table->foreignId('supervisor_id')->nullable()->constrained()->restrictOnDelete();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['supervisor_id', 'archived_at', 'name']);
            $table->index(['archived_at', 'name']);
        });

        Schema::create('vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['archived_at', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_types');
        Schema::dropIfExists('terminals');
        Schema::dropIfExists('supervisors');
    }
};
