'use strict';
function drawTrackCards() { $$('[data-track]').forEach(button => { const track = +button.dataset.track; let points = ''; for (let i = 0; i <= 200; i++) {
    const p = position(i / 200, 0, track);
    points += (p.x / 45) + ',' + (p.y / 45) + ' ';
} const s = position(0, 0, track); button.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 240 144" width="100%" height="95" aria-hidden="true"><polyline points="' + points + '" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><circle cx="' + s.x / 45 + '" cy="' + s.y / 45 + '" r="4" fill="#F04718"/></svg>'); }); }
drawTrackCards();
refreshStats();
drawHero();
drawGarage();
refreshAccount();
if (location.protocol === 'file:') {
    $('#downloadOffline').classList.add('hidden');
    $('#onlineGuest').innerHTML = '<h2>Você está na versão offline.</h2><p class="muted">Para campeonatos e login, abra a versão online do Propulsão.</p><a class="primary" style="display:inline-block;padding:13px;border-radius:6px" href="https://oval-rush-racing-andre.drupaman.chatgpt.site" target="_blank" rel="noopener">Abrir versão online ↗</a>';
}
