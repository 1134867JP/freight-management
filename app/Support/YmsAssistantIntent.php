<?php

namespace App\Support;

final class YmsAssistantIntent
{
    public const TIMESLOT_CAPACITY = 'timeslot_capacity';

    public const YARD_VEHICLES = 'yard_vehicles';

    public const LATE_FREIGHTS = 'late_freights';

    public const MISSING_ARRIVALS = 'missing_arrivals';

    public const AVAILABLE_DOCKS = 'available_docks';

    public const CLIENT_OPERATION = 'client_operation';

    public const AVERAGE_SERVICE_TIME = 'average_service_time';

    public const OPERATIONAL_ISSUES = 'operational_issues';

    public const OPERATION_SUMMARY = 'operation_summary';

    public const UNSUPPORTED = 'unsupported';

    public static function all(): array
    {
        return [
            self::TIMESLOT_CAPACITY,
            self::YARD_VEHICLES,
            self::LATE_FREIGHTS,
            self::MISSING_ARRIVALS,
            self::AVAILABLE_DOCKS,
            self::CLIENT_OPERATION,
            self::AVERAGE_SERVICE_TIME,
            self::OPERATIONAL_ISSUES,
            self::OPERATION_SUMMARY,
            self::UNSUPPORTED,
        ];
    }
}
