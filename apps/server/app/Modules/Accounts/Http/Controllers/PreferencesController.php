<?php

namespace App\Modules\Accounts\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounts\Actions\SavePreferences;
use App\Modules\Accounts\Http\Requests\SavePreferencesRequest;
use Illuminate\Http\JsonResponse;

class PreferencesController extends Controller
{
    public function update(SavePreferencesRequest $request, SavePreferences $action): JsonResponse
    {
        $action->execute($request->user(), $request->validated());

        return response()->json(['saved' => true]);
    }
}
