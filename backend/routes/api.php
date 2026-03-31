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

Route::get('/pollution', function (Request $request) {
    $pathsToTry = [
        storage_path('app/public/pollution_gps.json'),
        storage_path('app/pollution_gps.json'),
        public_path('storage/pollution_gps.json'),
        public_path('pollution_gps.json'),
    ];

    $foundPath = null;

    foreach ($pathsToTry as $path) {
        if (File::exists($path)) {
            $foundPath = $path;
            break;
        }
    }

    if (!$foundPath) {
        return response()->json([
            'error' => 'File not found',
            'tried' => $pathsToTry,
        ], 404);
    }

    $raw = File::get($foundPath);
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        return response()->json([
            'error' => 'Invalid JSON',
            'path' => $foundPath,
        ], 500);
    }

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
        $itemDate = $item['date'] ?? null;
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