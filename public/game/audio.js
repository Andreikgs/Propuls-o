'use strict';
function soundTelemetry(r, input) {
    const speed = Math.max(0, r.speed || 0), throttle = !!input.throttle, braking = !!input.brake && speed > 12;
    const gear = Math.min(5, 1 + Math.floor(speed / 65)), rev = Math.min(1, (speed - (gear - 1) * 65) / 65);
    return { rate: .72 + rev * .8 + (throttle ? .12 : 0), engine: .15 + Math.min(speed / 330, 1) * .10 + (throttle ? .08 : 0),
        brake: braking ? Math.min(speed / 200, 1) * .15 : 0,
        skid: !r.offroad && speed > 45 ? Math.min(1, Math.max(0, ((r.slip || 0) - 8) / 27) + (braking ? Math.max(0, speed - 125) / 230 : 0)) : 0 };
}
const raceAudio = {
    ctx: null, nodes: null, muted: false, volume: .5, focused: true, unavailable: false,
    init() {
        if (this.ctx || this.unavailable)
            return;
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) {
            this.unavailable = true;
            this.ui();
            return;
        }
        let ctx;
        try {
            ctx = new Audio();
            const master = ctx.createGain(), limiter = ctx.createDynamicsCompressor();
            master.gain.value = 0;
            limiter.threshold.value = -12;
            limiter.knee.value = 16;
            limiter.ratio.value = 5;
            master.connect(limiter);
            limiter.connect(ctx.destination);
            const decode = sample => {
                const raw = atob(sample.pcm), buffer = ctx.createBuffer(1, raw.length / 2, sample.sampleRate), data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    const unsigned = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
                    data[i] = (unsigned >= 32768 ? unsigned - 65536 : unsigned) / 32768;
                }
                return buffer;
            };
            const engineBuffer = decode(RECORDED_SAMPLES.engine), tireBuffer = decode(RECORDED_SAMPLES.tires);
            const gain = () => { const n = ctx.createGain(); n.gain.value = 0; n.connect(master); return n; };
            const engine = gain(), brake = gain(), skid = gain();
            const motor = ctx.createBufferSource(), braking = ctx.createBufferSource(), sliding = ctx.createBufferSource();
            motor.buffer = engineBuffer;
            braking.buffer = tireBuffer;
            sliding.buffer = tireBuffer;
            const low = ctx.createBiquadFilter();
            low.type = 'lowpass';
            low.frequency.value = 1200;
            low.Q.value = .7;
            const brakeFilter = ctx.createBiquadFilter();
            brakeFilter.type = 'lowpass';
            brakeFilter.frequency.value = 1300;
            brakeFilter.Q.value = .5;
            motor.connect(low);
            low.connect(engine);
            braking.connect(brakeFilter);
            brakeFilter.connect(brake);
            sliding.connect(skid);
            motor.loop = braking.loop = sliding.loop = true;
            motor.start();
            braking.start();
            sliding.start(0, .23);
            this.ctx = ctx;
            this.nodes = { master, engine, brake, skid, motor, braking, sliding, low };
        }
        catch {
            if (ctx)
                ctx.close().catch(() => { });
            this.unavailable = true;
        }
        this.ui();
    },
    unlock() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended')
            this.ctx.resume().then(() => this.ui()).catch(() => { });
    },
    param(param, value, time = .07) { param.setTargetAtTime(value, this.ctx.currentTime, time); },
    silence() { if (this.nodes)
        this.param(this.nodes.master.gain, 0, .025); },
    update(r, input) {
        if (!this.ctx || !this.nodes)
            return;
        const active = r && r.active && !r.paused && !r.done && !r.recovery && this.focused && !document.hidden;
        if (!active || this.muted) {
            this.silence();
            return;
        }
        const s = soundTelemetry(r, input), n = this.nodes;
        this.param(n.master.gain, this.volume * .85);
        this.param(n.motor.playbackRate, s.rate, .12);
        this.param(n.low.frequency, input.throttle ? 2600 : 1100, .12);
        this.param(n.engine.gain, s.engine);
        this.param(n.brake.gain, s.brake, .045);
        this.param(n.skid.gain, s.skid * .32, .05);
        this.param(n.braking.playbackRate, .88 + Math.min(r.speed / 330, 1) * .17, .1);
        this.param(n.sliding.playbackRate, .92 + Math.min(r.speed / 330, 1) * .20, .1);
    },
    ui() {
        const b = $('#soundBtn');
        b.textContent = this.unavailable ? '—' : this.muted ? '🔇' : '🔊';
        b.setAttribute('aria-pressed', String(this.muted));
        b.setAttribute('aria-label', this.unavailable ? 'Áudio indisponível neste navegador' : this.muted ? 'Ativar som' : 'Silenciar som');
        b.title = this.unavailable ? 'Áudio indisponível' : this.muted ? 'Ativar som' : 'Silenciar som';
        b.disabled = this.unavailable;
    },
    save() { try {
        localStorage.setItem('oval-audio', JSON.stringify({ muted: this.muted, volume: this.volume }));
    }
    catch { } },
    toggle() { this.muted = !this.muted; if (!this.muted)
        this.unlock();
    else
        this.silence(); this.save(); this.ui(); }
};
try {
    const settings = JSON.parse(localStorage.getItem('oval-audio') || '{}');
    raceAudio.muted = settings.muted === true;
    if (Number.isFinite(settings.volume))
        raceAudio.volume = Math.max(0, Math.min(1, settings.volume));
}
catch { }
$('#soundBtn').onclick = () => raceAudio.toggle();
$('#soundVolume').value = String(Math.round(raceAudio.volume * 100));
$('#soundVolume').oninput = e => { raceAudio.volume = Number(e.target.value) / 100; raceAudio.save(); if (!raceAudio.volume)
    raceAudio.silence(); };
window.addEventListener('pointerdown', () => raceAudio.unlock(), { passive: true });
window.addEventListener('keydown', () => raceAudio.unlock());
window.addEventListener('blur', () => { raceAudio.focused = false; raceAudio.silence(); });
window.addEventListener('focus', () => { raceAudio.focused = true; });
window.addEventListener('pagehide', () => raceAudio.silence());
document.addEventListener('visibilitychange', () => { if (document.hidden)
    raceAudio.silence(); });
raceAudio.ui();
