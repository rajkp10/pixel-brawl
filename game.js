'use strict';

/* ============================================================
   FRAME MAP (given, verbatim — do not re-derive)
   ============================================================ */
function rect(a){ return {x:a[0], y:a[1], w:a[2]-a[0], h:a[3]-a[1]}; }
function frames(arr){ return arr.map(rect); }

const ANIM = {
  idle:   frames([[20,8,43,54],[84,8,107,54]]),
  walk:   frames([[148,7,172,53],[208,8,238,54],[273,8,302,54],[337,8,367,54],
                   [401,7,431,57],[465,7,494,57],[527,9,561,54]]),
  crouch: frames([[1043,15,1071,53]]),
  jump:   frames([[975,139,1004,181]]),
  block:  frames([[16,328,45,374],[78,328,108,374],[142,328,172,374],[206,328,236,374]]),
  punch:  frames([[13,140,51,183],[77,140,108,183],[141,140,178,183],[207,142,243,183]]),
  kick:   frames([[588,136,627,181],[656,136,684,181],[721,138,749,181],[780,137,818,178],[844,137,883,178]]),
  specialCharge:  frames([[335,271,369,311],[396,270,436,310],[463,270,500,310]]),
  specialRelease: frames([[517,142,563,181]]),
  hurt:   frames([[210,201,240,246],[266,203,303,246],[337,204,369,240]]),
  ko:     frames([[450,228,503,251]]),
  dash:   frames([[16,72,46,117],[81,75,113,117]]),
  win:    frames([[913,263,942,310]]),
};

/* ============================================================
   ROSTER
   ============================================================ */
const SKINS = [
  {
    key:'blue_ronin', file:'assets/blue_ronin.png', name:'Blue Ronin',
    traits: {
      archetype: 'THE BRUISER',
      walkMult: 0.92, dashCooldownMult: 1, jumpMult: 1, airControlMult: 1,
      dmgMult: 1.15, blockChipMult: 0.75, meterGainOnHitMult: 1, passiveMeterRegen: 0,
      special: { cost:45, chargeMs:420, releaseMs:130, dmg:22, speed:420, freeMove:false },
    },
  },
  {
    key:'street_fist', file:'assets/street_fist.png', name:'Street Fist',
    traits: {
      archetype: 'THE RUSHDOWN',
      walkMult: 1.1, dashCooldownMult: 0.75, jumpMult: 1, airControlMult: 1,
      dmgMult: 0.9, blockChipMult: 1, meterGainOnHitMult: 1.25, passiveMeterRegen: 0,
      special: { cost:25, chargeMs:280, releaseMs:110, dmg:10, speed:650, freeMove:false },
    },
  },
  {
    key:'voltage', file:'assets/voltage.png', name:'Voltage',
    traits: {
      archetype: 'THE ZONER',
      walkMult: 1, dashCooldownMult: 1, jumpMult: 1, airControlMult: 1,
      dmgMult: 0.9, blockChipMult: 1, meterGainOnHitMult: 1, passiveMeterRegen: 2,
      special: { cost:35, chargeMs:420, releaseMs:130, dmg:16, speed:700, freeMove:false },
    },
  },
  {
    key:'night_ninja', file:'assets/night_ninja.png', name:'Night Ninja',
    traits: {
      archetype: 'THE TECHNICAL',
      walkMult: 1, dashCooldownMult: 1, jumpMult: 1.05, airControlMult: 1.25,
      dmgMult: 1, blockChipMult: 1, meterGainOnHitMult: 1, passiveMeterRegen: 0,
      special: { cost:35, chargeMs:300, releaseMs:130, dmg:14, speed:500, freeMove:true },
    },
  },
];
const SKIN_MAP = Object.fromEntries(SKINS.map(s => [s.key, s]));
const IMAGES = {};

/* ============================================================
   ARENAS
   ============================================================ */
function arenaGrad(ctx, x0,y0,x1,y1, stops){
  const g = ctx.createLinearGradient(x0,y0,x1,y1);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}

function drawArenaDojo(ctx){
  const W = 960, H = 540, GROUND_Y = 460;
  ctx.fillStyle = arenaGrad(ctx,0,0,0,H,[[0,'#1c130f'],[0.22,'#2a1b14'],[0.22,'#c9945a'],[0.62,'#e0aa6e'],[0.62,'#8a6a48'],[1,'#4a3826']]);
  ctx.fillRect(0,0,W,H);

  // back wall: row of shoji screens (glowing, evenly spaced)
  const shojiTop = 130, shojiBottom = 400, shojiCount = 6, gap = 10;
  const totalGap = gap*(shojiCount+1);
  const shojiW = (W - totalGap) / shojiCount;
  for (let i=0;i<shojiCount;i++){
    const x = gap + i*(shojiW+gap);
    ctx.fillStyle = arenaGrad(ctx,0,shojiTop,0,shojiBottom,[[0,'#f2d9a8'],[1,'#d8a860']]);
    ctx.fillRect(x, shojiTop, shojiW, shojiBottom-shojiTop);
    ctx.strokeStyle = 'rgba(60,40,20,0.55)'; ctx.lineWidth = 2;
    for (let gx=1; gx<3; gx++){
      const lx = x + shojiW*gx/3;
      ctx.beginPath(); ctx.moveTo(lx, shojiTop); ctx.lineTo(lx, shojiBottom); ctx.stroke();
    }
    for (let gy=1; gy<4; gy++){
      const ly = shojiTop + (shojiBottom-shojiTop)*gy/4;
      ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x+shojiW, ly); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(40,26,14,0.8)'; ctx.lineWidth = 4;
    ctx.strokeRect(x, shojiTop, shojiW, shojiBottom-shojiTop);
    if (i===1 || i===4){
      ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x+shojiW*0.2, shojiBottom); ctx.quadraticCurveTo(x+shojiW*0.5, shojiTop+40, x+shojiW*0.85, shojiTop+10);
      ctx.stroke();
    }
  }

  // tokonoma alcove (center back, raised platform w/ scroll)
  const cx = W/2;
  ctx.fillStyle = '#2a1c12';
  ctx.fillRect(cx-70, shojiTop-10, 140, shojiBottom-shojiTop+10);
  ctx.fillStyle = '#170f0a';
  ctx.fillRect(cx-58, shojiTop, 116, shojiBottom-shojiTop-40);
  ctx.fillStyle = '#7a2020';
  ctx.fillRect(cx-14, shojiTop+16, 28, 150);
  ctx.fillStyle = '#d8b878';
  ctx.fillRect(cx-10, shojiTop+26, 20, 110);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(cx+16, shojiBottom-70, 34, 14);
  ctx.fillStyle = '#4a6a4a';
  ctx.beginPath(); ctx.ellipse(cx+33, shojiBottom-84, 10, 16, 0, 0, Math.PI*2); ctx.fill();

  // structural pillars framing the scene
  [40, 900].forEach(px=>{
    ctx.fillStyle = arenaGrad(ctx,px,0,px+60,0,[[0,'#0e0906'],[0.5,'#3a2818'],[1,'#0e0906']]);
    ctx.fillRect(px-30, 40, 60, GROUND_Y-40);
  });
  ctx.fillStyle = '#20140c';
  ctx.fillRect(0, 40, W, 34);

  // hanging paper lanterns from the lintel
  [230, 730].forEach(lx=>{
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(lx,74); ctx.lineTo(lx,110); ctx.stroke();
    ctx.save();
    ctx.shadowColor = 'rgba(255,180,90,0.8)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#e8503a';
    ctx.beginPath(); ctx.ellipse(lx,132,18,24,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#7a2418';
    ctx.fillRect(lx-3, 108, 6, 8);
    ctx.fillRect(lx-3, 152, 6, 6);
  });

  // floor: tatami trim strip at the back, wood practice floor in front
  const tatamiH = 34;
  ctx.fillStyle = '#7a8a52';
  ctx.fillRect(0, GROUND_Y-tatamiH, W, tatamiH);
  ctx.strokeStyle = 'rgba(40,50,20,0.5)'; ctx.lineWidth=2;
  for (let x=0;x<W;x+=80){ ctx.strokeRect(x, GROUND_Y-tatamiH, 80, tatamiH); }

  ctx.fillStyle = arenaGrad(ctx,0,GROUND_Y,0,H,[[0,'#6b4a30'],[1,'#2e1f12']]);
  ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth=2;
  for (let x=40;x<W;x+=90){ ctx.beginPath(); ctx.moveTo(x,GROUND_Y); ctx.lineTo(x,H); ctx.stroke(); }
  ctx.strokeStyle = '#8a97a8'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,GROUND_Y+2); ctx.lineTo(W,GROUND_Y+2); ctx.stroke();
}

function drawArenaNeon(ctx){
  const W = 960, H = 540, GROUND_Y = 460;
  ctx.fillStyle = arenaGrad(ctx,0,0,0,H,[[0,'#05030f'],[0.6,'#1a0a2e'],[0.6,'#160a1e'],[1,'#0a0510']]);
  ctx.fillRect(0,0,W,H);

  const buildings = [[0,340,90],[90,260,70],[170,380,60],[240,300,100],[350,220,80],[440,360,70],
                      [520,280,90],[620,340,60],[690,240,110],[810,320,80],[900,260,60]];
  buildings.forEach(([bx,by,bw])=>{
    ctx.fillStyle = '#0d0814';
    ctx.fillRect(bx,by,bw,GROUND_Y-by);
    ctx.fillStyle = 'rgba(255,220,120,0.8)';
    for(let wx=bx+8; wx<bx+bw-8; wx+=16){
      for(let wy=by+12; wy<GROUND_Y-14; wy+=22){
        if (Math.random() > 0.45) ctx.fillRect(wx,wy,6,10);
      }
    }
  });

  ctx.save();
  ctx.shadowColor = '#ff3ad1'; ctx.shadowBlur = 30;
  ctx.strokeStyle = '#ff3ad1'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(760,180,36,0,Math.PI*1.5); ctx.stroke();
  ctx.shadowColor = '#2fe8ff'; ctx.shadowBlur = 24;
  ctx.strokeStyle = '#2fe8ff'; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(140,150); ctx.lineTo(140,230); ctx.stroke();
  ctx.restore();

  ctx.fillStyle = arenaGrad(ctx,0,GROUND_Y,0,H,[[0,'#141020'],[1,'#050308']]);
  ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ff3ad1'; ctx.fillRect(740,GROUND_Y+4,40,H-GROUND_Y-4);
  ctx.fillStyle = '#2fe8ff'; ctx.fillRect(120,GROUND_Y+4,30,H-GROUND_Y-4);
  ctx.restore();
  ctx.strokeStyle = '#3a3a52'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,GROUND_Y+2); ctx.lineTo(W,GROUND_Y+2); ctx.stroke();
}

function drawArenaDocks(ctx){
  const W = 960, H = 540, GROUND_Y = 460;
  ctx.fillStyle = arenaGrad(ctx,0,0,0,H,[[0,'#3a2050'],[0.4,'#9a4a5a'],[0.65,'#e08a4a'],[0.65,'#7a5a3a'],[1,'#2a1e14']]);
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.shadowColor = '#ffcf6b'; ctx.shadowBlur = 50;
  ctx.fillStyle = '#ffd77a';
  ctx.beginPath(); ctx.arc(480,340,58,0,Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffd77a';
  ctx.fillRect(430,GROUND_Y-2,100,H-GROUND_Y+2);
  ctx.restore();

  ctx.fillStyle = 'rgba(30,20,20,0.7)';
  ctx.fillRect(120,330,70,10);
  ctx.fillRect(145,310,4,22);

  ctx.fillStyle = '#241a12';
  [80,220,650,780,900].forEach(x=>{
    ctx.fillRect(x,GROUND_Y-40,14,H-GROUND_Y+40);
  });

  ctx.fillStyle = arenaGrad(ctx,0,GROUND_Y,0,H,[[0,'#6b4a30'],[1,'#2e1f12']]);
  ctx.fillRect(0,GROUND_Y,W,H-GROUND_Y);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth=2;
  for(let x=0;x<W;x+=70){ ctx.beginPath(); ctx.moveTo(x,GROUND_Y); ctx.lineTo(x,H); ctx.stroke(); }
  ctx.strokeStyle = '#8a97a8'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,GROUND_Y+2); ctx.lineTo(W,GROUND_Y+2); ctx.stroke();
}

const ARENAS = [
  { key:'dojo',  name:'Dojo',         draw: drawArenaDojo },
  { key:'neon',  name:'Neon City',    draw: drawArenaNeon },
  { key:'docks', name:'Sunset Docks', draw: drawArenaDocks },
];
const ARENA_MAP = Object.fromEntries(ARENAS.map(a => [a.key, a]));

/* ============================================================
   CONSTANTS
   ============================================================ */
const CANVAS_W = 960, CANVAS_H = 540, GROUND_Y = 460, SCALE = 4;
const PREVIEW_SCALE = 2.2;

const WALK_SPEED = 220, DASH_SPEED = 600, DASH_DURATION = 180, DASH_COOLDOWN = 400;
const JUMP_VELOCITY = -780, GRAVITY = 2200, MIN_SEPARATION = 70;

const PUNCH_DMG = 6, PUNCH_STARTUP = 90, PUNCH_ACTIVE = 70, PUNCH_RECOVERY = 150;
const PUNCH_KNOCKBACK = 90, PUNCH_HITSTUN = 220;
const PUNCH_METER_HIT = 8, PUNCH_METER_BLOCK = 3, PUNCH_METER_DEFENDER = 5;

const KICK_DMG = 12, KICK_STARTUP = 170, KICK_ACTIVE = 90, KICK_RECOVERY = 280;
const KICK_KNOCKBACK = 220, KICK_HITSTUN = 380;
const KICK_METER_HIT = 12, KICK_METER_BLOCK = 5, KICK_METER_DEFENDER = 6;

const SPECIAL_RELEASE = 130, SPECIAL_RECOVERY = 220;
const PROJECTILE_LIFETIME = 1200;
const PROJECTILE_METER_HIT = 10;

const BLOCK_DAMAGE_MULT = 0.2, MAX_METER = 100, MAX_HEALTH = 100;

const ROUND_TIME = 60, ROUNDS_TO_WIN = 2;
const ROUND_INTRO_MS = 1500, ROUND_END_MS = 2000, KO_HOLD_MS = 1200, WIN_POSE_MS = 2000;

const HIT_FLASH_MS = 120, SHAKE_MS = 150, PARTICLE_COUNT = 8, PARTICLE_LIFE_MS = 300;

const HITSTOP_LIGHT = 40, HITSTOP_HEAVY = 80, HITSTOP_BLOCK_MULT = 0.5, HITSTOP_KO = 140;

const AI_DECISION_INTERVAL = [200, 350], AI_FAR_RANGE = 220, AI_CLOSE_RANGE = 90;
const AI_REACT_RANGE = 100, AI_DUCK_RANGE = 150, AI_BLOCK_REACTION_CHANCE = 0.5;

const KEYMAP_P1 = { left:'a', right:'d', up:'w', down:'s', dash:'shift', punch:'j', kick:'k', special:'l' };
const KEYMAP_P2 = { left:'arrowleft', right:'arrowright', up:'arrowup', down:'arrowdown', dash:'/', punch:'1', kick:'2', special:'3' };

const PUNCH_TABLE = { dmg:PUNCH_DMG, kb:PUNCH_KNOCKBACK, stun:PUNCH_HITSTUN, meterHit:PUNCH_METER_HIT, meterBlock:PUNCH_METER_BLOCK, meterDef:PUNCH_METER_DEFENDER, big:false, hitstop:HITSTOP_LIGHT, type:'punch' };
const KICK_TABLE  = { dmg:KICK_DMG,  kb:KICK_KNOCKBACK,  stun:KICK_HITSTUN,  meterHit:KICK_METER_HIT,  meterBlock:KICK_METER_BLOCK,  meterDef:KICK_METER_DEFENDER,  big:true,  hitstop:HITSTOP_HEAVY, type:'kick' };

/* ============================================================
   UTIL
   ============================================================ */
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function aabbIntersect(a, b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

/* ============================================================
   AUDIO (synthesized SFX via Web Audio — no audio files)
   ============================================================ */
let audioCtx = null;

function ensureAudio(){
  if (!audioCtx){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(ctx, duration){
  const n = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<n;i++) data[i] = Math.random()*2 - 1;
  return buffer;
}

function playNoiseHit(opts){
  const ctx = ensureAudio();
  if (!ctx) return;
  const { duration=0.08, volume=0.3, filterFreq=1800, filterType='lowpass', decay=duration } = opts;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, duration);
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  src.start(now);
  src.stop(now + decay + 0.02);
}

function playTone(opts){
  const ctx = ensureAudio();
  if (!ctx) return;
  const { freqStart=440, freqEnd=freqStart, duration=0.1, volume=0.22, type='square' } = opts;
  const osc = ctx.createOscillator();
  osc.type = type;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function sfxPunch(){
  playNoiseHit({ duration:0.07, volume:0.32, filterFreq:2600, decay:0.08 });
  playTone({ freqStart:180, freqEnd:90, duration:0.06, volume:0.16, type:'square' });
}
function sfxKick(){
  playNoiseHit({ duration:0.11, volume:0.38, filterFreq:1200, decay:0.14 });
  playTone({ freqStart:110, freqEnd:55, duration:0.13, volume:0.22, type:'square' });
}
function sfxBlock(){
  playNoiseHit({ duration:0.09, volume:0.2, filterFreq:700, filterType:'bandpass', decay:0.09 });
  playTone({ freqStart:220, freqEnd:180, duration:0.07, volume:0.1, type:'triangle' });
}
function sfxWhoosh(){
  playNoiseHit({ duration:0.16, volume:0.14, filterFreq:900, filterType:'highpass', decay:0.16 });
}
function sfxKO(){
  playNoiseHit({ duration:0.3, volume:0.4, filterFreq:900, decay:0.35 });
  playTone({ freqStart:160, freqEnd:40, duration:0.32, volume:0.28, type:'sawtooth' });
}
function sfxRoundStart(){
  playTone({ freqStart:392, duration:0.09, volume:0.2, type:'square' });
  setTimeout(() => playTone({ freqStart:523, duration:0.14, volume:0.22, type:'square' }), 90);
}
function sfxRoundEnd(){
  playTone({ freqStart:523, duration:0.1, volume:0.2, type:'triangle' });
  setTimeout(() => playTone({ freqStart:659, duration:0.16, volume:0.22, type:'triangle' }), 100);
}
function sfxMatchEnd(){
  playTone({ freqStart:523, duration:0.12, volume:0.22, type:'square' });
  setTimeout(() => playTone({ freqStart:659, duration:0.12, volume:0.22, type:'square' }), 110);
  setTimeout(() => playTone({ freqStart:784, duration:0.3, volume:0.26, type:'square' }), 220);
}

/* ============================================================
   INPUT
   ============================================================ */
const heldKeys = new Set();
const justPressed = new Set();

window.addEventListener('keydown', (e) => {
  ensureAudio();
  const k = e.key.toLowerCase();
  if (k === 'escape') { goToSelect(); return; }
  if (['arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  if (!heldKeys.has(k)) justPressed.add(k);
  heldKeys.add(k);
});
window.addEventListener('keyup', (e) => { heldKeys.delete(e.key.toLowerCase()); });
window.addEventListener('blur', () => { heldKeys.clear(); justPressed.clear(); });

function buildInput(map){
  return {
    left: heldKeys.has(map.left),
    right: heldKeys.has(map.right),
    down: heldKeys.has(map.down),
    jumpPressed: justPressed.has(map.up),
    dashPressed: justPressed.has(map.dash),
    punchPressed: justPressed.has(map.punch),
    kickPressed: justPressed.has(map.kick),
    specialPressed: justPressed.has(map.special),
  };
}

/* ============================================================
   FIGHTER
   ============================================================ */
class Fighter {
  constructor(skinKey, x, controlScheme, name){
    this.skinKey = skinKey;
    this.img = IMAGES[skinKey];
    this.traits = SKIN_MAP[skinKey].traits;
    this.name = name;
    this.controlScheme = controlScheme; // 'p1' | 'p2' | 'ai'

    this.x = x; this.y = GROUND_Y;
    this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.grounded = true;
    this.facingLocked = false;

    this.state = 'idle';
    this.animFrames = ANIM.idle;
    this.animIndex = 0;
    this.animFrameTimer = 0;

    this.health = MAX_HEALTH;
    this.meter = 0;

    this.attackPhase = null;
    this.phaseTimer = 0;
    this.hitConsumedThisSwing = false;

    this.flashTimer = 0;
    this.hitstunRemaining = 0;
    this.dashCooldownRemaining = 0;
    this.dashTimer = 0;
    this.blockTimer = 0;

    this.aiTimer = 0;
    this.aiMoveLeft = false; this.aiMoveRight = false; this.aiMoveDown = false;
    this.aiPending = null;
  }
}

function resetFighterForRound(f, x, facing){
  f.x = x; f.y = GROUND_Y; f.vx = 0; f.vy = 0; f.facing = facing;
  f.grounded = true; f.facingLocked = false;
  f.state = 'idle';
  f.animFrames = ANIM.idle; f.animIndex = 0; f.animFrameTimer = 0;
  f.health = MAX_HEALTH; f.meter = 0;
  f.attackPhase = null; f.phaseTimer = 0; f.hitConsumedThisSwing = false;
  f.flashTimer = 0; f.hitstunRemaining = 0;
  f.dashCooldownRemaining = 0; f.dashTimer = 0; f.blockTimer = 0;
  f.aiTimer = 0; f.aiMoveLeft = false; f.aiMoveRight = false; f.aiMoveDown = false; f.aiPending = null;
}

function advanceAnim(f, frameArr, holdMs, dt, loop){
  if (f.animFrames !== frameArr){ f.animFrames = frameArr; f.animIndex = 0; f.animFrameTimer = 0; }
  f.animFrameTimer += dt;
  while (f.animFrameTimer >= holdMs){
    f.animFrameTimer -= holdMs;
    if (f.animIndex < frameArr.length - 1) f.animIndex++;
    else if (loop) f.animIndex = 0;
    else break;
  }
}

function startAttack(f, type){
  f.state = type;
  f.attackPhase = 'startup';
  f.phaseTimer = 0;
  f.hitConsumedThisSwing = false;
  f.facingLocked = true;
  if (f.grounded) f.vx = 0; // air attacks keep their jump-arc momentum instead of rooting
  f.animFrames = type === 'punch' ? ANIM.punch : ANIM.kick;
  f.animIndex = 0;
}

function startSpecial(f){
  f.state = 'special';
  f.attackPhase = 'charge';
  f.phaseTimer = 0;
  f.facingLocked = true;
  if (!f.traits.special.freeMove) f.vx = 0; // freeMove characters keep repositioning while they charge
  f.animFrames = ANIM.specialCharge;
  f.animIndex = 0;
}

function updateAttack(f, dt){
  f.phaseTimer += dt;
  const isPunch = f.state === 'punch';
  const T = isPunch
    ? { startup:PUNCH_STARTUP, active:PUNCH_ACTIVE, recovery:PUNCH_RECOVERY }
    : { startup:KICK_STARTUP,  active:KICK_ACTIVE,  recovery:KICK_RECOVERY };

  if (f.attackPhase === 'startup' && f.phaseTimer >= T.startup){
    f.attackPhase = 'active'; f.phaseTimer = 0;
  } else if (f.attackPhase === 'active' && f.phaseTimer >= T.active){
    f.attackPhase = 'recovery'; f.phaseTimer = 0;
  } else if (f.attackPhase === 'recovery' && f.phaseTimer >= T.recovery){
    f.attackPhase = null; f.facingLocked = false;
    if (f.grounded){
      f.state = 'idle'; f.animFrames = ANIM.idle;
    } else {
      f.state = 'jump'; f.animFrames = ANIM.jump;
    }
    f.animIndex = 0;
    return;
  }

  if (isPunch){
    f.animFrames = ANIM.punch;
    if (f.attackPhase === 'startup') f.animIndex = 0;
    else if (f.attackPhase === 'active') f.animIndex = f.phaseTimer < PUNCH_ACTIVE/2 ? 1 : 2;
    else f.animIndex = 3;
  } else {
    f.animFrames = ANIM.kick;
    if (f.attackPhase === 'startup') f.animIndex = f.phaseTimer < KICK_STARTUP/2 ? 0 : 1;
    else if (f.attackPhase === 'active') f.animIndex = 2;
    else f.animIndex = f.phaseTimer < KICK_RECOVERY/2 ? 3 : 4;
  }
}

function updateSpecial(f, dt, g, input){
  f.phaseTimer += dt;
  const st = f.traits.special;
  if (f.attackPhase === 'charge'){
    if (st.freeMove){
      if (input.left) f.vx = -WALK_SPEED * f.traits.walkMult;
      else if (input.right) f.vx = WALK_SPEED * f.traits.walkMult;
      else f.vx = 0;
    }
    f.animFrames = ANIM.specialCharge;
    f.animIndex = Math.min(2, Math.floor(f.phaseTimer / (st.chargeMs/3)));
    if (f.phaseTimer >= st.chargeMs){
      f.meter = Math.max(0, f.meter - st.cost);
      f.attackPhase = 'release'; f.phaseTimer = 0;
      f.vx = 0;
      f.animFrames = ANIM.specialRelease; f.animIndex = 0;
      spawnProjectile(f, g);
    }
  } else if (f.attackPhase === 'release'){
    f.animFrames = ANIM.specialRelease; f.animIndex = 0;
    if (f.phaseTimer >= SPECIAL_RELEASE){ f.attackPhase = 'recovery'; f.phaseTimer = 0; }
  } else if (f.attackPhase === 'recovery'){
    f.animFrames = ANIM.specialRelease; f.animIndex = 0;
    if (f.phaseTimer >= SPECIAL_RECOVERY){
      f.state = 'idle'; f.attackPhase = null; f.facingLocked = false;
      f.animFrames = ANIM.idle; f.animIndex = 0;
    }
  }
}

function tryStartAction(f, input, opp, g){
  if (input.punchPressed){ startAttack(f, 'punch'); return true; }
  if (input.kickPressed){ startAttack(f, 'kick'); return true; }
  if (input.specialPressed && f.meter >= f.traits.special.cost){ startSpecial(f); return true; }
  return false;
}

function groundedMovement(f, input, opp, g, dt){
  if (input.dashPressed && f.dashCooldownRemaining <= 0){
    const dir = input.left ? -1 : input.right ? 1 : f.facing;
    f.state = 'dash';
    f.dashTimer = DASH_DURATION;
    f.dashCooldownRemaining = DASH_DURATION + DASH_COOLDOWN * f.traits.dashCooldownMult;
    f.vx = dir * DASH_SPEED;
    f.facingLocked = true;
    f.animFrames = ANIM.dash; f.animIndex = 0; f.animFrameTimer = 0;
    sfxWhoosh();
    return;
  }
  if (tryStartAction(f, input, opp, g)) return;
  if (input.jumpPressed){
    f.state = 'jump'; f.vy = JUMP_VELOCITY * f.traits.jumpMult; f.grounded = false;
    f.animFrames = ANIM.jump; f.animIndex = 0;
    return;
  }
  if (input.down){
    f.state = 'crouch'; f.vx = 0;
    f.animFrames = ANIM.crouch; f.animIndex = 0;
    return;
  }
  if (input.left){ f.vx = -WALK_SPEED * f.traits.walkMult; f.state = 'walk'; }
  else if (input.right){ f.vx = WALK_SPEED * f.traits.walkMult; f.state = 'walk'; }
  else { f.vx = 0; f.state = 'idle'; }
  advanceAnim(f, f.state === 'walk' ? ANIM.walk : ANIM.idle, f.state === 'walk' ? 70 : 260, dt, true);
}

function updateFighter(f, input, dt, opp, g){
  if (f.flashTimer > 0) f.flashTimer = Math.max(0, f.flashTimer - dt);
  if (f.dashCooldownRemaining > 0) f.dashCooldownRemaining = Math.max(0, f.dashCooldownRemaining - dt);
  if (f.traits.passiveMeterRegen && f.state !== 'ko'){
    f.meter = clamp(f.meter + f.traits.passiveMeterRegen * dt / 1000, 0, MAX_METER);
  }
  if (!f.facingLocked) f.facing = opp.x >= f.x ? 1 : -1;

  // Gravity applies whenever airborne, independent of state — otherwise a
  // fighter hit out of 'jump' (knocked into 'hurt' or 'ko' mid-air) would
  // freeze at that height instead of falling back to the ground.
  if (!f.grounded){
    f.vy += GRAVITY * dt / 1000;
    f.y += f.vy * dt / 1000;
    if (f.y >= GROUND_Y && f.vy >= 0){
      f.y = GROUND_Y; f.vy = 0; f.grounded = true;
      if (f.state === 'jump'){
        f.facingLocked = false;
        f.state = input.down ? 'crouch' : 'idle';
        f.animFrames = f.state === 'crouch' ? ANIM.crouch : ANIM.idle;
        f.animIndex = 0;
      }
    }
  }

  switch (f.state){
    case 'ko':
      f.vx *= 0.9; f.animFrames = ANIM.ko; f.animIndex = 0;
      break;
    case 'win':
      f.vx = 0; f.animFrames = ANIM.win; f.animIndex = 0;
      break;
    case 'hurt': {
      f.hitstunRemaining -= dt;
      f.vx *= 0.9;
      advanceAnim(f, ANIM.hurt, 100, dt, false);
      if (f.hitstunRemaining <= 0){
        f.facingLocked = false;
        if (input.down){ f.state = 'crouch'; f.animFrames = ANIM.crouch; f.animIndex = 0; }
        else { f.state = 'idle'; f.animFrames = ANIM.idle; f.animIndex = 0; }
      }
      break;
    }
    case 'block': {
      f.vx = 0;
      f.blockTimer += dt;
      advanceAnim(f, ANIM.block, 45, dt, false);
      if (f.blockTimer >= 180){
        f.facingLocked = false;
        if (input.down){ f.state = 'crouch'; f.animFrames = ANIM.crouch; f.animIndex = 0; }
        else { f.state = 'idle'; f.animFrames = ANIM.idle; f.animIndex = 0; }
      }
      break;
    }
    case 'dash': {
      f.dashTimer -= dt;
      advanceAnim(f, ANIM.dash, 90, dt, true);
      if (f.dashTimer <= 0){
        f.vx = 0; f.facingLocked = false;
        f.state = 'idle'; f.animFrames = ANIM.idle; f.animIndex = 0;
      }
      break;
    }
    case 'jump': {
      const airSpeed = WALK_SPEED * f.traits.walkMult * 0.8 * f.traits.airControlMult;
      if (input.left) f.vx = -airSpeed;
      else if (input.right) f.vx = airSpeed;
      if (input.punchPressed){ startAttack(f, 'punch'); break; }
      if (input.kickPressed){ startAttack(f, 'kick'); break; }
      f.animFrames = ANIM.jump; f.animIndex = 0;
      break;
    }
    case 'crouch': {
      f.vx = 0;
      f.animFrames = ANIM.crouch; f.animIndex = 0;
      if (!input.down){ f.state = 'idle'; f.animFrames = ANIM.idle; f.animIndex = 0; }
      else tryStartAction(f, input, opp, g);
      break;
    }
    case 'punch':
    case 'kick':
      updateAttack(f, dt);
      break;
    case 'special':
      updateSpecial(f, dt, g, input);
      break;
    case 'idle':
    case 'walk':
    default:
      groundedMovement(f, input, opp, g, dt);
      break;
  }

  f.x += f.vx * dt / 1000;
  f.x = clamp(f.x, 40, CANVAS_W - 40);
}

/* ============================================================
   HITBOXES / HURTBOXES  (AABB, world px, relative to foot x,y)
   ============================================================ */
function standingHurtbox(f){ const w=60; return { x:f.x-w/2, y:f.y-170, w, h:170 }; }
function crouchHurtbox(f){ const w=60; return { x:f.x-w/2, y:f.y-100, w, h:100 }; }
function currentHurtbox(f){ return (f.state==='crouch'||f.state==='block') ? crouchHurtbox(f) : standingHurtbox(f); }

function punchHitbox(f){
  const w=40, h=65, cx=f.x+f.facing*45;
  return { x:cx-w/2, y:f.y-170, w, h };
}
function kickHitbox(f){
  const w=45, h=80, cx=f.x+f.facing*55;
  return { x:cx-w/2, y:f.y-130, w, h };
}

/* ============================================================
   PROJECTILES / PARTICLES
   ============================================================ */
function spawnProjectile(f, g){
  const st = f.traits.special;
  g.projectiles.push({
    x: f.x + f.facing*60,
    y: f.y - 140,
    vx: f.facing * st.speed,
    owner: f,
    life: PROJECTILE_LIFETIME,
    // Snapshotting the table per-projectile (rather than a shared PROJECTILE_TABLE constant)
    // is what lets each character's signature special carry its own damage.
    table: { dmg:st.dmg, kb:200, stun:320, meterHit:PROJECTILE_METER_HIT, meterBlock:4, meterDef:6, big:true, hitstop:HITSTOP_HEAVY, type:'projectile' },
  });
}

function spawnParticles(g, x, y, count){
  for (let i=0;i<count;i++){
    const ang = Math.random()*Math.PI*2;
    const speed = 60 + Math.random()*120;
    g.particles.push({
      x, y,
      vx: Math.cos(ang)*speed, vy: Math.sin(ang)*speed,
      life: PARTICLE_LIFE_MS, maxLife: PARTICLE_LIFE_MS,
    });
  }
}

function updateProjectilesAndParticles(g, step){
  for (let i=g.projectiles.length-1;i>=0;i--){
    const pr = g.projectiles[i];
    pr.x += pr.vx*step/1000;
    pr.life -= step;
    let remove = pr.life<=0 || pr.x < -40 || pr.x > CANVAS_W+40;
    if (!remove){
      const defender = pr.owner === g.p1 ? g.p2 : g.p1;
      if (defender.state !== 'ko'){
        const hb = { x:pr.x-10, y:pr.y-10, w:20, h:20 };
        if (aabbIntersect(hb, currentHurtbox(defender))){
          applyHit(pr.owner, defender, pr.table, g);
          remove = true;
        }
      }
    }
    if (remove) g.projectiles.splice(i,1);
  }
  for (let i=g.particles.length-1;i>=0;i--){
    const p = g.particles[i];
    p.x += p.vx*step/1000; p.y += p.vy*step/1000;
    p.life -= step;
    if (p.life<=0) g.particles.splice(i,1);
  }
}

/* ============================================================
   COMBAT RESOLUTION
   ============================================================ */
function checkKO(f){
  if (f.health <= 0 && f.state !== 'ko'){
    f.state = 'ko'; f.vx = 0; f.attackPhase = null; f.facingLocked = true;
    f.animFrames = ANIM.ko; f.animIndex = 0;
  }
}

function applyHit(attacker, defender, table, g){
  if (defender.state === 'ko') return;
  const dir = Math.sign(defender.x - attacker.x) || attacker.facing;

  if (defender.state === 'crouch'){
    const dmg = table.dmg * BLOCK_DAMAGE_MULT * defender.traits.blockChipMult;
    defender.health = Math.max(0, defender.health - dmg);
    defender.state = 'block';
    defender.blockTimer = 0;
    defender.animFrames = ANIM.block; defender.animIndex = 0; defender.animFrameTimer = 0;
    defender.facingLocked = true;
    defender.meter = clamp(defender.meter + table.meterDef*0.4, 0, MAX_METER);
    attacker.meter = clamp(attacker.meter + table.meterBlock, 0, MAX_METER);
    spawnParticles(g, defender.x - dir*20, defender.y-110, 4);
    g.hitStopTimer = Math.max(g.hitStopTimer, Math.round(table.hitstop * HITSTOP_BLOCK_MULT));
    sfxBlock();
  } else {
    defender.health = Math.max(0, defender.health - table.dmg);
    defender.state = 'hurt';
    defender.hitstunRemaining = table.stun;
    defender.vx = dir * table.kb;
    defender.attackPhase = null;
    defender.facingLocked = true;
    defender.animFrames = ANIM.hurt; defender.animIndex = 0; defender.animFrameTimer = 0;
    defender.flashTimer = HIT_FLASH_MS;
    attacker.meter = clamp(attacker.meter + table.meterHit * attacker.traits.meterGainOnHitMult, 0, MAX_METER);
    defender.meter = clamp(defender.meter + table.meterDef, 0, MAX_METER);
    spawnParticles(g, defender.x - dir*20, defender.y-120, PARTICLE_COUNT);
    if (table.big) g.shakeTimer = SHAKE_MS;
    g.hitStopTimer = Math.max(g.hitStopTimer, table.hitstop);
    if (table.type === 'punch') sfxPunch(); else sfxKick();
  }
  checkKO(defender);
  if (defender.state === 'ko'){
    g.hitStopTimer = Math.max(g.hitStopTimer, HITSTOP_KO);
    sfxKO();
  }
}

function tryMeleeHit(attacker, defender, g){
  if (attacker.state !== 'punch' && attacker.state !== 'kick') return;
  if (attacker.attackPhase !== 'active' || attacker.hitConsumedThisSwing) return;
  if (defender.state === 'ko') return;
  const hb = attacker.state === 'punch' ? punchHitbox(attacker) : kickHitbox(attacker);
  const hurt = currentHurtbox(defender);
  if (aabbIntersect(hb, hurt)){
    attacker.hitConsumedThisSwing = true;
    const baseTable = attacker.state === 'punch' ? PUNCH_TABLE : KICK_TABLE;
    const table = attacker.traits.dmgMult === 1 ? baseTable : { ...baseTable, dmg: baseTable.dmg * attacker.traits.dmgMult };
    applyHit(attacker, defender, table, g);
  }
}

function bodySeparation(a, b){
  const busy = ['punch','kick','special','hurt','ko','win'];
  if (busy.includes(a.state) || busy.includes(b.state)) return;
  const dx = b.x - a.x;
  const dist = Math.abs(dx);
  if (dist < MIN_SEPARATION && dist > 0){
    const overlap = (MIN_SEPARATION - dist)/2;
    const dir = Math.sign(dx);
    a.x = clamp(a.x - dir*overlap, 40, CANVAS_W-40);
    b.x = clamp(b.x + dir*overlap, 40, CANVAS_W-40);
  }
}

function resolveCombat(g){
  tryMeleeHit(g.p1, g.p2, g);
  tryMeleeHit(g.p2, g.p1, g);
  bodySeparation(g.p1, g.p2);
}

/* ============================================================
   CPU AI
   ============================================================ */
function setDir(f, dir){ f.aiMoveLeft = dir==='left'; f.aiMoveRight = dir==='right'; }

function decideAI(f, opp, g){
  const d = Math.abs(f.x - opp.x);
  const toward = opp.x > f.x ? 'right' : 'left';
  const away = toward === 'right' ? 'left' : 'right';
  f.aiMoveLeft = false; f.aiMoveRight = false; f.aiMoveDown = false; f.aiPending = null;

  if ((opp.state==='punch' || opp.state==='kick') && opp.attackPhase==='active' && d < AI_REACT_RANGE && Math.random() < AI_BLOCK_REACTION_CHANCE){
    f.aiMoveDown = true; return;
  }
  const incoming = g.projectiles.find(pr => pr.owner === opp && Math.sign(pr.vx) === Math.sign(f.x - pr.x));
  if (incoming && Math.abs(f.x - incoming.x) < AI_DUCK_RANGE && Math.random() < 0.7){
    f.aiMoveDown = true; return;
  }

  if (d > AI_FAR_RANGE){
    setDir(f, toward);
    const r = Math.random();
    if (r < 0.08) f.aiPending = 'jump';
    else if (r < 0.16) f.aiPending = 'dash';
  } else if (d > AI_CLOSE_RANGE){
    const r = Math.random();
    if (r < 0.40) setDir(f, toward);
    else if (r < 0.55){ setDir(f, toward); f.aiPending = 'dash'; }
    else if (r < 0.70 && f.meter >= f.traits.special.cost) f.aiPending = 'special';
    else if (r < 0.85) f.aiMoveDown = true;
    else setDir(f, away);
  } else {
    const r = Math.random();
    if (r < 0.35) f.aiPending = 'punch';
    else if (r < 0.60) f.aiPending = 'kick';
    else if (r < 0.80) f.aiMoveDown = true;
    else if (r < 0.90 && f.meter >= f.traits.special.cost) f.aiPending = 'special';
    else setDir(f, away);
  }
}

function aiInput(f, opp, g, dt){
  f.aiTimer -= dt;
  if (f.aiTimer <= 0){
    decideAI(f, opp, g);
    f.aiTimer = AI_DECISION_INTERVAL[0] + Math.random()*(AI_DECISION_INTERVAL[1]-AI_DECISION_INTERVAL[0]);
  }
  const input = {
    left: f.aiMoveLeft, right: f.aiMoveRight, down: f.aiMoveDown,
    jumpPressed: f.aiPending === 'jump',
    dashPressed: f.aiPending === 'dash',
    punchPressed: f.aiPending === 'punch',
    kickPressed: f.aiPending === 'kick',
    specialPressed: f.aiPending === 'special',
  };
  f.aiPending = null;
  return input;
}

/* ============================================================
   GAME STATE
   ============================================================ */
const Game = {
  screen: 'select',
  mode: '1P',
  selectedArena: 'dojo',
  arena: 'dojo',
  selection: [SKINS[0].key, SKINS[1].key],
  ctx: null,
  p1: null, p2: null,
  projectiles: [], particles: [],
  wins: [0,0], round: 1,
  fightPhase: 'roundIntro', phaseTimer: 0,
  roundTime: ROUND_TIME,
  koHoldTimer: 0, shakeTimer: 0, hitStopTimer: 0,
  roundWinnerSide: null, matchWinnerSide: null,
};

function resetForNewRound(){
  resetFighterForRound(Game.p1, 250, 1);
  resetFighterForRound(Game.p2, 710, -1);
  Game.projectiles = []; Game.particles = [];
  Game.roundTime = ROUND_TIME;
  Game.koHoldTimer = 0;
  Game.shakeTimer = 0;
  Game.hitStopTimer = 0;
  Game.roundWinnerSide = null;
}

function showScreen(name){
  Game.screen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-'+name));
}

function goToSelect(){
  if (Game.screen === 'select') return;
  Game.projectiles = []; Game.particles = [];
  showScreen('select');
}

function startMatch(){
  const skin0 = Game.selection[0], skin1 = Game.selection[1];
  const name0 = SKIN_MAP[skin0].name, name1 = SKIN_MAP[skin1].name;
  Game.p1 = new Fighter(skin0, 250, 'p1', name0);
  Game.p2 = new Fighter(skin1, 710, Game.mode === '1P' ? 'ai' : 'p2', name1);
  Game.wins = [0,0];
  Game.round = 1;
  Game.arena = Game.selectedArena;
  document.getElementById('name-p1').textContent = name0.toUpperCase();
  document.getElementById('name-p2').textContent = name1.toUpperCase();
  resetForNewRound();
  Game.fightPhase = 'roundIntro'; Game.phaseTimer = 0;
  showScreen('fight');
  sfxRoundStart();
}

function startRoundEnd(winnerSide){
  Game.fightPhase = 'roundEnd';
  Game.phaseTimer = 0;
  Game.roundWinnerSide = winnerSide;
  if (winnerSide !== null){
    Game.wins[winnerSide]++;
    const winner = winnerSide === 0 ? Game.p1 : Game.p2;
    if (winner.state !== 'ko'){ winner.state = 'win'; winner.animFrames = ANIM.win; winner.animIndex = 0; }
  }
  sfxRoundEnd();
}

function showPostmatch(){
  const winnerName = Game.matchWinnerSide === 0 ? Game.p1.name : Game.p2.name;
  document.getElementById('postmatch-title').textContent = winnerName.toUpperCase() + ' WINS!';
  showScreen('postmatch');
  sfxMatchEnd();
}

function updateRoundIntro(step){
  Game.phaseTimer += step;
  if (Game.phaseTimer >= ROUND_INTRO_MS) Game.fightPhase = 'fighting';
}

function updateRoundEnd(step){
  Game.phaseTimer += step;
  if (Game.phaseTimer >= ROUND_END_MS){
    if (Game.wins[0] >= ROUNDS_TO_WIN || Game.wins[1] >= ROUNDS_TO_WIN){
      Game.matchWinnerSide = Game.wins[0] > Game.wins[1] ? 0 : 1;
      Game.fightPhase = 'matchOver';
      showPostmatch();
    } else {
      Game.round++;
      resetForNewRound();
      Game.fightPhase = 'roundIntro'; Game.phaseTimer = 0;
      sfxRoundStart();
    }
  }
}

function updateFightingTick(step){
  const g = Game;
  if (g.hitStopTimer > 0){
    g.hitStopTimer = Math.max(0, g.hitStopTimer - step);
    return;
  }
  if (g.shakeTimer > 0) g.shakeTimer = Math.max(0, g.shakeTimer - step);

  g.roundTime -= step/1000;
  if (g.roundTime <= 0 && g.p1.state !== 'ko' && g.p2.state !== 'ko'){
    g.roundTime = 0;
    const winner = g.p1.health === g.p2.health ? null : (g.p1.health > g.p2.health ? 0 : 1);
    startRoundEnd(winner);
    return;
  }

  const input1 = g.p1.controlScheme === 'ai' ? aiInput(g.p1, g.p2, g, step) : buildInput(KEYMAP_P1);
  const input2 = g.p2.controlScheme === 'ai' ? aiInput(g.p2, g.p1, g, step) : buildInput(KEYMAP_P2);

  updateFighter(g.p1, input1, step, g.p2, g);
  updateFighter(g.p2, input2, step, g.p1, g);

  resolveCombat(g);
  updateProjectilesAndParticles(g, step);

  if (g.p1.state === 'ko' || g.p2.state === 'ko'){
    g.koHoldTimer += step;
    if (g.koHoldTimer >= KO_HOLD_MS){
      startRoundEnd(g.p1.state === 'ko' ? 1 : 0);
    }
  }
}

function update(step){
  switch (Game.fightPhase){
    case 'roundIntro': updateRoundIntro(step); break;
    case 'fighting': updateFightingTick(step); break;
    case 'roundEnd': updateRoundEnd(step); break;
  }
  updateHUD();
  // Don't drop a just-pressed edge while frozen in hit-stop — let it survive to the tick that resumes input.
  if (Game.hitStopTimer <= 0) justPressed.clear();
}

/* ============================================================
   HUD (DOM)
   ============================================================ */
function setWidth(id, pct){ document.getElementById(id).style.width = clamp(pct,0,100) + '%'; }

function renderPips(el, count){
  el.innerHTML = '';
  for (let i=0;i<ROUNDS_TO_WIN;i++){
    const d = document.createElement('span');
    d.className = 'pip' + (i<count ? ' filled' : '');
    el.appendChild(d);
  }
}

function updateHUD(){
  const g = Game;
  setWidth('health-p1', g.p1.health/MAX_HEALTH*100);
  setWidth('health-p2', g.p2.health/MAX_HEALTH*100);
  setWidth('meter-p1', g.p1.meter/MAX_METER*100);
  setWidth('meter-p2', g.p2.meter/MAX_METER*100);
  document.getElementById('timer').textContent = Math.max(0, Math.ceil(g.roundTime));
  renderPips(document.getElementById('pips-p1'), g.wins[0]);
  renderPips(document.getElementById('pips-p2'), g.wins[1]);

  const banner = document.getElementById('banner');
  if (g.fightPhase === 'roundIntro'){
    banner.textContent = 'ROUND ' + g.round;
    banner.className = 'show';
  } else if (g.fightPhase === 'roundEnd'){
    const matchOver = g.wins[0] >= ROUNDS_TO_WIN || g.wins[1] >= ROUNDS_TO_WIN;
    const winnerName = g.roundWinnerSide === 0 ? g.p1.name : g.roundWinnerSide === 1 ? g.p2.name : null;
    if (matchOver) banner.textContent = winnerName ? (winnerName.toUpperCase() + ' WINS THE MATCH!') : 'DRAW!';
    else banner.textContent = winnerName ? (winnerName.toUpperCase() + ' WINS ROUND ' + g.round + '!') : 'DRAW ROUND!';
    banner.className = 'show';
  } else {
    banner.className = '';
  }
}

/* ============================================================
   RENDER (canvas)
   ============================================================ */
function drawBackground(ctx){
  (ARENA_MAP[Game.arena] || ARENAS[0]).draw(ctx);
}

function drawFighter(ctx, f){
  const frame = f.animFrames[f.animIndex] || f.animFrames[0];
  const destW = frame.w*SCALE, destH = frame.h*SCALE;
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.facing === -1) ctx.scale(-1,1);
  if (f.flashTimer > 0) ctx.filter = 'brightness(3) saturate(0)';
  ctx.drawImage(f.img, frame.x, frame.y, frame.w, frame.h, -destW/2, -destH, destW, destH);
  ctx.filter = 'none';
  ctx.restore();
}

function drawProjectile(ctx, pr){
  ctx.save();
  const color = pr.owner === Game.p1 ? '#2fd8ff' : '#ff3b6b';
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(pr.x, pr.y, 10, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawParticle(ctx, p){
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life/p.maxLife);
  ctx.fillStyle = '#fff7c2';
  ctx.fillRect(p.x-2, p.y-2, 4, 4);
  ctx.restore();
}

function render(){
  const ctx = Game.ctx;
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  ctx.save();
  if (Game.shakeTimer > 0) ctx.translate((Math.random()-0.5)*6, (Math.random()-0.5)*6);
  drawBackground(ctx);
  for (const pr of Game.projectiles) drawProjectile(ctx, pr);
  drawFighter(ctx, Game.p1);
  drawFighter(ctx, Game.p2);
  for (const p of Game.particles) drawParticle(ctx, p);
  ctx.restore();
}

/* ============================================================
   SELECT SCREEN
   ============================================================ */
let previewEntries = [];
let previewFrame = 0, previewTimer = 0;

function selectSkin(side, key){
  Game.selection[side] = key;
  document.querySelectorAll('.thumb[data-side="'+side+'"]').forEach(el => {
    el.classList.toggle('selected', el.dataset.skin === key);
  });
}

function selectArena(key){
  Game.selectedArena = key;
  document.querySelectorAll('.thumb.arena-thumb').forEach(el => {
    el.classList.toggle('selected', el.dataset.arena === key);
  });
}

function initSelectScreen(){
  previewEntries = [];
  [0,1].forEach(side => {
    const container = document.querySelector('.thumbs[data-side="'+side+'"]');
    container.innerHTML = '';
    SKINS.forEach(skin => {
      const wrap = document.createElement('div');
      wrap.className = 'thumb';
      wrap.dataset.side = side;
      wrap.dataset.skin = skin.key;
      const canvas = document.createElement('canvas');
      canvas.width = 96; canvas.height = 112;
      const label = document.createElement('div');
      label.className = 'thumb-label';
      label.textContent = skin.name;
      const archetype = document.createElement('div');
      archetype.className = 'thumb-archetype';
      archetype.textContent = skin.traits.archetype;
      wrap.appendChild(canvas); wrap.appendChild(label); wrap.appendChild(archetype);
      container.appendChild(wrap);
      wrap.addEventListener('click', () => selectSkin(side, skin.key));
      const pctx = canvas.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      previewEntries.push({ ctx: pctx, img: IMAGES[skin.key] });
    });
  });
  selectSkin(0, SKINS[0].key);
  selectSkin(1, SKINS[1].key);

  const arenaContainer = document.getElementById('arena-thumbs');
  arenaContainer.innerHTML = '';
  ARENAS.forEach(arena => {
    const wrap = document.createElement('div');
    wrap.className = 'thumb arena-thumb';
    wrap.dataset.arena = arena.key;
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 54;
    const label = document.createElement('div');
    label.className = 'thumb-label';
    label.textContent = arena.name;
    wrap.appendChild(canvas); wrap.appendChild(label);
    arenaContainer.appendChild(wrap);
    wrap.addEventListener('click', () => selectArena(arena.key));
    const actx = canvas.getContext('2d');
    actx.scale(96/960, 54/540);
    arena.draw(actx);
  });
  selectArena(Game.selectedArena);
}

function updatePreviews(dt){
  if (Game.screen !== 'select') return;
  previewTimer += dt;
  if (previewTimer >= 260){ previewTimer = 0; previewFrame = (previewFrame+1) % 2; }
  const frame = ANIM.idle[previewFrame];
  const w = frame.w*PREVIEW_SCALE, h = frame.h*PREVIEW_SCALE;
  for (const entry of previewEntries){
    entry.ctx.clearRect(0,0,96,112);
    entry.ctx.drawImage(entry.img, frame.x, frame.y, frame.w, frame.h, (96-w)/2, 112-h-4, w, h);
  }
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
function loadImages(){
  return Promise.all(SKINS.map(s => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { IMAGES[s.key] = img; resolve(); };
    img.onerror = () => reject(new Error('Failed to load ' + s.file));
    img.src = s.file;
  })));
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Game.mode = btn.dataset.mode;
    document.getElementById('p2-label').textContent = Game.mode === '1P' ? 'CPU FIGHTER' : 'PLAYER 2';
  });
});
document.getElementById('btn-start').addEventListener('click', () => { ensureAudio(); startMatch(); });
document.getElementById('btn-rematch').addEventListener('click', () => {
  ensureAudio();
  resetForNewRound();
  Game.wins = [0,0]; Game.round = 1;
  Game.fightPhase = 'roundIntro'; Game.phaseTimer = 0;
  showScreen('fight');
  sfxRoundStart();
});
document.getElementById('btn-change').addEventListener('click', () => showScreen('select'));

const STEP = 1000/60;
let last = performance.now(), acc = 0;

function loop(now){
  const dt = Math.min(now-last, 50);
  last = now;
  updatePreviews(dt);
  if (Game.screen === 'fight'){
    acc += dt;
    while (acc >= STEP){ update(STEP); acc -= STEP; }
    render();
  }
  requestAnimationFrame(loop);
}

Game.ctx = document.getElementById('game-canvas').getContext('2d');
Game.ctx.imageSmoothingEnabled = false;

loadImages().then(() => {
  initSelectScreen();
  last = performance.now();
  requestAnimationFrame(loop);
}).catch(err => {
  console.error(err);
  document.body.innerHTML =
    '<pre style="color:#f66;padding:24px;font-family:monospace;">' +
    'Failed to load sprite sheets.\n' +
    'Make sure an "assets" folder sits next to index.html containing:\n' +
    'blue_ronin.png, street_fist.png, voltage.png, night_ninja.png</pre>';
});
