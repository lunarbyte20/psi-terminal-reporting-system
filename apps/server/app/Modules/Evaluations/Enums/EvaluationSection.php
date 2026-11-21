<?php

namespace App\Modules\Evaluations\Enums;

/**
 * The detailed evaluation sections from the PSI requirements (section 9),
 * kept alongside the prototype's key concerns, evaluation and recommendations.
 */
enum EvaluationSection: string
{
    case ActionsAndResults = 'actions_and_results';
    case PendingMatters = 'pending_matters';
    case ResponsiblePersons = 'responsible_persons';
    case Operational = 'operational';
    case Financial = 'financial';
    case LegalCompliance = 'legal_compliance';
    case HumanResources = 'human_resources';
    case FleetMaintenance = 'fleet_maintenance';
    case ItAfcs = 'it_afcs';
    case CeoDecisions = 'ceo_decisions';

    public function label(): string
    {
        return match ($this) {
            self::ActionsAndResults => 'Actions taken and results',
            self::PendingMatters => 'Pending matters and deadlines',
            self::ResponsiblePersons => 'Responsible persons and departments',
            self::Operational => 'Operational concerns',
            self::Financial => 'Financial concerns',
            self::LegalCompliance => 'Legal and compliance concerns',
            self::HumanResources => 'HR concerns',
            self::FleetMaintenance => 'Fleet and maintenance concerns',
            self::ItAfcs => 'IT and AFCS concerns',
            self::CeoDecisions => 'Items requiring CEO decision',
        };
    }

    /** @return list<array{key: string, label: string}> */
    public static function options(): array
    {
        return array_map(fn (self $section) => ['key' => $section->value, 'label' => $section->label()], self::cases());
    }
}
