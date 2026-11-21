<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'locale')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('locale', 3)->default('en');
                $table->string('theme', 10)->nullable();
            });
        }
        if (! Schema::hasColumn('vehicle_types', 'number_of_passengers')) {
            Schema::table('vehicle_types', function (Blueprint $table): void {
                $table->unsignedSmallInteger('number_of_passengers')->nullable();
            });
        }
        if (! Schema::hasTable('issue_tags')) {
            Schema::create('issue_tags', function (Blueprint $table): void {
                $table->id();
                $table->string('name', 80)->unique();
                $table->string('color', 7);
                $table->timestamp('archived_at')->nullable()->index();
                $table->timestamps();
            });
        }
        if (! Schema::hasTable('issue_tag_operational_issue')) {
            Schema::create('issue_tag_operational_issue', function (Blueprint $table): void {
                $table->foreignId('operational_issue_id')->constrained()->cascadeOnDelete();
                $table->foreignId('issue_tag_id')->constrained()->restrictOnDelete();
                $table->primary(['operational_issue_id', 'issue_tag_id']);
                $table->index(['issue_tag_id', 'operational_issue_id'], 'issue_tag_lookup');
            });
        }
        Schema::table('users', fn (Blueprint $table) => $table->string('locale', 3)->default('en')->change());
        if (! Schema::hasIndex('issue_tag_operational_issue', 'issue_tag_lookup')) {
            Schema::table('issue_tag_operational_issue', fn (Blueprint $table) => $table->index(['issue_tag_id', 'operational_issue_id'], 'issue_tag_lookup'));
        }
        foreach ([
            'Operational' => '#2563eb', 'Fleet & Maintenance' => '#d97706',
            'Legal & Compliance' => '#7c3aed', 'HR' => '#db2777',
            'Finance' => '#059669', 'IT & AFCS' => '#0891b2',
            'Safety & Security' => '#dc2626', 'Customer Concerns' => '#4f46e5',
        ] as $name => $color) {
            DB::table('issue_tags')->insertOrIgnore(['name' => $name, 'color' => $color, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_tag_operational_issue');
        Schema::dropIfExists('issue_tags');
        Schema::table('vehicle_types', fn (Blueprint $table) => $table->dropColumn('number_of_passengers'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['locale', 'theme']));
    }
};
