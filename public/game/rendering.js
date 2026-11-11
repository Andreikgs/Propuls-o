'use strict';
const TAU = Math.PI * 2;
function car(ctx, x, y, a, color, n, scale = 1, steering = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.scale(scale, scale);
    const shape = (points, fill, stroke, width = .35) => { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
    } };
    const box = (x, y, w, h, fill, r = 0) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
    // Layered ground shadow and articulated racing slicks.
    box(-22, -10, 46, 23, '#00000016', 7);
    box(-20, -9, 43, 21, '#00000030', 5);
    for (const axle of [-12, 12])
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(axle, side * 9.4);
            if (axle > 0)
                ctx.rotate(steering);
            box(-4.7, -2, 9.4, 4, '#080a0c', 1.1);
            box(-3.6, -1.4, 7.2, .45, '#46505a', .2);
            box(-3.8, .9, 7.6, .3, '#22282d');
            box(-1.3, -.8, 2.6, 1.6, '#65717a', .3);
            ctx.restore();
        }
    // Sculpted silhouette: tapered nose, wide fenders and rear quarter panels.
    const body = [[-21, -7], [-19, -9], [-14, -10], [-8, -9.5], [7, -9.5], [12, -10], [18, -9], [21, -6.5], [21, 6.5], [18, 9], [12, 10], [7, 9.5], [-8, 9.5], [-14, 10], [-19, 9], [-21, 7]];
    shape(body, color, '#10151b', .65);
    shape([[-19, -8], [-13, -9.4], [13, -9.4], [19, -7.6], [17, -6.8], [-17, -7]], '#ffffff40');
    shape([[-19, 7], [-7, 8], [12, 7.6], [19, 6.8], [18, 9], [12, 10], [-14, 10], [-19, 9]], '#00000040');
    // Splitter, bumper, lamps and hood seams.
    shape([[19, -7], [22, -6.5], [22, 6.5], [19, 7], [20, 5], [20, -5]], '#10151b', '#68717b', .25);
    box(20.3, -3.8, .9, 7.6, '#06080a', .25);
    shape([[17, -7.9], [19.4, -6.2], [19.2, -3.5], [17.2, -4.3]], '#e9edf0', '#7d8e9a', .3);
    shape([[17, 7.9], [19.4, 6.2], [19.2, 3.5], [17.2, 4.3]], '#e9edf0', '#7d8e9a', .3);
    shape([[8, -6.4], [16, -6.5], [18, -3], [18, 3], [16, 6.5], [8, 6.4]], '#ffffff0b', '#00000040', .3);
    shape([[9, -2], [17, -1.5], [17, 1.5], [9, 2]], '#00000025');
    for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++)
            box(10 + i * 1.1, side < 0 ? -5.4 : 3.5, .5, 1.8, '#10151baa', .15);
        box(15, side * 5.5, .65, .65, '#c0c3cf', .2);
    }
    // Glazed cockpit, pillars, windshield reflection and rear glass.
    shape([[-11, -6.5], [-6, -7.5], [5, -7], [9, -5.5], [9, 5.5], [5, 7], [-6, 7.5], [-11, 6.5]], '#0d1720', '#00000088', .4);
    shape([[4.7, -5.9], [8, -4.9], [8, 4.9], [4.7, 5.9]], '#354f63');
    shape([[5.2, -5.4], [7.6, -4.5], [7.6, -1], [5.2, .5]], '#91afbf77');
    shape([[-10, -5.8], [-6.8, -6.4], [-6.8, 6.4], [-10, 5.8]], '#354f63');
    shape([[-9.5, -5], [-7.4, -5.5], [-7.4, -1], [-9.5, 0]], '#91afbf55');
    shape([[-5.8, -5.9], [3.9, -5.4], [3.9, 5.4], [-5.8, 5.9]], color, '#ffffff44', .35);
    shape([[-5.8, -5.9], [3.9, -5.4], [2.5, -4.7], [-5, -5]], '#ffffff35');
    for (const side of [-1, 1]) {
        box(-6, side < 0 ? -7.5 : 6.2, 10, 1.3, '#0b131b', .3);
        box(-2, side < 0 ? -7.5 : 6.2, .7, 1.3, color);
        box(4, side < 0 ? -10 : 8.7, 2.6, 1.3, color, .4);
        box(-7.5, side < 0 ? -9.1 : 8.4, 6, .45, '#ffffff77', .2);
    }
    // Deck, rear lamps, carbon spoiler with end plates.
    box(-18, -6.5, 6, 13, '#00000012', 1);
    box(-20, -7, 1.2, 4.1, '#be2525', .35);
    box(-20, 2.9, 1.2, 4.1, '#be2525', .35);
    box(-19, -8.5, 1, 17, '#00000066', .2);
    box(-20.5, -10, 2.2, 20, '#151b21', .5);
    box(-20.2, -9.4, .45, 18.8, '#77818b');
    box(-21, -10.4, 3.2, .7, '#0a0e12', .2);
    box(-21, 9.7, 3.2, .7, '#0a0e12', .2);
    // Number reads across the roof, with an outline for every custom paint color.
    ctx.save();
    ctx.translate(-1, 0);
    ctx.rotate(Math.PI / 2);
    ctx.font = 'italic 900 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#0b1118';
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.strokeText(String(n), 0, 0);
    ctx.fillStyle = '#fefefe';
    ctx.fillText(String(n), 0, 0);
    ctx.restore();
    ctx.restore();
}
function previewPosition(p, lane, track = 0) { const q = position(p, lane * 9, track); return { x: q.x / 9, y: q.y / 9, angle: q.angle }; }
function circuit(g, track = 0) { g.drawImage(buildWorld(track), 0, 0, 1200, 720); }
function drawHero() {
 const g=$('#heroCanvas').getContext('2d');g.clearRect(0,0,1200,800);
 g.save();g.translate(690,390);g.rotate(-.48);
 g.strokeStyle='#C0C3CF25';g.lineWidth=2;g.strokeRect(-390,-190,780,380);
 g.strokeStyle='#F5F3ED66';g.lineWidth=5;
 for(const side of [-1,1]){g.beginPath();g.moveTo(side*365,-150);g.lineTo(side*365,-185);g.lineTo(side*315,-185);g.stroke();g.beginPath();g.moveTo(side*365,150);g.lineTo(side*365,185);g.lineTo(side*315,185);g.stroke();}
 drawDriverCar(g,0,0,0,profile.driverId,13);g.restore();
}
let mapCache = null, mapTrack = -1;
function buildWorld(track) {
 if(mapCache&&mapTrack===track)return mapCache;
 if(mapCache)mapCache.width=mapCache.height=0;
 const canvas=document.createElement('canvas'),scale=1280/WORLD.width;canvas.width=1280;canvas.height=Math.round(WORLD.height*scale);
 const g=canvas.getContext('2d');g.scale(scale,scale);paintWorld(g,track);mapCache=canvas;mapTrack=track;return canvas;
}
function paintWorld(g,track,bounds=null){
    const path = (lane) => { g.beginPath(); for (let i = 0; i <= 900; i++) {
        const p = position(i / 900, lane, track);
        if (i)
            g.lineTo(p.x, p.y);
        else
            g.moveTo(p.x, p.y);
    } g.closePath(); };
    const band = (lane, width, color) => { path(lane); g.strokeStyle = color; g.lineWidth = width; g.stroke(); };
    const visible=(x,y,r=0)=>!bounds||(x+r>=bounds.x&&y+r>=bounds.y&&x-r<=bounds.x+bounds.width&&y-r<=bounds.y+bounds.height);
    g.fillStyle=surfacePattern(g,'grass',track);g.fillRect(bounds?bounds.x:0,bounds?bounds.y:0,bounds?bounds.width:WORLD.width,bounds?bounds.height:WORLD.height);
    band(710,100,'#323e3c');band(710,2,'#d7d5b180');
    drawScenery(g,track,visible);
    // Service verge, concrete safety walls, apron and orange/white rumble strips.
    band(0, 440, '#27384822');
    band(0, 420, '#a5aaa5');
    band(0, 374, '#bfc3bd');
    band(0, 334, '#273848');
    band(0, 322, '#f5f3ed');
    band(0, 306, '#7c8689');
    band(0, 278, '#fefefe');
    g.setLineDash([28, 28]);
    band(0, 278, '#F04718');
    g.setLineDash([]);
    band(0, 256, surfacePattern(g,'asphalt',track));
    // Pit pavement uses the same material and track-normal cross section as collision geometry.
    g.beginPath();
    for (const side of [-1, 1])
        for (let j = 0; j <= 600; j++) {
            const i = side === -1 ? j : 600 - j, f = pitFraction(PIT.span * i / 600, track);
            const p = position(f, pitOffset(f, track) + side * PIT.halfWidth, track);
            if (side === -1 && j === 0)
                g.moveTo(p.x, p.y);
            else
                g.lineTo(p.x, p.y);
        }
    g.closePath();
    g.fillStyle = surfacePattern(g,'asphalt',track);
    g.fill();
    // Asphalt aggregate and darker rubbered-in racing groove.
    g.save();
    path(128);
    path(0);
    g.lineWidth = 252;
    g.strokeStyle = '#ffffff05';
    g.stroke();
    for (let lane = -110; lane <= 110; lane += 22) {
        band(lane, 1, '#00000012');
    }
    band(-22, 31, '#00000016');
    band(-22, 15, '#0000000d');
    // The inner white line stops at the open junction, rather than running under pit traffic.
    g.beginPath();
    let edgeConnected = false;
    for (let i = 0; i <= 1800; i++) {
        const f = i / 1800, o = pitOffset(f, track), open = o !== null && Math.abs(o + 118) < PIT.halfWidth + 4;
        if (open) {
            edgeConnected = false;
            continue;
        }
        const p = position(f, -118, track);
        if (edgeConnected)
            g.lineTo(p.x, p.y);
        else
            g.moveTo(p.x, p.y);
        edgeConnected = true;
    }
    g.lineWidth = 2;
    g.strokeStyle = '#f5f3edcc';
    g.stroke();
    band(118, 2, '#f5f3edcc');
    g.setLineDash([22, 38]);
    for (const lane of [-65, 65])
        band(lane, 1.3, '#c0c3cf55');
    g.setLineDash([]);
    g.restore();
    // Only exposed pit edges are painted: neither border crosses the racing surface.
    const pitEdge = (shift, color, width) => {
        g.beginPath();
        let connected = false;
        for (let i = 0; i <= 600; i++) {
            const f = pitFraction(PIT.span * i / 600, track), lane = pitOffset(f, track) + shift;
            if (lane >= -WORLD.halfRoad - 3) {
                connected = false;
                continue;
            }
            const p = position(f, lane, track);
            if (connected)
                g.lineTo(p.x, p.y);
            else
                g.moveTo(p.x, p.y);
            connected = true;
        }
        g.strokeStyle = color;
        g.lineWidth = width;
        g.stroke();
    };
    pitEdge(-PIT.halfWidth, '#F5F3ED', 3);
    pitEdge(PIT.halfWidth, '#F5F3ED', 3);
    // Dashed guidance joins the track tangentially; it never forms an end cap.
    g.beginPath();
    for (let i = 0; i <= 500; i++) {
        const p = pitPosition(.012 + (PIT.span - .024) * i / 500, track);
        if (i)
            g.lineTo(p.x, p.y);
        else
            g.moveTo(p.x, p.y);
    }
    g.lineWidth = 2;
    g.strokeStyle = '#F5F3ED88';
    g.setLineDash([18, 24]);
    g.stroke();
    g.setLineDash([]);
    // A continuous garage apron backs the straight service lane.
    const first = pitPosition(.10, track), last = pitPosition(.20, track);
    g.fillStyle = '#89908e';
    g.fillRect(first.x - 60, first.y - 235, last.x - first.x + 120, 180);
    g.fillStyle = '#59636a';
    g.fillRect(first.x - 60, first.y - 235, last.x - first.x + 120, 65);
    for (let i = 0; i < 15; i++) {
        const p = { x: first.x + 40 + i * (last.x - first.x - 80) / 14, y: first.y };
        g.fillStyle = '#F0471828';
        g.fillRect(p.x - 31, p.y - 24, 62, 48);
        g.strokeStyle = '#F5F3ED';
        g.lineWidth = 2;
        g.strokeRect(p.x - 31, p.y - 24, 62, 48);
        g.fillStyle = '#F04718';
        g.fillRect(p.x - 31, p.y - 55, 62, 4);
        g.fillStyle = '#00000025';
        g.fillRect(p.x - 28, p.y - 154, 64, 85);
        g.fillStyle = i % 3 ? '#273848' : '#F04718';
        g.fillRect(p.x - 32, p.y - 164, 64, 85);
        g.fillStyle = '#C0C3CF';
        g.fillRect(p.x - 27, p.y - 88, 54, 9);
        g.fillStyle = '#F5F3ED';
        g.font = 'bold 12px Arial';
        g.textAlign = 'center';
        g.fillText(String(i + 1).padStart(2, '0'), p.x, p.y - 115);
    }
    drawPaddockDetails(g,track,visible);
    for (const [u, label] of [[0, 'PIT IN →'], [.28, 'PIT OUT →']]) {
        const p = position(pitFraction(u, track), -242, track);
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.angle);
        g.fillStyle = '#F04718';
        g.fillRect(-48, -18, 96, 36);
        g.fillStyle = '#000';
        g.font = 'bold 12px Arial';
        g.textAlign = 'center';
        g.fillText(label, 0, 4);
        g.restore();
    }
    // Catch fencing outside the wall, with regular posts.
    band(181, 1, '#27384866');
    band(191, 1, '#27384866');
    for (let i = 0; i < 1800; i++) {
        const p = position(i / 1800, 187, track);
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.angle);
        g.fillStyle = '#27384866';
        g.fillRect(-1, -9, 2, 18);
        g.fillStyle = '#00000020';
        g.fillRect(1, 0, 9, 2);
        g.restore();
    }
    const start = position(0, 0, track);
    g.save();
    g.translate(start.x, start.y);
    g.rotate(start.angle);
    for (let y = -128; y < 128; y += 16)
        for (let x = -16; x < 16; x += 16) {
            g.fillStyle = ((y + 128) / 16 + (x + 16) / 16) % 2 ? '#fefefe' : '#10161b';
            g.fillRect(x, y, 16, 16);
        }
    g.restore();
    for (let i = 0; i < 16; i++) {
        const p = position(-100 * (i + 1) / trackMesh(track).total, (i % 2 ? 1 : -1) * 52, track);
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.angle);
        g.strokeStyle = '#fefefe99';
        g.lineWidth = 1.5;
        g.strokeRect(-31, -18, 62, 36);
        g.fillStyle = '#fefefe99';
        g.font = '12px Arial';
        g.fillText(String(i + 1), -45, 4);
        g.restore();
    }
    // Infield branding and a separate pit complex.
    g.fillStyle = '#27384822';
    g.textAlign = 'center';
    g.font = 'italic 900 110px Arial';
    g.fillText(TRACKS[track].name.toUpperCase(), WORLD.cx, WORLD.cy - 230);
    g.font = '24px Arial';
    g.fillText('PROPULSÃO / ' + TRACKS[track].miles + ' / SENTIDO ANTI-HORÁRIO', WORLD.cx, WORLD.cy - 180);
    // Sponsor boards and braking-distance signs stay clear of the driving surface.
    for (let i = 0; i < 180; i++) {
        const p = position(i / 180, 223, track);
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.angle);
        g.fillStyle = i % 3 ? '#273848' : '#F04718';
        g.fillRect(-48, -10, 96, 20);
        g.fillStyle = i % 3 ? '#f5f3ed' : '#000000';
        g.font = 'bold italic 10px Arial';
        g.fillText(i % 3 ? 'PROPULSÃO' : 'RACING', 0, 4);
        g.restore();
    }
    for (const f of [.17, .67])
        for (let i = 0; i < 3; i++) {
            const p = position(f - i * .012, 210, track);
            g.save();
            g.translate(p.x, p.y);
            g.rotate(p.angle);
            g.fillStyle = '#f5f3ed';
            g.fillRect(-17, -13, 34, 26);
            g.fillStyle = '#273848';
            g.font = 'bold 13px Arial';
            g.fillText(String((i + 1) * 100), 0, 5);
            g.restore();
        }
}
function cameraFor(r) { return { x: r.x - 600, y: r.y - 360 }; }
function renderRace(r) {
    const g = $('#raceCanvas').getContext('2d'), map = buildWorld(r.track), camera = cameraFor(r);
    g.fillStyle = '#F5F3ED';
    g.fillRect(0, 0, 1200, 720);
    g.save();
    g.translate(-camera.x, -camera.y);
    drawWorldTiles(g,r.track,camera);
    warmWorldAhead(r);
    g.strokeStyle = '#00000088';
    g.lineWidth = 3;
    for (const skid of r.skids) {
        g.save();
        g.translate(skid.x, skid.y);
        g.rotate(skid.a);
        g.beginPath();
        g.moveTo(-16, -12);
        g.lineTo(-26, -12);
        g.moveTo(-16, 12);
        g.lineTo(-26, 12);
        g.stroke();
        g.restore();
    }
    for (const b of r.bots)
        car(g, b.x, b.y, b.angle, b.color, b.n, 1.5, b.steer * .32);
    for (const b of r.remotes) {
        if (b.updated && b.x) {
            drawDriverCar(g, b.x, b.y, b.angle, b.driverId, 1.5 * PILOT_CAR_SCALE);
            g.fillStyle = '#FEFEFE';
            g.font = '12px Arial';
            g.textAlign = 'center';
            g.fillText(b.name, b.x, b.y - 35);
        }
    }
    drawDriverCar(g, r.x, r.y, r.angle, r.driverId, 1.5 * PILOT_CAR_SCALE, r.steer * .32);
    g.restore();
    // The camera translation always puts the player's world position at the viewport center.
    g.save();
    g.translate(950, 22);
    g.fillStyle = '#273848F2';
    g.beginPath();
    g.roundRect(0, 0, 228, 155, 10);
    g.fill();
    g.drawImage(map, 8, 8, 212, 127);
    g.font = '9px Arial';
    g.textAlign = 'left';
    g.fillStyle = '#F5F3ED';
    g.fillText('MAPA DO CIRCUITO', 12, 146);
    const dot = (x, y, color, size) => { g.fillStyle = color; g.beginPath(); g.arc(8 + x / WORLD.width * 212, 8 + y / WORLD.height * 127, size, 0, TAU); g.fill(); };
    for (const b of r.bots)
        dot(b.x, b.y, b.color, 2);
    for (const b of r.remotes)
        if (b.updated)
            dot(b.x, b.y, b.color, 2);
    const pit = pitPosition(.16, r.track);
    dot(pit.x, pit.y, '#F04718', 5);
    dot(r.x, r.y, profile.color, 4);
    g.restore();
    let alert = r.pitService > 0 ? 'TROCANDO PNEUS · ' + r.pitService.toFixed(1) + 's' : r.pitRequested ? 'BOXES · ENTRE EM PIT IN E PARE NO BOX' : r.inPitLane ? 'PIT LANE · LIMITE 80 KM/H · SAÍDA PIT OUT' : r.recovery > 0 ? 'RETORNO À PISTA · ' + Math.ceil(r.recovery) + 's' : r.wrongWay ? 'SENTIDO CONTRÁRIO' : r.offroad ? 'FORA DO ASFALTO · ADERÊNCIA REDUZIDA' : '';
    if (alert) {
        g.fillStyle = '#F04718';
        g.fillRect(340, 640, 520, 42);
        g.fillStyle = '#000000';
        g.font = 'bold 15px Arial';
        g.textAlign = 'center';
        g.fillText(alert, 600, 667);
    }
}
