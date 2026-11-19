<?php

namespace App\Modules\Reporting\Enums;

/**
 * What the person encoding a report wants to happen after saving. Supervisors
 * save or submit for review; the Admin, who may also encode reports herself,
 * can save and approve in one step.
 */
enum SaveIntent: string
{
    case Save = 'save';
    case Submit = 'submit';
    case Approve = 'approve';

    public function targetStatus(ReportStatus $current): ReportStatus
    {
        return match ($this) {
            self::Save => $current,
            self::Submit => ReportStatus::Submitted,
            self::Approve => ReportStatus::Approved,
        };
    }
}
