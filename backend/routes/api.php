<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

function parseNumberValue($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }

    $normalized = str_replace(',', '.', (string) $value);

    return is_numeric($normalized) ? (float) $normalized : null;
}

function normalizeDateValue($value): ?string
{
    if (!$value) {
        return null;
    }

    $value = trim((string) $value);

    if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value)) {
        return substr($value, 0, 10);
    }

    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $value, $matches)) {
        return "{$matches[3]}-{$matches[2]}-{$matches[1]}";
    }

    return null;
}

function haversineDistance($lat1, $lon1, $lat2, $lon2): float
{
    $earthRadius = 6371;

    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) ** 2 +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) ** 2;

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}

function findNearestMeteo(float $lat, float $lon, array $meteoData): ?array
{
    $best = null;
    $bestDistance = INF;

    foreach ($meteoData as $meteo) {
        $meteoLat = parseNumberValue($meteo['lat'] ?? null);
        $meteoLon = parseNumberValue($meteo['lon'] ?? null);

        if ($meteoLat === null || $meteoLon === null) {
            continue;
        }

        $distance = haversineDistance($lat, $lon, $meteoLat, $meteoLon);

        if ($distance < $bestDistance) {
            $bestDistance = $distance;
            $best = $meteo;
        }
    }

    if ($best !== null) {
        $best['_distance_km'] = round($bestDistance, 2);
    }

    return $best;
}

function normalizeRange(float $value, float $min, float $max): float
{
    if ($max <= $min) {
        return 0;
    }

    $value = max($min, min($max, $value));

    return ($value - $min) / ($max - $min);
}

function computeAirMeteoIndex(float $pollutionValue, array $meteo): array
{
    $humidity = parseNumberValue($meteo['humidity'] ?? 0) ?? 0;
    $windSpeed = parseNumberValue($meteo['wind_speed'] ?? 0) ?? 0;
    $precipitation = parseNumberValue($meteo['precipitation'] ?? 0) ?? 0;
    $temperature = parseNumberValue($meteo['temperature'] ?? 0) ?? 0;

    $pollutionScore = normalizeRange($pollutionValue, 0, 100) * 0.60;
    $humidityScore = normalizeRange($humidity, 0, 100) * 0.15;
    $temperatureScore = normalizeRange($temperature, -10, 45) * 0.10;

    $windPenalty = normalizeRange($windSpeed, 0, 60) * 0.10;
    $rainPenalty = normalizeRange($precipitation, 0, 20) * 0.05;

    $rawScore = $pollutionScore + $humidityScore + $temperatureScore - $windPenalty - $rainPenalty;
    $finalScore = max(0, min(1, $rawScore));
    $score100 = round($finalScore * 100, 2);

    $riskLevel = match (true) {
        $score100 < 25 => 'faible',
        $score100 < 50 => 'modere',
        $score100 < 75 => 'eleve',
        default => 'tres_eleve',
    };

    return [
        'air_meteo_index' => $score100,
        'risk_level' => $riskLevel,
        'weights' => [
            'pollution' => 0.60,
            'humidity' => 0.15,
            'temperature' => 0.10,
            'wind_penalty' => 0.10,
            'rain_penalty' => 0.05,
        ],
    ];
}

function loadJsonFromKnownPaths(array $paths): array
{
    foreach ($paths as $path) {
        if (File::exists($path)) {
            $raw = File::get($path);
            $data = json_decode($raw, true);

            if (!is_array($data)) {
                abort(response()->json([
                    'error' => 'Invalid JSON',
                    'path' => $path,
                ], 500));
            }

            return [$path, $data];
        }
    }

    abort(response()->json([
        'error' => 'File not found',
        'tried' => $paths,
    ], 404));
}

Route::get('/pollution', function (Request $request) {
    [, $data] = loadJsonFromKnownPaths([
        storage_path('app/public/pollution_gps.json'),
        storage_path('app/pollution_gps.json'),
        public_path('storage/pollution_gps.json'),
        public_path('pollution_gps.json'),
    ]);

    $polluant = strtoupper(trim((string) $request->query('polluant', '')));
    $dateStart = $request->query('date_start');
    $dateEnd = $request->query('date_end');
    $minValue = $request->query('min_value');
    $maxValue = $request->query('max_value');

    $filtered = array_filter($data, function ($item) use (
        $polluant,
        $dateStart,
        $dateEnd,
        $minValue,
        $maxValue
    ) {
        $itemPolluant = strtoupper(trim((string) ($item['polluant'] ?? '')));
        $itemDate = normalizeDateValue($item['date'] ?? null);
        $valeur = parseNumberValue($item['valeur'] ?? null);
        $lat = parseNumberValue($item['lat'] ?? null);
        $lon = parseNumberValue($item['lon'] ?? null);

        if ($lat === null || $lon === null || $valeur === null) {
            return false;
        }

        if ($polluant !== '' && $itemPolluant !== $polluant) {
            return false;
        }

        if ($dateStart && (!$itemDate || $itemDate < $dateStart)) {
            return false;
        }

        if ($dateEnd && (!$itemDate || $itemDate > $dateEnd)) {
            return false;
        }

        if ($minValue !== null && $minValue !== '' && $valeur < (float) $minValue) {
            return false;
        }

        if ($maxValue !== null && $maxValue !== '' && $valeur > (float) $maxValue) {
            return false;
        }

        return true;
    });

    return response()->json(array_values($filtered));
});

Route::get('/pollution-enriched', function (Request $request) {
    [, $pollutionData] = loadJsonFromKnownPaths([
        storage_path('app/public/pollution_gps.json'),
        storage_path('app/pollution_gps.json'),
        public_path('storage/pollution_gps.json'),
        public_path('pollution_gps.json'),
    ]);

    [, $meteoData] = loadJsonFromKnownPaths([
        storage_path('app/public/meteo.json'),
        storage_path('app/meteo.json'),
        public_path('storage/meteo.json'),
        public_path('meteo.json'),
    ]);

    $polluant = strtoupper(trim((string) $request->query('polluant', '')));
    $dateStart = $request->query('date_start');
    $dateEnd = $request->query('date_end');
    $minValue = $request->query('min_value');
    $maxValue = $request->query('max_value');
    $riskLevel = strtolower(trim((string) $request->query('risk_level', '')));

    $result = [];

    foreach ($pollutionData as $item) {
        $lat = parseNumberValue($item['lat'] ?? null);
        $lon = parseNumberValue($item['lon'] ?? null);
        $valeur = parseNumberValue($item['valeur'] ?? null);
        $itemDate = normalizeDateValue($item['date'] ?? null);
        $itemPolluant = strtoupper(trim((string) ($item['polluant'] ?? '')));

        if ($lat === null || $lon === null || $valeur === null) {
            continue;
        }

        if ($polluant !== '' && $itemPolluant !== $polluant) {
            continue;
        }

        if ($dateStart && (!$itemDate || $itemDate < $dateStart)) {
            continue;
        }

        if ($dateEnd && (!$itemDate || $itemDate > $dateEnd)) {
            continue;
        }

        if ($minValue !== null && $minValue !== '' && $valeur < (float) $minValue) {
            continue;
        }

        if ($maxValue !== null && $maxValue !== '' && $valeur > (float) $maxValue) {
            continue;
        }

        $nearestMeteo = findNearestMeteo($lat, $lon, $meteoData);

        if ($nearestMeteo === null) {
            continue;
        }

        $index = computeAirMeteoIndex($valeur, $nearestMeteo);

        if ($riskLevel !== '' && strtolower($index['risk_level']) !== $riskLevel) {
            continue;
        }

        $result[] = [
            'station' => $item['station'] ?? 'Station inconnue',
            'lat' => $lat,
            'lon' => $lon,
            'polluant' => $item['polluant'] ?? null,
            'valeur' => $valeur,
            'date' => $itemDate,
            'meteo' => [
                'station_meteo' => $nearestMeteo['station_meteo'] ?? null,
                'temperature' => parseNumberValue($nearestMeteo['temperature'] ?? null),
                'humidity' => parseNumberValue($nearestMeteo['humidity'] ?? null),
                'wind_speed' => parseNumberValue($nearestMeteo['wind_speed'] ?? null),
                'pressure' => parseNumberValue($nearestMeteo['pressure'] ?? null),
                'precipitation' => parseNumberValue($nearestMeteo['precipitation'] ?? null),
                'meteo_date' => normalizeDateValue($nearestMeteo['meteo_date'] ?? null),
            ],
            'spatial_match_distance_km' => $nearestMeteo['_distance_km'] ?? null,
            'air_meteo_index' => $index['air_meteo_index'],
            'risk_level' => $index['risk_level'],
            'weights' => $index['weights'],
        ];
    }

    return response()->json($result);
});