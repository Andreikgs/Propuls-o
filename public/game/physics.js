'use strict';
function createDriver(track = 0) {
    const pos = position(0, 0, track);
    return { ...pos, track, vx: 0, vy: 0, speed: 0, steer: 0, yaw: 0, p: 0, gates: 0, prevFraction: 0, offroad: false, wrongWay: false, recovery: 0, tires: 1, pitRequested: false, pitService: 0, pitStops: 0, skids: [] };
}
function updateProgress(r) {
    const info = trackInfo(r.x, r.y, r.track), f = info.fraction;
    let delta = f - r.prevFraction;
    if (delta > .5)
        delta--;
    if (delta < -.5)
        delta++;
    r.wrongWay = delta < -.00003 && r.speed > 20;
    const gate = wrap((r.gates + 1) / 16), toGate = wrap(gate - r.prevFraction);
    if ((Math.abs(info.distance) < WORLD.halfRoad + 24 || pitRoad(r, info)) && delta > 0 && delta < .03 && toGate > 0 && toGate <= delta + .00000001)
        r.gates++;
    r.prevFraction = f;
    // Signed sector distance stays continuous at walls and when backing over a gate.
    const sectorStart = wrap(r.gates / 16);
    let part = f - sectorStart;
    if (part > .5)
        part--;
    if (part < -.5)
        part++;
    r.p = r.gates >= RACE_LAPS * 16 ? RACE_LAPS : r.gates / 16 + clamp(part, -1 / 16, 1 / 16 - 1e-9);
    return info;
}
function stepDriver(r, input, dt, deferProgress = false) {
    if (r.recovery > 0) {
        r.recovery = Math.max(0, r.recovery - dt);
        r.speed = 0;
        return;
    }
    if (stepPit(r, dt))
        return;
    const info = trackInfo(r.x, r.y, r.track);
    r.offroad = Math.abs(info.distance) > WORLD.halfRoad && !pitRoad(r, info);
    const desired = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    r.steer += (desired - r.steer) * (1 - Math.exp(-dt * (desired ? 7 : 5)));
    const c = Math.cos(r.angle), s = Math.sin(r.angle);
    let forward = r.vx * c + r.vy * s, lateral = -r.vx * s + r.vy * c;
    r.slip = Math.abs(lateral);
    const maxSpeed = r.inPitLane ? PIT.speed : r.offroad ? 85 : 330 * (.75 + .25 * (r.tires ?? 1)), accel = (input.throttle ? (r.offroad ? 45 : 112) : 0) - (input.brake ? 230 : 0) - 8 - Math.max(0, forward) * .055;
    forward = forward < 0 ? Math.min(0, forward + ((input.throttle ? 112 : 0) + 45) * dt) : clamp(forward + accel * dt, 0, 330);
    if (forward > maxSpeed)
        forward = Math.max(maxSpeed, forward - 145 * dt);
    const wheelAngle = r.steer * .48 / (1 + forward / 120);
    const grip = (r.offroad ? 60 : 165) * tireGrip(r);
    const targetYaw = clamp(forward / 48 * Math.tan(wheelAngle), -grip / Math.max(60, forward), grip / Math.max(60, forward));
    r.yaw += (targetYaw - r.yaw) * (1 - Math.exp(-dt * 7));
    if (forward < .5)
        r.yaw = 0;
    r.impactYaw = (r.impactYaw || 0) * Math.exp(-dt * 2.2);
    r.contactTime = Math.max(0, (r.contactTime || 0) - dt);
    r.angle += (r.yaw + r.impactYaw) * dt;
    lateral *= Math.exp(-(r.offroad ? 2.4 : r.contactTime > 0 ? 3 : 8.5 * tireGrip(r)) * dt);
    // Velocity retains the previous heading: the chassis turns before the tires recover grip.
    r.vx = c * forward - s * lateral;
    r.vy = s * forward + c * lateral;
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    containCar(r);
    wearTires(r, input, dt);
    if ((Math.abs(lateral) > 13 || input.brake && r.speed > 80) && r.skids.length < 350) {
        r.skids.push({ x: r.x, y: r.y, a: r.angle, life: 5 });
    }
    if (!deferProgress) {
        updateProgress(r);
        monitorStuck(r, dt);
    }
}
const CAR_BODY = { halfLength: 32, halfWidth: 15, inertia: (64 * 64 + 30 * 30) / 12 };
function carAxes(b) { return [{ x: Math.cos(b.angle), y: Math.sin(b.angle) }, { x: -Math.sin(b.angle), y: Math.cos(b.angle) }]; }
function bodyRadius(b, n) { const axes = carAxes(b); return CAR_BODY.halfLength * Math.abs(axes[0].x * n.x + axes[0].y * n.y) + CAR_BODY.halfWidth * Math.abs(axes[1].x * n.x + axes[1].y * n.y); }
function collisionContact(a, b) {
    if (Math.hypot(b.x - a.x, b.y - a.y) > 72)
        return null;
    let penetration = Infinity, normal;
    for (const axis of [...carAxes(a), ...carAxes(b)]) {
        const d = (b.x - a.x) * axis.x + (b.y - a.y) * axis.y, overlap = bodyRadius(a, axis) + bodyRadius(b, axis) - Math.abs(d);
        if (overlap <= 0)
            return null;
        if (overlap < penetration) {
            penetration = overlap;
            normal = { x: axis.x * (d < 0 ? -1 : 1), y: axis.y * (d < 0 ? -1 : 1) };
        }
    }
    const n = normal, t = { x: -n.y, y: n.x }, an = a.x * n.x + a.y * n.y, bn = b.x * n.x + b.y * n.y, at = a.x * t.x + a.y * t.y, bt = b.x * t.x + b.y * t.y;
    const plane = (an + bodyRadius(a, n) + bn - bodyRadius(b, n)) / 2;
    const tangent = (Math.max(at - bodyRadius(a, t), bt - bodyRadius(b, t)) + Math.min(at + bodyRadius(a, t), bt + bodyRadius(b, t))) / 2;
    return { n, penetration, x: n.x * plane + t.x * tangent, y: n.y * plane + t.y * tangent };
}
function resolveCarCollision(a, b) {
    if (a.recovery > 0 || b.recovery > 0 || a.pitService > 0 || b.pitService > 0)
        return false;
    const contact = collisionContact(a, b);
    if (!contact)
        return false;
    const { n } = contact, ra = { x: contact.x - a.x, y: contact.y - a.y }, rb = { x: contact.x - b.x, y: contact.y - b.y };
    const invI = 1 / CAR_BODY.inertia, cross = (r, v) => r.x * v.y - r.y * v.x;
    const wa = (a.yaw || 0) + (a.impactYaw || 0), wb = (b.yaw || 0) + (b.impactYaw || 0);
    const rv = { x: b.vx - wb * rb.y - a.vx + wa * ra.y, y: b.vy + wb * rb.x - a.vy - wa * ra.x };
    const approach = rv.x * n.x + rv.y * n.y;
    if (approach < 0) {
        const ca = cross(ra, n), cb = cross(rb, n), j = -(1 + (approach < -15 ? .12 : 0)) * approach / (2 + (ca * ca + cb * cb) * invI);
        const tangent = { x: -n.y, y: n.x }, ta = cross(ra, tangent), tb = cross(rb, tangent);
        const jt = clamp(-(rv.x * tangent.x + rv.y * tangent.y) / (2 + (ta * ta + tb * tb) * invI), -.22 * j, .22 * j);
        const impulse = { x: j * n.x + jt * tangent.x, y: j * n.y + jt * tangent.y };
        a.vx -= impulse.x;
        a.vy -= impulse.y;
        b.vx += impulse.x;
        b.vy += impulse.y;
        a.impactYaw = (a.impactYaw || 0) - cross(ra, impulse) * invI;
        b.impactYaw = (b.impactYaw || 0) + cross(rb, impulse) * invI;
        a.contactTime = b.contactTime = .35;
        if (approach < -8) {
            a.collisionPending = b.collisionPending = true;
        }
    }
    const correction = Math.max(0, contact.penetration - .15) * .42;
    a.x -= n.x * correction;
    a.y -= n.y * correction;
    b.x += n.x * correction;
    b.y += n.y * correction;
    a.speed = Math.hypot(a.vx, a.vy);
    b.speed = Math.hypot(b.vx, b.vy);
    return true;
}
function containCar(r) {
    const q = trackInfo(r.x, r.y, r.track), extent = bodyRadius(r, { x: q.nx, y: q.ny }), limit = WORLD.halfRoad + 24 - extent, offset = pitOffset(q.fraction, r.track);
    let low = -limit, high = limit;
    if (offset !== null && (r.inPitLane || pitGate(q.fraction, r.track))) {
        const pitLow = offset - PIT.halfWidth + extent, pitHigh = offset + PIT.halfWidth - extent;
        if (r.inPitLane && pitHigh < low) {
            low = pitLow;
            high = pitHigh;
        }
        else
            low = Math.min(low, pitLow);
        if (q.distance < -145)
            r.inPitLane = true;
        if (r.inPitLane && pitPhase(q.fraction, r.track) > .20 && q.distance >= -125) {
            r.inPitLane = false;
            r.pitVisitServiced = false;
        }
    }
    else if (r.inPitLane) {
        r.inPitLane = false;
        r.pitVisitServiced = false;
    }
    const bounded = clamp(q.distance, low, high), penetration = q.distance - bounded;
    if (Math.abs(penetration) > .0001) {
        const side = penetration < 0 ? -1 : 1, nx = q.nx * side, ny = q.ny * side;
        r.x -= q.nx * penetration;
        r.y -= q.ny * penetration;
        const normal = r.vx * nx + r.vy * ny;
        if (normal > 0) {
            r.vx -= 1.1 * normal * nx;
            r.vy -= 1.1 * normal * ny;
            if (normal > 8)
                r.collisionPending = true;
        }
    }
    r.x = clamp(r.x, 34, WORLD.width - 34);
    r.y = clamp(r.y, 34, WORLD.height - 34);
    r.speed = Math.hypot(r.vx, r.vy);
}
function botInput(b) {
    if ((b.tires ?? 1) < .35 && !b.finishPlace)
        b.pitRequested = true;
    const info = trackInfo(b.x, b.y, b.track), approaching = b.inPitLane || b.pitRequested && (pitPhase(info.fraction, b.track) < PIT.span || pitPhase(info.fraction, b.track) > .95);
    const lookahead = 55 + b.speed * .24, targetFraction = info.fraction + lookahead / trackMesh(b.track).total, target = position(targetFraction, approaching ? (pitOffset(wrap(targetFraction), b.track) ?? -85) : b.lane, b.track);
    if (!b.pitVisitServiced && inPitZone(b) && pitPhase(info.fraction, b.track) >= .14 + ((b.n || 12) - 12) * .002)
        return { brake: true };
    let error = Math.atan2(target.y - b.y, target.x - b.x) - b.angle;
    error = Math.atan2(Math.sin(error), Math.cos(error));
    const steering = clamp(Math.atan(96 * Math.sin(error) / Math.max(30, Math.hypot(target.x - b.x, target.y - b.y))) / (.48 / (1 + b.speed / 120)), -1, 1);
    const targetSpeed = approaching ? 65 : b.cruise * (Math.abs(error) > .65 ? .55 : 1);
    return { throttle: b.speed < targetSpeed, brake: b.speed > targetSpeed + 10, left: b.steer > steering + .025, right: b.steer < steering - .025 };
}
function stepRacePhysics(r, input, dt) {
    stepDriver(r, input, dt, true);
    for (const b of r.bots)
        stepDriver(b, botInput(b), dt, true);
    const bodies = [r, ...r.bots];
    for (let pass = 0; pass < 4; pass++) {
        const touched = new Set();
        for (let i = 0; i < bodies.length; i++)
            for (let j = i + 1; j < bodies.length; j++)
                if (resolveCarCollision(bodies[i], bodies[j])) {
                    touched.add(bodies[i]);
                    touched.add(bodies[j]);
                }
        for (const b of touched)
            containCar(b);
        if (!touched.size)
            break;
    }
    for (const b of bodies) {
        updateProgress(b);
        monitorStuck(b, dt);
        if (b.gates >= RACE_LAPS * 16 && !b.finishPlace) {
            r.finishCounter = (r.finishCounter || 0) + 1;
            b.finishPlace = r.finishCounter;
        }
        if (b !== r)
            b.skids = [];
    }
}
function monitorStuck(b, dt) {
    if (b.done || b.recovery > 0 || b.pitService > 0) {
        b.stuckSeconds = 0;
        b.stuckAnchor = null;
        return;
    }
    if (!b.collisionPending)
        return;
    if (!b.stuckAnchor)
        b.stuckAnchor = { x: b.x, y: b.y };
    const moved = Math.hypot(b.x - b.stuckAnchor.x, b.y - b.stuckAnchor.y);
    if (moved > 18) {
        b.stuckSeconds = 0;
        b.stuckAnchor = null;
        b.collisionPending = false;
        return;
    }
    b.freeSeconds = 0;
    b.stuckSeconds = (b.stuckSeconds || 0) + dt;
    if (b.stuckSeconds >= 5 - 1e-8) {
        recoverDriver(b);
        if (b === race)
            toast('Carro preso após a batida: retorno automático à pista.');
    }
}
function racePosition(r) {
    if (r.finishPlace)
        return r.finishPlace;
    const opponents = r.online ? r.remotes : r.bots, epsilon = 2 / trackMesh(r.track).total;
    r.aheadCars = r.aheadCars || new Set();
    for (const b of opponents) {
        const id = r.online ? b.user : b.n, p = r.online ? b.progress : b.p;
        if (b.finishPlace || p - r.p > epsilon)
            r.aheadCars.add(id);
        else if (r.p - p > epsilon)
            r.aheadCars.delete(id);
    }
    return 1 + opponents.filter(b => r.aheadCars.has(r.online ? b.user : b.n)).length;
}
function recoverDriver(r) {
    if (r.done || r.recovery > 0 || performance.now() < r.start)
        return;
    const safe = position(r.gates / 16, 0, r.track);
    Object.assign(r, safe, { vx: 0, vy: 0, speed: 0, steer: 0, yaw: 0, impactYaw: 0, contactTime: 0, pitService: 0, pitRequested: false, inPitLane: false, pitVisitServiced: false, recovery: 3, prevFraction: wrap(r.gates / 16), p: r.gates / 16, wrongWay: false, collisionPending: false, stuckSeconds: 0, stuckAnchor: null, freeSeconds: 0 });
}
