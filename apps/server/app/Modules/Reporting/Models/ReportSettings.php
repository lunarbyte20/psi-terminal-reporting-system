<?php

namespace App\Modules\Reporting\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The signature block of the management report. A single row; until the
 * Admin saves it, the names from the PSI summary workbook are used.
 *
 * @property int $id
 * @property string $prepared_by_name
 * @property string $prepared_by_title
 * @property string $submitted_to_name
 * @property string $submitted_to_title
 * @property int|null $updated_by
 */
class ReportSettings extends Model
{
    public const DEFAULTS = [
        'prepared_by_name' => 'Sarah Espiritu',
        'prepared_by_title' => 'Executive Assistant, PSI',
        'submitted_to_name' => 'Mr. Ferdinand P. Oroza',
        'submitted_to_title' => 'CEO/President, PSI',
    ];

    protected $table = 'report_settings';

    protected $fillable = ['prepared_by_name', 'prepared_by_title', 'submitted_to_name', 'submitted_to_title', 'updated_by'];

    /** The saved settings, or an unsaved instance holding the defaults. */
    public static function current(): self
    {
        return self::query()->oldest('id')->first() ?? new self(self::DEFAULTS);
    }

    /** @return array{prepared_by_name: string, prepared_by_title: string, submitted_to_name: string, submitted_to_title: string} */
    public function signatories(): array
    {
        return [
            'prepared_by_name' => $this->prepared_by_name,
            'prepared_by_title' => $this->prepared_by_title,
            'submitted_to_name' => $this->submitted_to_name,
            'submitted_to_title' => $this->submitted_to_title,
        ];
    }
}
