'use strict';
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
function syncThemeButton() { const dark = $('html').dataset.theme === 'dark'; $('#themeToggle').textContent = dark ? '☾ Escuro' : '☀ Claro'; $('#themeToggle').setAttribute('aria-pressed', String(dark)); $('#themeToggle').title = dark ? 'Ativar modo claro' : 'Ativar modo escuro'; }
$('#themeToggle').onclick = () => { const theme = $('html').dataset.theme === 'dark' ? 'light' : 'dark'; $('html').dataset.theme = theme; try {
    localStorage.setItem('propulsao-theme', theme);
}
catch { } $('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#000000' : '#F5F3ED'); syncThemeButton(); };
syncThemeButton();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let profile = { name: 'Piloto', color: '#F04718' }, stats = { count: 0, best: 0 };
try {
    profile = { ...profile, ...JSON.parse(localStorage.getItem('oval-profile') || '{}') };
    stats = { ...stats, ...JSON.parse(localStorage.getItem('oval-stats-v2') || '{}') };
}
catch { }
if (stats.laps !== 10) {
    stats.best = 0;
    stats.laps = 10;
}
if (profile.color === '#dcff38')
    profile.color = '#F04718';
let user = null, cups = [], room = null, selectedTrack = 0, view = 'home', race = null, keys = {}, polling = false, lastSeenRound = 0;
function save() { try {
    localStorage.setItem('oval-profile', JSON.stringify(profile));
    localStorage.setItem('oval-stats-v2', JSON.stringify(stats));
}
catch { } }
function toast(text) { $('#toast').textContent = text; $('#toast').classList.remove('hidden'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.add('hidden'), 4500); }
const fmt = ms => { const s = Math.max(0, ms) / 1000; return String(Math.floor(s / 60)).padStart(2, '0') + ':' + (s % 60).toFixed(2).padStart(5, '0'); };
function refreshStats() { $('#bestTime').textContent = stats.best ? fmt(stats.best) : '—'; $('#raceCount').textContent = String(stats.count).padStart(2, '0'); }
function page(id) { view = id; $$('.view').forEach(e => e.classList.toggle('hidden', e.id !== id)); $$('.nav button').forEach(e => e.classList.toggle('active', e.dataset.page === id)); $('#breadcrumb').textContent = '/  ' + ({ home: 'Central de corridas', offline: 'Single player', online: 'Campeonatos', room: 'Paddock', garage: 'Minha garagem', login: 'Login', credits: 'Créditos de áudio' }[id]); if (id === 'online')
    refreshAccount(); if (id === 'garage')
    drawGarage(); window.scrollTo(0, 0); }
$$('[data-page]').forEach(b => b.onclick = () => page(b.dataset.page));
$('.logo').onclick = e => { e.preventDefault(); page('home'); };
$('#heroPlay').onclick = () => page('offline');
$('#loginBtn').onclick = () => user ? window.top.location.assign('/signout-with-chatgpt?return_to=%2F') : page('login');
async function api(body, id) { const res = await fetch('/api/race' + (id ? '?cup=' + encodeURIComponent(id) : ''), body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' }); let d; try {
    d = await res.json();
}
catch {
    throw Error('Servidor online indisponível. Você pode jogar offline.');
} if (!res.ok || d.error)
    throw Error(d.error || 'Falha ao conectar.'); return d; }
async function refreshAccount() { if (location.protocol === 'file:')
    return; try {
    const d = await api();
    user = d.user;
    cups = d.cups || [];
    $('#onlineGuest').classList.toggle('hidden', !!user);
    $('#onlineMember').classList.toggle('hidden', !user);
    $('#profileName').textContent = user ? user.name : 'Piloto visitante';
    $('#loginBtn').textContent = user ? 'Sair ↗' : 'Entrar ↗';
    $('#cupList').innerHTML = cups.length ? cups.map(c => '<div class="cup-card"><div><strong>' + esc(c.name) + '</strong><span class="note">' + esc(c.id) + ' · ' + c.round + ' / ' + c.rounds + ' etapas</span></div><button class="small" data-cup="' + esc(c.id) + '">Abrir paddock →</button></div>').join('') : '<div class="empty">Seu grid começa aqui.<br>Crie um campeonato ou entre com um convite.</div>';
    $$('[data-cup]').forEach(b => b.onclick = () => openRoom(b.dataset.cup));
}
catch (e) {
    if (view === 'online')
        toast(e.message);
} }
async function action(body) { return api({ ...body, name: profile.name, color: profile.color }); }
$('#createForm').onsubmit = async (e) => { e.preventDefault(); const b = e.submitter; b.disabled = true; try {
    const d = await action({ action: 'create', title: $('#cupName').value, rounds: +$('#rounds').value });
    await openRoom(d.id);
}
catch (e) {
    toast(e.message);
}
finally {
    b.disabled = false;
} };
$('#joinForm').onsubmit = async (e) => { e.preventDefault(); const b = e.submitter; b.disabled = true; try {
    const d = await action({ action: 'join', cup: $('#invite').value.trim().toUpperCase() });
    await openRoom(d.id);
}
catch (e) {
    toast(e.message);
}
finally {
    b.disabled = false;
} };
async function openRoom(id) { try {
    room = await api(null, id);
    lastSeenRound = room.cup.round;
    if (room.cup.start > Date.now() && room.cup.round > 0)
        lastSeenRound--;
    renderRoom();
    page('room');
}
catch (e) {
    toast(e.message);
} }
function standings() { let scores = {}; room.players.forEach(p => scores[p.user] = { ...p, points: 0, wins: 0 }); for (let r = 1; r <= room.cup.round; r++) {
    room.results.filter(x => x.round === r).sort((a, b) => a.elapsed - b.elapsed).forEach((x, i) => { if (scores[x.user]) {
        scores[x.user].points += [25, 18, 15, 12, 10, 8, 6, 4][i] || 0;
        if (i === 0)
            scores[x.user].wins++;
    } });
} return Object.values(scores).sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name)); }
function renderRoom() { const c = room.cup; $('#roomTitle').textContent = c.name; $('#roomInfo').textContent = 'Etapa ' + c.round + ' de ' + c.rounds + ' · ' + TRACKS[championshipTrack(c.round)].name + ' · 10 voltas'; $('#roomCode').textContent = c.id; $('#playerCount').textContent = room.players.length + ' / 15 PILOTOS'; $('#startOnline').classList.toggle('hidden', !user || c.owner !== user.id); $('#startOnline').disabled = c.round >= c.rounds; $('#startOnline').textContent = c.round ? 'Próxima etapa →' : 'Iniciar etapa →'; $('#roomStatus').textContent = c.round >= c.rounds ? 'Última etapa. A classificação se atualiza conforme os pilotos terminam.' : c.round ? 'O organizador pode iniciar a próxima etapa após todos terminarem ou após 30 minutos.' : 'Compartilhe o código. O organizador inicia quando pelo menos dois pilotos entrarem.'; $('#ranking').innerHTML = standings().map((p, i) => { const r = room.results.find(x => x.round === c.round && x.user === p.user); return '<tr><td>' + String(i + 1).padStart(2, '0') + '</td><td><span style="color:' + esc(p.color) + '">■</span> ' + esc(p.name) + (user && p.user === user.id ? ' <span class="note">(você)</span>' : '') + '</td><td><b>' + p.points + '</b></td><td>' + p.wins + '</td><td>' + (r ? fmt(r.elapsed) : c.round ? 'Aguardando resultado' : 'No grid') + '</td></tr>'; }).join(''); }
$('#copyCode').onclick = async () => { try {
    await navigator.clipboard.writeText(room.cup.id);
    toast('Código copiado!');
}
catch {
    toast('Código: ' + room.cup.id);
} };
$('#startOnline').onclick = async () => { try {
    await action({ action: 'start', cup: room.cup.id });
    await pollRoom();
}
catch (e) {
    toast(e.message);
} };
async function pollRoom() { if (!room || polling || !(view === 'room' || race && race.online))
    return; polling = true; try {
    room = await api(null, room.cup.id);
    renderRoom();
    if (room.cup.round > lastSeenRound && room.cup.start) {
        lastSeenRound = room.cup.round;
        if (room.now < room.cup.start + 2000)
            startRace(true);
    }
    if (race && race.online) {
        race.remotes = room.players.filter(p => p.user !== user.id);
        $('#networkStatus').textContent = 'ONLINE · ' + room.players.length + ' PILOTOS';
    }
}
catch (e) {
    if (race && race.online)
        $('#networkStatus').textContent = 'RECONECTANDO…';
}
finally {
    polling = false;
} }
setInterval(pollRoom, 700);
$('#pilotName').value = profile.name;
$('#carColor').value = profile.color;
$('#garageForm').onsubmit = e => { e.preventDefault(); profile = { name: $('#pilotName').value.trim() || 'Piloto', color: $('#carColor').value }; save(); drawGarage(); toast('Seu carro está pronto para a pista.'); };
$('#carColor').oninput = drawGarage;
$$('[data-track]').forEach(b => b.onclick = () => { selectedTrack = +b.dataset.track; $$('[data-track]').forEach(x => x.classList.toggle('selected', x === b)); });
