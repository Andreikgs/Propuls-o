'use strict';
const RACE_LAPS = 10, GRID_SIZE = 15, RACE_TIMEOUT = 3600000;
const WORLD = { width: 21600, height: 12960, cx: 10800, cy: 6480, halfRoad: 128 };
const wrap = n => (n % 1 + 1) % 1, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const TRACKS = [
    { name: 'Daytona', full: 'Daytona International Speedway', miles: '2,5 mi', type: 'Trioval · largada central', offset: 0 },
    { name: 'Talladega', full: 'Talladega Superspeedway', miles: '2,66 mi', type: 'Trioval · chegada após o arco', offset: .065 },
    { name: 'Bristol', full: 'Bristol Motor Speedway', miles: '0,533 mi', type: 'Oval curto · concreto', offset: 0 }
];
const trackMeshes = new Map();
// Hand-built plan-view adaptations of the official venue maps; game units are not real metres.
// Cubic segments preserve long straights, connected turn tangents and the trioval frontstretch.
function trackMesh(track = 0) {
    if (trackMeshes.has(track))
        return trackMeshes.get(track);
    let start, curves;
    if (track === 2) {
        const k = 303.7566;
        start = [0, 550];
        curves = [
            [[233, 550], [466, 550], [700, 550]],
            [[700 + k, 550], [1250, k], [1250, 0]],
            [[1250, -k], [700 + k, -550], [700, -550]],
            [[233, -550], [-233, -550], [-700, -550]],
            [[-700 - k, -550], [-1250, -k], [-1250, 0]],
            [[-1250, k], [-700 - k, 550], [-700, 550]],
            [[-466, 550], [-233, 550], [0, 550]]
        ];
    }
    else {
        const wide = track === 1 ? 1.06 : 1, front = track === 1 ? 940 : 860, back = track === 1 ? -760 : -720;
        start = [0, front];
        curves = [
            [[300, front], [700, 700], [1080, 510]],
            [[1480, 310], [1780, 260], [1780, -90]],
            [[1780, -440], [1500, back], [1120, back]],
            [[400, back], [-400, back], [-1120, back]],
            [[-1500, back], [-1780, -440], [-1780, -90]],
            [[-1780, 260], [-1480, 310], [-1080, 510]],
            [[-700, 700], [-300, front], [0, front]]
        ];
        start[0] *= wide;
        curves = curves.map(c => c.map(p => [p[0] * wide, p[1]]));
    }
    start = start.map(v => v * 4.5);
    curves = curves.map(c => c.map(p => p.map(v => v * 4.5)));
    const points = [];
    let from = start;
    for (const [b, c, d] of curves) {
        for (let j = 0; j < 100; j++) {
            const t = j / 100, u = 1 - t;
            points.push({ x: WORLD.cx + u * u * u * from[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], y: WORLD.cy + u * u * u * from[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1] });
        }
        from = d;
    }
    let total = 0;
    const segments = points.map((a, i) => { const b = points[(i + 1) % points.length], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), seg = { x: a.x, y: a.y, dx, dy, len, s: total, nx: -dy / len, ny: dx / len }; total += len; return seg; });
    const mesh = { segments, total };
    trackMeshes.set(track, mesh);
    return mesh;
}
function position(p, lane = 0, track = 0) {
    const mesh = trackMesh(track), distance = wrap(p + TRACKS[track].offset) * mesh.total;
    let lo = 0, hi = mesh.segments.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (mesh.segments[mid].s <= distance)
            lo = mid;
        else
            hi = mid - 1;
    }
    const s = mesh.segments[lo], t = (distance - s.s) / s.len;
    return { x: s.x + s.dx * t + lane * s.nx, y: s.y + s.dy * t + lane * s.ny, angle: Math.atan2(s.dy, s.dx) };
}
function trackInfo(x, y, track = 0) {
    const mesh = trackMesh(track);
    let best = Infinity, result;
    for (const s of mesh.segments) {
        const t = clamp(((x - s.x) * s.dx + (y - s.y) * s.dy) / (s.len * s.len), 0, 1), dx = x - s.x - t * s.dx, dy = y - s.y - t * s.dy, d2 = dx * dx + dy * dy;
        if (d2 < best) {
            best = d2;
            result = { fraction: wrap((s.s + t * s.len) / mesh.total - TRACKS[track].offset), distance: Math.sqrt(d2) * (dx * s.nx + dy * s.ny < 0 ? -1 : 1), nx: s.nx, ny: s.ny };
        }
    }
    return result;
}
function championshipTrack(round) { return Math.max(0, round - 1) % TRACKS.length; }
