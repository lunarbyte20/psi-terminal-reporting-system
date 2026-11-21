<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Detailed sections from the PSI requirements, stored as {section key: text}. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('management_evaluations', function (Blueprint $table) {
            $table->json('sections')->nullable()->after('recommendations');
        });
    }

    public function down(): void
    {
        Schema::table('management_evaluations', function (Blueprint $table) {
            $table->dropColumn('sections');
        });
    }
};
