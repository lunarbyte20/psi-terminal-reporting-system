<?php

namespace App\Modules\Reporting\Actions;

use App\Models\User;
use App\Modules\Reporting\Models\ReportSettings;
use App\Support\Audit\RecordChange;
use Illuminate\Support\Facades\DB;

/**
 * Saves the management report's signatories (one settings row) and records
 * the change in the audit log. Saving the same values again changes nothing.
 */
class SaveReportSettings
{
    public function __construct(private readonly RecordChange $audit) {}

    /** @param  array{prepared_by_name: string, prepared_by_title: string, submitted_to_name: string, submitted_to_title: string}  $signatories */
    public function execute(User $actor, array $signatories): ReportSettings
    {
        return DB::transaction(function () use ($actor, $signatories): ReportSettings {
            $settings = ReportSettings::query()->oldest('id')->lockForUpdate()->first() ?? new ReportSettings(ReportSettings::DEFAULTS);
            $before = $settings->exists ? $settings->signatories() : null;

            $settings->fill($signatories);
            if ($settings->exists && ! $settings->isDirty()) {
                return $settings;
            }

            $settings->forceFill(['updated_by' => $actor->id])->save();
            $this->audit->execute($actor, $settings, 'report_settings.updated', $before, $settings->signatories());

            return $settings;
        });
    }
}
