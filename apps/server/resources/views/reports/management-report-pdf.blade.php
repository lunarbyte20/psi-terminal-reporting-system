<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Executive Management Report — {{ $period['title'] }}</title>
    <style>
        @page { size: 8.5in 13in portrait; margin: 0.4in 0.48in; }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            font-size: 9.5px;
            line-height: 1.38;
            color: #1e293b;
            margin: 0 auto;
            width: 7.54in;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #1a1990;
            padding-bottom: 8px;
            margin-bottom: 14px;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-left img { height: 34px; width: auto; }
        .company-name { font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; color: #1a1990; text-transform: uppercase; }
        .company-sub { font-size: 8.5px; color: #64748b; }
        .header-right { text-align: right; }
        .report-title { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #1a1990; text-transform: uppercase; }
        .report-meta { font-size: 8.5px; color: #475569; margin-top: 2px; }

        .overview-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 3px; }
        .overview-lead { font-size: 9.5px; color: #334155; margin: 0 0 2px; }
        .source-note { font-size: 8.5px; color: #64748b; margin: 0 0 10px; }
        .source-note strong { color: #334155; }

        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-top: 2.5px solid #1a1990;
            border-radius: 3px;
            padding: 9px 11px;
        }
        .kpi-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .kpi-value { font-size: 16px; font-weight: 700; color: #0f172a; margin: 3px 0; font-variant-numeric: tabular-nums; }
        .kpi-delta { font-size: 8.5px; font-weight: 600; }
        .kpi-sub { font-size: 8px; color: #64748b; margin-top: 2px; }
        .up { color: #15803d; }
        .down { color: #b91c1c; }

        .section { margin-bottom: 16px; }
        .section-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #1a1990;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin: 0 0 4px;
        }

        .side-by-side { display: grid; grid-template-columns: 0.95fr 1.15fr; gap: 14px; align-items: center; break-inside: avoid; }
        .trend-wrap { border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 10px; background: #ffffff; break-inside: avoid; }

        table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
        th, td { padding: 3.5px 6px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
        th { background: #1e3a8a; color: #ffffff; font-weight: 600; font-size: 8px; letter-spacing: 0.02em; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .total-row td { font-weight: 700; background: #eef2ff !important; border-top: 1.5px solid #1e3a8a; border-bottom: 1.5px solid #1e3a8a; color: #0f172a; }
        .swatch { display: inline-block; width: 7px; height: 7px; border-radius: 1px; margin-right: 5px; vertical-align: middle; }

        .compact-table th, .compact-table td { padding: 2.2px 5px; font-size: 8px; }

        .eval-box { border: 1px solid #e2e8f0; border-left: 3px solid #1a1990; border-radius: 3px; padding: 8px 11px; margin-bottom: 8px; background: #ffffff; break-inside: avoid; }
        .eval-box h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; margin: 0 0 3px; color: #1e3a8a; }
        .eval-box p, .eval-box li { margin: 0 0 3px; color: #334155; white-space: pre-line; }
        .eval-box ol { margin: 2px 0 0; padding-left: 16px; }

        .tag { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 7.5px; background: #eef2ff; color: #1e3a8a; margin-right: 3px; }
        .sigs { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 24px; break-inside: avoid; }
        .sig-line { border-top: 1px solid #475569; padding-top: 4px; font-size: 9px; }
        .sig-role { color: #64748b; font-size: 8px; }
        .footer {
            margin-top: 14px;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #64748b;
        }
        .print-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: #eef2ff;
            border: 1px solid #c7d2fe;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 10px 0 14px;
        }
        .print-toolbar-note { font-size: 10px; color: #1e3a8a; }
        .print-toolbar-btn {
            background: #1a1990;
            color: #ffffff;
            border: 0;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }
        @media print {
            .print-toolbar { display: none; }
        }
    </style>
</head>
<body>
@if (! empty($printFallback))
    <div class="print-toolbar">
        <span class="print-toolbar-note">Choose <strong>Save as PDF</strong> (8.5 × 13 in, portrait) in the print dialog to download this report.</span>
        <button type="button" class="print-toolbar-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
@endif
@php
    $palette = ['#1a1990', '#0f9b8e', '#d4a017', '#7c6fd6', '#e07a5f', '#2e9e5b', '#3b82f6', '#64748b'];
    $sales = $dashboard['totals']['sales'];
    $isMonth = $period['kind'] === 'month';
    $currentLabel = $isMonth ? 'This month' : 'This week';
    $previousLabel = $dashboard['previous_week']['label'] ?? ($isMonth ? 'previous month' : 'previous week');
    $peso = fn (?string $v): string => $v === null ? '—' : '₱'.number_format((float) $v, 2);
    $pct = fn (?float $v): string => $v === null ? '—' : ($v > 0 ? '+'.$v.'%' : $v.'%');

    $renderPie = function (array $items, string $ariaLabel) use ($palette): string {
        $total = array_sum(array_column($items, 'value'));
        if ($total <= 0) {
            return '<p style="color:#64748b;font-size:8.5px;margin:6px 0;">No approved data recorded yet.</p>';
        }
        $cx = 165; $cy = 90; $r = 52; $dotR = $r * 0.72; $elbowR = $r + 12;
        $leftEndX = $cx - $r - 22; $rightEndX = $cx + $r + 22;
        $angle = -M_PI / 2;
        $slices = [];
        $callouts = [];
        $nonZero = array_values(array_filter($items, fn ($i) => $i['value'] > 0));
        foreach ($items as $idx => $item) {
            $val = (float) $item['value'];
            if ($val <= 0) continue;
            $sweep = ($val / $total) * M_PI * 2;
            $start = $angle; $end = $angle + $sweep; $mid = $start + $sweep / 2;
            $angle = $end;
            $x1 = $cx + cos($start) * $r; $y1 = $cy + sin($start) * $r;
            $x2 = $cx + cos($end) * $r; $y2 = $cy + sin($end) * $r;
            $large = ($end - $start) > M_PI ? 1 : 0;
            $color = $palette[$idx % count($palette)];
            $slices[] = ['color' => $color, 'd' => "M {$cx},{$cy} L {$x1},{$y1} A {$r},{$r} 0 {$large},1 {$x2},{$y2} Z"];
            $isLeft = cos($mid) < -0.02;
            $ex = $cx + cos($mid) * $elbowR; $ey = $cy + sin($mid) * $elbowR;
            $callouts[] = [
                'dotX' => $cx + cos($mid) * $dotR,
                'dotY' => $cy + sin($mid) * $dotR,
                'elbowX' => $ex,
                'elbowY' => $ey,
                'lineEndX' => $isLeft ? $leftEndX : $rightEndX,
                'labelY' => $ey,
                'isLeft' => $isLeft,
                'display' => $item['display'],
                'pct' => number_format(($val / $total) * 100, 1).'%',
            ];
        }
        $resolveY = function (array &$list): void {
            usort($list, fn ($a, $b) => $a['elbowY'] <=> $b['elbowY']);
            $gap = 20;
            for ($i = 1; $i < count($list); $i++) {
                if ($list[$i]['labelY'] - $list[$i - 1]['labelY'] < $gap) {
                    $list[$i]['labelY'] = $list[$i - 1]['labelY'] + $gap;
                }
            }
        };
        $leftC = array_values(array_filter($callouts, fn ($c) => $c['isLeft']));
        $rightC = array_values(array_filter($callouts, fn ($c) => !$c['isLeft']));
        $resolveY($leftC);
        $resolveY($rightC);
        $allCallouts = array_merge($leftC, $rightC);

        $svg = '<svg viewBox="0 0 330 182" width="100%" height="156" role="img" aria-label="'.e($ariaLabel).'">';
        if (count($nonZero) === 1) {
            $svg .= '<circle cx="'.$cx.'" cy="'.$cy.'" r="'.$r.'" fill="'.$slices[0]['color'].'" stroke="#ffffff" stroke-width="1.5" />';
        } else {
            foreach ($slices as $s) {
                $svg .= '<path d="'.$s['d'].'" fill="'.$s['color'].'" stroke="#ffffff" stroke-width="1.5" />';
            }
        }
        foreach ($allCallouts as $c) {
            $tx = $c['isLeft'] ? $c['lineEndX'] - 3 : $c['lineEndX'] + 3;
            $anchor = $c['isLeft'] ? 'end' : 'start';
            $svg .= '<polyline points="'.$c['dotX'].','.$c['dotY'].' '.$c['elbowX'].','.$c['labelY'].' '.$c['lineEndX'].','.$c['labelY'].'" fill="none" stroke="#334155" stroke-width="1" />';
            $svg .= '<circle cx="'.$c['dotX'].'" cy="'.$c['dotY'].'" r="2.4" fill="#1e293b" stroke="#ffffff" stroke-width="1.1" />';
            $svg .= '<text x="'.$tx.'" y="'.($c['labelY'] - 1).'" text-anchor="'.$anchor.'" font-size="8.5" font-weight="700" fill="#0f172a">'.e($c['display']).'</text>';
            $svg .= '<text x="'.$tx.'" y="'.($c['labelY'] + 8).'" text-anchor="'.$anchor.'" font-size="7.5" fill="#64748b">'.e($c['pct']).'</text>';
        }
        $svg .= '</svg>';
        return $svg;
    };

    $terminals = $dashboard['terminals'] ?? [];
    usort($terminals, fn ($a, $b) => ($a['rank'] ?? PHP_INT_MAX) <=> ($b['rank'] ?? PHP_INT_MAX));
    $statusLabels = [
        'approved' => 'Approved',
        'submitted' => 'Waiting for review',
        'draft' => 'Draft',
        'returned' => 'Returned',
        'not_started' => 'Not started',
    ];
    $issueStatusLabels = [
        'pending' => 'Pending',
        'ongoing' => 'Ongoing',
        'completed' => 'Completed',
        'on_hold' => 'On hold',
    ];
    $dir = $sales['direction'] ?? 'none';
@endphp

<header class="header">
    <div class="header-left">
        @if ($logoDataUri)
            <img src="{{ $logoDataUri }}" alt="Park Solutions Inc.">
        @endif
        <div>
            <div class="company-name">Park Solutions Inc.</div>
            <div class="company-sub">Terminal Operations &amp; Management Reporting</div>
        </div>
    </div>
    <div class="header-right">
        <div class="report-title">Executive {{ $isMonth ? 'Monthly' : 'Weekly' }} Summary</div>
        <div class="report-meta">Reporting Period: <strong>{{ $period['title'] }}</strong> · Generated {{ $generatedAt }}</div>
    </div>
</header>

<section class="section">
    <h1 class="overview-title">Performance Overview</h1>
    <p class="overview-lead">
        Approved terminal sales totaled <strong>{{ $peso($sales['current']) }}</strong>
        @if ($dir !== 'none' && $sales['percent_change'] !== null)
            ({{ $dir === 'up' ? 'up' : ($dir === 'down' ? 'down' : 'unchanged') }} {{ abs((float) $sales['percent_change']) }}% vs. {{ $previousLabel }}).
        @else
            for {{ $period['title'] }}.
        @endif
    </p>
    <p class="source-note"><strong>Source:</strong> Approved weekly reports only ({{ $dashboard['progress']['approved'] }} of {{ $dashboard['progress']['terminals'] }} terminals approved).</p>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Approved Sales</div>
            <div class="kpi-value">{{ $peso($sales['current']) }}</div>
            @if ($dir !== 'none' && $sales['percent_change'] !== null)
                <div class="kpi-delta {{ $dir === 'up' ? 'up' : ($dir === 'down' ? 'down' : '') }}">
                    {{ $dir === 'up' ? '▲ Up' : ($dir === 'down' ? '▼ Down' : '—') }} {{ abs((float) $sales['percent_change']) }}% ({{ $peso($sales['variance']) }})
                </div>
            @else
                <div class="kpi-delta" style="color:#64748b;">No prior comparison</div>
            @endif
            <div class="kpi-sub">Previous: {{ $peso($sales['previous']) }}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Total Ridership</div>
            <div class="kpi-value">{{ number_format((int) $dashboard['totals']['ridership']) }}</div>
            <div class="kpi-delta" style="color:#1e3a8a;">{{ number_format((int) $dashboard['totals']['trips']) }} trips recorded</div>
            <div class="kpi-sub">Across approved terminal reports</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Reporting &amp; Issues</div>
            <div class="kpi-value">{{ $dashboard['progress']['approved'] }} / {{ $dashboard['progress']['terminals'] }}</div>
            <div class="kpi-delta {{ $issues['overdue'] > 0 ? 'down' : '' }}">
                {{ $issues['open'] }} open {{ $issues['open'] === 1 ? 'issue' : 'issues' }} ({{ $issues['overdue'] }} overdue)
            </div>
            <div class="kpi-sub">{{ $issues['ceo_decision'] }} requiring CEO decision</div>
        </div>
    </div>

    @php
        $trend = $dashboard['trend'] ?? [];
        $maxTrend = max(1, ...array_map(fn ($w) => (float) $w['sales'], $trend ?: [['sales' => 0]]));
    @endphp
    @if (count($trend) > 0)
        <h2 class="section-title">Weekly Sales Trend</h2>
        <p class="source-note"><strong>Source:</strong> Approved weekly sales across the last {{ count($trend) }} reporting weeks.</p>
        <div class="trend-wrap">
            <svg viewBox="0 0 680 112" width="100%" height="100" role="img" aria-label="Weekly sales trend">
                @php $count = count($trend); $slotW = 640 / max(1, $count); $barW = min(38, $slotW * 0.54); @endphp
                @foreach ($trend as $i => $w)
                    @php
                        $val = (float) $w['sales'];
                        $h = max(2, ($val / $maxTrend) * 68);
                        $x = 20 + $i * $slotW + ($slotW - $barW) / 2;
                        $y = 88 - $h;
                        $isLast = $i === $count - 1;
                        $compact = $val >= 1000000 ? '₱'.number_format($val / 1000000, 1).'M' : ($val >= 1000 ? '₱'.round($val / 1000).'K' : '₱'.round($val));
                    @endphp
                    <rect x="{{ $x }}" y="{{ $y }}" width="{{ $barW }}" height="{{ $h }}" rx="2" fill="{{ $isLast ? '#1a1990' : '#8d86d8' }}" />
                    <text x="{{ $x + $barW / 2 }}" y="{{ $y - 3 }}" text-anchor="middle" font-size="8" fill="#334155">{{ $compact }}</text>
                    <text x="{{ $x + $barW / 2 }}" y="102" text-anchor="middle" font-size="7.5" fill="#64748b">{{ \Illuminate\Support\Str::limit($w['label'], 10, '') }}</text>
                @endforeach
            </svg>
        </div>
    @endif
</section>

<section class="section">
    <h2 class="section-title">Sales by Supervisor</h2>
    <p class="source-note"><strong>Source:</strong> Approved reports grouped by supervisor. Percentages reflect share of total approved sales.</p>
    @php
        $supRows = $dashboard['supervisor_ranking'] ?? [];
        $supPieItems = array_map(fn ($r) => ['value' => (float) $r['current'], 'display' => $peso($r['current'])], $supRows);
    @endphp
    <div class="side-by-side">
        <div>{!! $renderPie($supPieItems, 'Sales distribution by supervisor') !!}</div>
        <table>
            <thead>
                <tr>
                    <th>Supervisor</th><th class="num">Terms</th>
                    <th class="num">{{ $currentLabel }}</th><th class="num">Previous</th><th class="num">% chg</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($supRows as $idx => $row)
                    <tr>
                        <td><span class="swatch" style="background:{{ $palette[$idx % count($palette)] }}"></span>{{ $row['supervisor'] }}</td>
                        <td class="num">{{ $row['reporting_terminals'] }}</td>
                        <td class="num">{{ $peso($row['current']) }}</td>
                        <td class="num">{{ $peso($row['previous']) }}</td>
                        <td class="num">{{ $pct($row['percent_change']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" style="color:#64748b;">No approved reports yet.</td></tr>
                @endforelse
                <tr class="total-row">
                    <td>Total</td>
                    <td class="num">{{ $dashboard['progress']['approved'] }}</td>
                    <td class="num">{{ $peso($sales['current']) }}</td>
                    <td class="num">{{ $peso($sales['previous']) }}</td>
                    <td class="num">{{ $pct($sales['percent_change']) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 class="section-title">Ridership by Vehicle Type</h2>
    <p class="source-note"><strong>Source:</strong> Passenger volume and trip counts from approved reports.</p>
    @php
        $ridershipRows = $dashboard['ridership_by_vehicle_type'] ?? [];
        $ridershipPieItems = array_map(fn ($r) => ['value' => (float) $r['ridership'], 'display' => number_format((int) $r['ridership'])], $ridershipRows);
    @endphp
    <div class="side-by-side">
        <div>{!! $renderPie($ridershipPieItems, 'Ridership by vehicle type') !!}</div>
        <table>
            <thead><tr><th>Vehicle type</th><th class="num">Passengers</th><th class="num">Trips</th></tr></thead>
            <tbody>
                @forelse ($ridershipRows as $idx => $line)
                    <tr>
                        <td><span class="swatch" style="background:{{ $palette[$idx % count($palette)] }}"></span>{{ $line['vehicle_type'] }}</td>
                        <td class="num">{{ number_format((int) $line['ridership']) }}</td>
                        <td class="num">{{ number_format((int) $line['trips']) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" style="color:#64748b;">No ridership recorded.</td></tr>
                @endforelse
                <tr class="total-row">
                    <td>Total</td>
                    <td class="num">{{ number_format((int) $dashboard['totals']['ridership']) }}</td>
                    <td class="num">{{ number_format((int) $dashboard['totals']['trips']) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>

<section class="section">
    <h2 class="section-title">Terminal Sales Breakdown</h2>
    <p class="source-note"><strong>Source:</strong> All terminals ordered by approved sales rank, followed by pending reports.</p>
    <table class="compact-table">
        <thead>
            <tr>
                <th>#</th><th>Terminal</th><th>Supervisor</th>
                <th class="num">{{ $currentLabel }}</th><th class="num">Previous</th>
                <th class="num">Variance</th><th class="num">% chg</th><th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($terminals as $row)
                <tr>
                    <td>{{ $row['rank'] ?? '—' }}</td>
                    <td>{{ $row['terminal'] }}</td>
                    <td>{{ $row['supervisor'] ?? 'Unassigned' }}</td>
                    <td class="num">{{ $peso($row['current']) }}</td>
                    <td class="num">{{ $peso($row['previous']) }}</td>
                    <td class="num">{{ $row['counted'] ? $peso($row['variance']) : '—' }}</td>
                    <td class="num">{{ $row['counted'] ? $pct($row['percent_change']) : '—' }}</td>
                    <td>{{ $statusLabels[$row['status'] ?? 'not_started'] ?? ($row['status'] ?? 'Not started') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td></td><td>Total</td><td></td>
                <td class="num">{{ $peso($sales['current']) }}</td>
                <td class="num">{{ $peso($sales['previous']) }}</td>
                <td class="num">{{ $peso($sales['variance']) }}</td>
                <td class="num">{{ $pct($sales['percent_change']) }}</td>
                <td></td>
            </tr>
        </tbody>
    </table>
</section>

@if (count($issues['items'] ?? []) > 0)
<section class="section">
    <h2 class="section-title">Open Operational Issues</h2>
    <table class="compact-table">
        <thead>
            <tr><th>Issue</th><th>Tags</th><th>Terminal</th><th>Responsible</th><th>Status</th><th>Target date</th></tr>
        </thead>
        <tbody>
            @foreach ($issues['items'] as $item)
                <tr>
                    <td>{{ $item['key_issue'] }}{{ !empty($item['requires_ceo_decision']) ? ' (CEO decision)' : '' }}</td>
                    <td>
                        @foreach ($item['tags'] ?? [] as $tag)
                            <span class="tag">{{ $tag['name'] }}</span>
                        @endforeach
                    </td>
                    <td>{{ $item['terminal'] ?? 'General' }}</td>
                    <td>{{ $item['responsible_person'] ?? '—' }}</td>
                    <td>{{ ($issueStatusLabels[$item['status']] ?? $item['status']).(!empty($item['overdue']) ? ', overdue' : '') }}</td>
                    <td>{{ $item['target_date'] ? \Illuminate\Support\Carbon::parse($item['target_date'])->format('M j, Y') : '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</section>
@endif

<section class="section">
    <h2 class="section-title">Management Evaluation &amp; Recommendations</h2>
    @forelse ($evaluations as $ev)
        <div class="eval-box">
            @if ($isMonth && $ev['week'])
                <div style="font-size:8.5px; font-weight:700; color:#1a1990; margin-bottom:4px;">Week of {{ $ev['week'] }}</div>
            @endif
            @if ($ev['key_concerns'])
                <h3>Key Issues &amp; Concerns</h3>
                <p>{{ $ev['key_concerns'] }}</p>
            @endif
            @if ($ev['evaluation'])
                <h3 style="margin-top:5px;">Evaluation</h3>
                <p>{{ $ev['evaluation'] }}</p>
            @endif
            @if (count($ev['recommendations']) > 0)
                <h3 style="margin-top:5px;">Recommendations</h3>
                <ol>
                    @foreach ($ev['recommendations'] as $rec)
                        <li>{{ $rec }}</li>
                    @endforeach
                </ol>
            @endif
            @foreach ($sectionOptions as $opt)
                @if (!empty($ev['sections'][$opt['key']]))
                    <h3 style="margin-top:5px;">{{ $opt['label'] }}</h3>
                    <p>{{ $ev['sections'][$opt['key']] }}</p>
                @endif
            @endforeach
        </div>
    @empty
        <p style="color:#64748b;font-size:8.5px;">No management evaluation has been recorded for this period yet.</p>
    @endforelse

    <div class="sigs">
        <div class="sig-line">
            <div><strong>{{ $evaluations[0]['prepared_by'] ?? '________________________' }}</strong></div>
            <div class="sig-role">Prepared by</div>
        </div>
        <div class="sig-line">
            <div><strong>________________________</strong></div>
            <div class="sig-role">Noted by · Chief Executive Officer</div>
        </div>
    </div>
</section>

<footer class="footer">
    <span>Confidential — For executive management use only · Park Solutions Inc.</span>
    <span>{{ $period['title'] }}</span>
</footer>

<script>
    (function () {
        var maxTotalPx = 3 * 11.7 * 96;
        var h = document.body.scrollHeight;
        if (h > maxTotalPx) {
            document.body.style.zoom = String(Math.max(0.65, maxTotalPx / h));
        }
        @if (! empty($printFallback))
        window.addEventListener('load', function () {
            window.print();
        });
        @endif
    })();
</script>
</body>
</html>
