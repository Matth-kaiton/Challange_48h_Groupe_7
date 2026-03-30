use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/pollution', function () {

    if (!Storage::exists('pollution_gps.json')) {
        return response()->json(['error' => 'File not found'], 404);
    }

    $data = Storage::get('pollution_gps.json');

    return response()->json(json_decode($data));
});