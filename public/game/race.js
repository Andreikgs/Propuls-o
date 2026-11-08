'use strict';
function startRace(online = false) {
    if (race && race.active)
        return;
    raceAudio.unlock();
    keys = {};
    const track = online ? championshipTrack(room.cup.round) : selectedTrack;
    race = { ...createDriver(track), active: true, driverId:profile.driverId, online, elapsed: 0, paused: false, done: false, start: online ? performance.now() + room.cup.start - room.now : performance.now() + 3500, remotes: [], bots: [], last: performance.now(), sent: 0, pending: false, round: online ? room.cup.round : 0 };
    if (!online) {
        const level = $('#difficulty').value;
        for (let i = 0; i < GRID_SIZE - 1; i++) {
            const p = -(i + 1) * 100 / trackMesh(track).total, lane = (i % 3 - 1) * 65;
            race.bots.push({ ...createDriver(track), ...position(p, lane, track), p, gates: Math.floor(p * 16), prevFraction: wrap(p), lane, cruise: (level === 'easy' ? 155 : level === 'hard' ? 246 : 205) + (i % 7) * 2, color: ['#F5F3ED', '#C0C3CF', '#FEFEFE', '#000000', '#F04718', '#273848', '#C0C3CF'][i % 7], n: i + 12 });
        }
    }
    buildWorld(track);
    $('#raceScreen').classList.remove('hidden');
    $('#pauseBtn').classList.toggle('hidden', online);
    $('#networkStatus').textContent = online ? 'ONLINE · CONECTANDO' : 'DIREÇÃO MANUAL · R PARA REPOSICIONAR';
    $('#overlay').classList.remove('hidden');
    requestAnimationFrame(frame);
}
$('#startOffline').onclick = () => chooseDriver('race');
function togglePause() { if (!race || race.online || race.done || race.exitPrompt || performance.now() < race.start)
    return; race.paused = !race.paused; keys = {}; if (race.paused)
    raceAudio.silence();
else
    raceAudio.unlock(); if (race.paused) {
    $('#overlay').innerHTML = '<div class="panel"><div class="eyebrow">PIT STOP</div><h2>Corrida pausada</h2><p class="muted">Respire. O grid espera por você.</p><button class="primary" id="resume">Voltar para a pista →</button></div>';
    $('#overlay').classList.remove('hidden');
    $('#resume').onclick = togglePause;
}
else
    $('#overlay').classList.add('hidden'); }
$('#pitBtn').onclick = togglePit;
$('#pauseBtn').onclick = togglePause;
$('#recoverBtn').onclick = () => { if (race)
    recoverDriver(race); };
function leaveRace() { raceAudio.silence(); if (race)
    race.active = false; race = null; keys = {}; $('#raceScreen').classList.add('hidden'); if (room && view === 'room')
    pollRoom(); refreshStats(); }
$('#exitRace').onclick = () => { if (race && !race.done) {
    if (race.exitPrompt)
        return;
    race.exitPrompt = true;
    keys = {};
    race.paused = !race.online;
    if (race.paused)
        raceAudio.silence();
    $('#overlay').classList.remove('hidden');
    $('#overlay').innerHTML = '<div class="panel"><h2>Abandonar corrida?</h2><p class="muted">' + (race.online ? 'A etapa continua para os outros pilotos. Você ficará sem pontos.' : 'Seu progresso nesta corrida será perdido.') + '</p><div class="inline-actions"><button id="keepRace" class="primary">Continuar</button><button id="leaveNow">Abandonar</button></div></div>';
    $('#keepRace').onclick = () => { race.exitPrompt = false; race.paused = false; raceAudio.unlock(); $('#overlay').classList.add('hidden'); };
    $('#leaveNow').onclick = leaveRace;
}
else
    leaveRace(); };
window.addEventListener('keydown', e => { if (!race)
    return; if (e.key === 'Escape') {
    e.preventDefault();
    if (!e.repeat && !race.done)
        $('#exitRace').onclick();
    return;
} if (race.exitPrompt)
    return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key))
    e.preventDefault(); keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'p' && !e.repeat)
    togglePause(); if (e.key.toLowerCase() === 'r' && !e.repeat)
    recoverDriver(race); if (e.key.toLowerCase() === 'b' && !e.repeat)
    togglePit(); });
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('blur', () => { keys = {}; if (race && !race.online && !race.paused && !race.done)
    togglePause(); });
$$('[data-key]').forEach(b => { b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); keys[b.dataset.key.toLowerCase()] = true; }; b.onpointerup = b.onpointercancel = () => keys[b.dataset.key.toLowerCase()] = false; });
async function sendState(force = false) { const r = race; if (!r || !r.online || !room || performance.now() < r.start)
    return; if (r.pending) {
    if (force)
        r.retry = true;
    return;
} r.pending = true; try {
    const pos = { x: r.x, y: r.y, angle: r.angle };
    await action({ action: 'state', cup: room.cup.id, round: r.round, ...pos, progress: Math.min(RACE_LAPS, r.p) });
    if (force) {
        toast('Resultado registrado no campeonato.');
        const back = $('#finishBack');
        if (back) {
            back.disabled = false;
            back.textContent = 'Ver classificação →';
        }
    }
}
catch (e) {
    $('#networkStatus').textContent = 'FALHA DE SINCRONIZAÇÃO';
    if (force) {
        toast('Resultado ainda não confirmado. Tentando novamente…');
        r.retry = true;
    }
}
finally {
    r.pending = false;
} }
function finish() {
    raceAudio.silence();
    const r = race;
    r.done = true;
    r.speed = 0;
    keys = {};
    const place = r.online ? null : racePosition(r);
    if (!r.online) {
        stats.count++;
        if (!stats.best || r.elapsed < stats.best)
            stats.best = r.elapsed;
        save();
    }
    else {
        sendState(true);
    }
    $('#overlay').classList.remove('hidden');
    $('#overlay').innerHTML = '<div class="panel"><div class="eyebrow">BANDEIRA QUADRICULADA</div><h2>' + (r.online ? 'Etapa concluída!' : place === 1 ? 'O topo é seu.' : place + 'º lugar no grid.') + '</h2><p class="muted">Tempo total <b class="win">' + fmt(r.elapsed) + '</b></p><p class="note">' + (r.online ? 'Os pontos serão atualizados após a chegada dos outros pilotos.' : 'Cada volta é uma nova chance de ir além.') + '</p><button class="primary" id="finishBack">' + (r.online ? 'Ver classificação →' : 'Voltar ao paddock →') + '</button></div>';
    $('#finishBack').onclick = leaveRace;
    if (r.online) {
        $('#finishBack').disabled = true;
        $('#finishBack').textContent = 'Registrando resultado…';
    }
}
function frame(now) {
    const r = race;
    if (!r || !r.active)
        return;
    const dt = Math.min(Math.max(0, (now - r.last) / 1000), .05);
    r.last = now;
    const remaining = (r.start - now) / 1000;
    if (remaining > 0) {
        if (!r.exitPrompt)
            $('#overlay').innerHTML = '<div><div class="eyebrow">DIREÇÃO MANUAL · FAÇA AS CURVAS</div><h2 style="font-size:100px;margin:20px;color:var(--accent)">' + Math.ceil(remaining) + '</h2><p>↑ / W acelerar · ← → / A D virar · ↓ / S frear</p></div>';
    }
    else if (!r.done && !r.paused) {
        if (!$('#leaveNow'))
            $('#overlay').classList.add('hidden');
        r.elapsed += dt * 1000;
        const input = { throttle: keys.arrowup || keys.w, brake: keys.arrowdown || keys.s, left: keys.arrowleft || keys.a, right: keys.arrowright || keys.d };
        // Fixed-sized substeps keep steering and collision response stable at lower frame rates.
        const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
        for (let i = 0; i < steps; i++) {
            if (r.online)
                stepDriver(r, input, dt / steps);
            else
                stepRacePhysics(r, input, dt / steps);
        }
        for (const s of r.skids)
            s.life -= dt;
        r.skids = r.skids.filter(s => s.life > 0);
        if (r.online && now - r.sent > 350) {
            r.sent = now;
            sendState();
        }
        if (r.p >= RACE_LAPS)
            finish();
        if (r.online && now - r.start > RACE_TIMEOUT && !r.done) {
            r.done = true;
            $('#overlay').classList.remove('hidden');
            $('#overlay').innerHTML = '<div class="panel"><h2>Tempo encerrado</h2><p class="muted">A etapa terminou. Esta corrida não pontuou.</p><button id="timeoutBack" class="primary">Ver classificação</button></div>';
            $('#timeoutBack').onclick = leaveRace;
        }
    }
    if (r.retry && !r.pending && now - r.sent > 1500) {
        r.sent = now;
        r.retry = false;
        sendState(true);
    }
    raceAudio.update(r, { throttle: keys.arrowup || keys.w, brake: keys.arrowdown || keys.s });
    renderRace(r);
    const tirePercent = Math.ceil((r.tires ?? 1) * 100);
    $('#hudTires').textContent = tirePercent + '%';
    $('#hudTires').style.color = tirePercent <= 35 ? '#F04718' : '#F5F3ED';
    $('#pitBtn').textContent = r.pitService > 0 ? 'Troca · ' + r.pitService.toFixed(1) + 's' : r.pitRequested ? 'B · Cancelar boxes' : 'B · Boxes';
    $('#pitBtn').setAttribute('aria-pressed', String(!!r.pitRequested));
    $('#pitBtn').disabled = r.pitService > 0 || r.done;
    if (!r.done && tirePercent <= 35 && (r.tireWarning || 0) < 1) {
        r.tireWarning = 1;
        toast('Pneus gastos: aderência reduzida. Pressione B para solicitar boxes.');
    }
    const place = racePosition(r);
    $('#hudPos').textContent = place + ' / ' + (r.online ? (room?.players.length || 1) : GRID_SIZE);
    $('#hudLap').textContent = Math.min(RACE_LAPS, Math.floor(r.p) + 1) + ' / ' + RACE_LAPS;
    $('#hudSpeed').textContent = Math.round(r.speed * 1.05);
    $('#hudTime').textContent = fmt(r.elapsed);
    requestAnimationFrame(frame);
}
