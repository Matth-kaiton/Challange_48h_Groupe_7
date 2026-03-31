<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class PollutionController extends Controller
{
    public function index(Request $request)
    {
        $path = storage_path('app/public/pollution_gps.json');

        if (!File::exists($path)) {
            return response()->json([
                'message' => 'Fichier JSON introuvable'
            ], 404);
        }

        $content = File::get($path);
        $data = json_decode($content, true);

        if (!is_array($data)) {
            return response()->json([
                'message' => 'JSON invalide'
            ], 500);
        }

        $filtered = array_filter($data, function ($item) use ($request) {
            $polluant = strtoupper(trim((string)($request->query('polluant', ''))));
            $dateStart = $request->query('date_start');
            $dateEnd = $request->query('date_end');
            $minValue = $request->query('min_value');
            $maxValue = $request->query('max_value');
            $latMin = $request->query('lat_min');
            $latMax = $request->query('lat_max');
            $lonMin = $request->query('lon_min');
            $lonMax = $request->query('lon_max');

            $itemPolluant = strtoupper(trim((string)($item['polluant'] ?? '')));
            $itemDate = $item['date'] ?? null;
            $itemLat = $this->parseNumber($item['lat'] ?? null);
            $itemLon = $this->parseNumber($item['lon'] ?? null);
            $itemValeur = $this->parseNumber($item['valeur'] ?? null);

            if ($itemLat === null || $itemLon === null || $itemValeur === null) {
                return false;
            }

            if ($polluant !== '' && $itemPolluant !== $polluant) {
                return false;
            }

            if ($dateStart && $itemDate && $itemDate < $dateStart) {
                return false;
            }

            if ($dateEnd && $itemDate && $itemDate > $dateEnd) {
                return false;
            }

            if ($dateStart && !$itemDate) {
                return false;
            }

            if ($dateEnd && !$itemDate) {
                return false;
            }

            if ($minValue !== null && $minValue !== '' && $itemValeur < (float)$minValue) {
                return false;
            }

            if ($maxValue !== null && $maxValue !== '' && $itemValeur > (float)$maxValue) {
                return false;
            }

            if ($latMin !== null && $latMin !== '' && $itemLat < (float)$latMin) {
                return false;
            }

            if ($latMax !== null && $latMax !== '' && $itemLat > (float)$latMax) {
                return false;
            }

            if ($lonMin !== null && $lonMin !== '' && $itemLon < (float)$lonMin) {
                return false;
            }

            if ($lonMax !== null && $lonMax !== '' && $itemLon > (float)$lonMax) {
                return false;
            }

            return true;
        });

        return response()->json(array_values($filtered));
    }

    private function parseNumber($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        $normalized = str_replace(',', '.', (string)$value);

        return is_numeric($normalized) ? (float)$normalized : null;
    }
}