'use strict';
const PIT = { entry: .86, span: .28, halfWidth: 54, seconds: 4, speed: 75 };
function pitPhase(f, track = 0) { return wrap(f + TRACKS[track].offset - PIT.entry); }
function pitFraction(u, track = 0) { return wrap(PIT.entry + u - TRACKS[track].offset); }
function pitOffset(f, track = 0) {
    const u = pitPhase(f, track), smooth = t => t * t * (3 - 2 * t);
    if (u > PIT.span)
        return null;
    const q = position(f, 0, track), y = position(-TRACKS[track].offset, 0, track).y - [1050, 1200, 630][track];
    const lane = Math.min(-260, (y - q.y) / Math.cos(q.angle));
    if (u < .08)
        return -60 + (lane + 60) * smooth(u / .08);
    if (u > .20)
        return lane + (-60 - lane) * smooth((u - .20) / .08);
    return lane;
}
function pitPosition(u, track = 0) { const f = pitFraction(u, track); return position(f, pitOffset(f, track), track); }
function pitGate(f, track = 0) { const u = pitPhase(f, track); return u < .08 || u > .20 && u < PIT.span; }
function pitRoad(b, q = trackInfo(b.x, b.y, b.track)) {
    const offset = pitOffset(q.fraction, b.track);
    return b.inPitLane && offset !== null && Math.abs(q.distance - offset) <= PIT.halfWidth;
}
function tireGrip(b) { return .55 + .45 * Math.sqrt(clamp(b.tires ?? 1, 0, 1)); }
function wearTires(b, input, dt) {
    const distance = Math.hypot(b.vx, b.vy) * dt;
    const abrasion = distance / trackMesh(b.track).total * .09;
    const stress = (Math.min(b.slip || 0, 100) * .000012 + (input.brake && b.speed > 90 ? .0005 : 0)) * dt;
    b.tires = clamp((b.tires ?? 1) - abrasion - stress, 0, 1);
}
function inPitZone(b) { const q = trackInfo(b.x, b.y, b.track), u = pitPhase(q.fraction, b.track); return pitRoad(b, q) && u >= .10 && u <= .20 && Math.abs(q.distance - pitOffset(q.fraction, b.track)) < 28; }
function stepPit(b, dt) {
    if (b.pitService > 0) {
        b.vx = b.vy = b.speed = b.yaw = b.impactYaw = 0;
        b.pitService = Math.max(0, b.pitService - dt);
        if (b.pitService < 1e-8) {
            b.pitService = 0;
            b.tires = 1;
            b.pitRequested = false;
            b.pitVisitServiced = true;
            b.pitStops = (b.pitStops || 0) + 1;
            b.tireWarning = 0;
            if (b === race)
                toast('Pneus novos! Volte à corrida.');
        }
        return true;
    }
    if (!b.pitVisitServiced && inPitZone(b) && Math.hypot(b.vx, b.vy) < 8) {
        b.pitService = PIT.seconds;
        b.vx = b.vy = b.speed = 0;
        b.collisionPending = false;
        b.stuckSeconds = 0;
        b.stuckAnchor = null;
        if (b === race)
            toast('Pit stop: troca dos quatro pneus em 4 segundos.');
        return true;
    }
    return false;
}
function togglePit() {
    if (!race || race.done || race.pitService > 0)
        return;
    race.pitRequested = !race.pitRequested;
    toast(race.pitRequested ? 'Boxes solicitados. Entre pela abertura PIT IN antes da chegada, siga a via interna e pare no box.' : 'Entrada nos boxes cancelada.');
}
