<?php

namespace App\Modules\Terminals\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Terminals\Actions\SaveVehicleType;
use App\Modules\Terminals\Actions\SetRecordArchived;
use App\Modules\Terminals\Http\Requests\ListRecordsRequest;
use App\Modules\Terminals\Http\Requests\SaveVehicleTypeRequest;
use App\Modules\Terminals\Http\Requests\SetArchivedRequest;
use App\Modules\Terminals\Models\VehicleType;
use App\Modules\Terminals\Support\ArchiveFilter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Vehicle types are a short list, so adding and editing happen in a dialog on the list page. */
class VehicleTypeController extends Controller
{
    public function index(ListRecordsRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('admin/vehicle-types/index', [
            'filters' => $filters,
            'vehicleTypes' => ArchiveFilter::apply(VehicleType::query(), $filters['status'], $filters['q'])
                ->ordered()->orderBy('id')
                ->paginate(50, ['id', 'name', 'sort_order', 'archived_at'])->withQueryString(),
        ]);
    }

    public function store(SaveVehicleTypeRequest $request, SaveVehicleType $action): RedirectResponse
    {
        $action->execute($request->user(), null, $request->string('name')->toString(), $request->integer('sort_order'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vehicle type added.']);

        return back();
    }

    public function update(SaveVehicleTypeRequest $request, VehicleType $vehicleType, SaveVehicleType $action): RedirectResponse
    {
        $action->execute($request->user(), $vehicleType, $request->string('name')->toString(), $request->integer('sort_order'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Vehicle type changes saved.']);

        return back();
    }

    public function archive(SetArchivedRequest $request, VehicleType $vehicleType, SetRecordArchived $action): RedirectResponse
    {
        $archived = $request->boolean('archived');
        $action->execute($request->user(), $vehicleType, $archived);
        Inertia::flash('toast', ['type' => 'success', 'message' => $archived ? 'Vehicle type archived. Past ridership stays saved.' : 'Vehicle type restored.']);

        return back();
    }
}
