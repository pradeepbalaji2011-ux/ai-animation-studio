import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Download, Play, Square, Sparkles, RefreshCw, Film } from 'lucide-react';

interface NotifyFn {
  (msg: string, type?: 'success' | 'error' | 'info'): void;
}

interface Props {
  notify: NotifyFn;
}

// ─── Character Rig ──────────────────────────────────────────────────────────
type Phase = 'idle' | 'walk' | 'gesture_up' | 'gesture_point' | 'bow' | 'speak';

interface CharState {
  phase: Phase;
  frame: number;
  x: number;
  y: number;
  mouthOpen: number;
  eyeBlink: number;
  headTilt: number;
  armLAngle: number;
  armRAngle: number;
  legLAngle: number;
  legRAngle: number;
  bodyBob: number;
  hairFlow: number;
  faceExpr: 'neutral' | 'smile' | 'determined' | 'surprised';
}

function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ─── Draw anime character on canvas ─────────────────────────────────────────
function drawCharacter(ctx: CanvasRenderingContext2D, s: CharState, scale: number = 1) {
  ctx.save();
  ctx.translate(s.x, s.y + s.bodyBob);
  ctx.scale(scale, scale);

  // Shadows
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 95, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === LEGS ===
  const ll = s.legLAngle;
  const lr = s.legRAngle;

  // Left leg
  ctx.save();
  ctx.translate(-10, 60);
  ctx.rotate(ll);
  // Upper leg
  ctx.fillStyle = '#2d2d7e';
  ctx.beginPath();
  ctx.roundRect(-7, 0, 14, 30, 4);
  ctx.fill();
  // Lower leg
  ctx.translate(0, 30);
  ctx.rotate(-ll * 0.5);
  ctx.fillStyle = '#1a1a5e';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 12, 28, 3);
  ctx.fill();
  // Shoe
  ctx.translate(0, 28);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(10, 60);
  ctx.rotate(lr);
  ctx.fillStyle = '#2d2d7e';
  ctx.beginPath();
  ctx.roundRect(-7, 0, 14, 30, 4);
  ctx.fill();
  ctx.translate(0, 30);
  ctx.rotate(-lr * 0.5);
  ctx.fillStyle = '#1a1a5e';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 12, 28, 3);
  ctx.fill();
  ctx.translate(0, 28);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === BODY / TORSO ===
  // Jacket
  const bodyGrad = ctx.createLinearGradient(-28, -5, 28, 55);
  bodyGrad.addColorStop(0, '#4f46e5');
  bodyGrad.addColorStop(1, '#2d2d7e');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-24, 0, 48, 62, [6, 6, 0, 0]);
  ctx.fill();

  // Jacket lapels
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-16, 30);
  ctx.lineTo(0, 20);
  ctx.lineTo(16, 30);
  ctx.lineTo(8, 0);
  ctx.closePath();
  ctx.fill();

  // Tie
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-4, 5);
  ctx.lineTo(4, 5);
  ctx.lineTo(6, 35);
  ctx.lineTo(0, 42);
  ctx.lineTo(-6, 35);
  ctx.closePath();
  ctx.fill();

  // Belt
  ctx.fillStyle = '#1a1a5e';
  ctx.beginPath();
  ctx.roundRect(-24, 56, 48, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.roundRect(-5, 57, 10, 6, 1);
  ctx.fill();

  // === ARMS ===
  const al = s.armLAngle;
  const ar = s.armRAngle;

  // Left arm
  ctx.save();
  ctx.translate(-24, 8);
  ctx.rotate(al);
  // Upper arm
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 16, 30, 5);
  ctx.fill();
  // Forearm
  ctx.translate(0, 30);
  ctx.rotate(al * 0.3);
  ctx.fillStyle = '#ffe4c4';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 12, 25, 4);
  ctx.fill();
  // Hand
  ctx.translate(0, 25);
  ctx.fillStyle = '#ffe4c4';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  // Fingers hint
  ctx.strokeStyle = '#d4a07a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, -3); ctx.lineTo(-7, 4);
  ctx.moveTo(0, -5); ctx.lineTo(-1, 5);
  ctx.moveTo(5, -3); ctx.lineTo(6, 4);
  ctx.stroke();
  ctx.restore();

  // Right arm
  ctx.save();
  ctx.translate(24, 8);
  ctx.rotate(ar);
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 16, 30, 5);
  ctx.fill();
  ctx.translate(0, 30);
  ctx.rotate(ar * 0.3);
  ctx.fillStyle = '#ffe4c4';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 12, 25, 4);
  ctx.fill();
  ctx.translate(0, 25);
  ctx.fillStyle = '#ffe4c4';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4a07a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, -3); ctx.lineTo(-7, 4);
  ctx.moveTo(0, -5); ctx.lineTo(-1, 5);
  ctx.moveTo(5, -3); ctx.lineTo(6, 4);
  ctx.stroke();
  ctx.restore();

  // === HEAD ===
  ctx.save();
  ctx.rotate(s.headTilt * 0.04);

  // Neck
  ctx.fillStyle = '#ffe4c4';
  ctx.beginPath();
  ctx.roundRect(-8, -22, 16, 22, 3);
  ctx.fill();

  // Head base
  const headGrad = ctx.createRadialGradient(6, -48, 5, 0, -48, 36);
  headGrad.addColorStop(0, '#fff0e0');
  headGrad.addColorStop(1, '#ffe4c4');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.ellipse(0, -50, 30, 34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheek blush
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ff9999';
  ctx.beginPath();
  ctx.ellipse(-18, -42, 8, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(18, -42, 8, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── HAIR ──
  const hf = s.hairFlow;
  // Back hair
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(-28, -60);
  ctx.quadraticCurveTo(-38, -30 + hf, -32, 10);
  ctx.lineTo(-20, 5);
  ctx.quadraticCurveTo(-26, -30, -20, -65);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(28, -60);
  ctx.quadraticCurveTo(38, -30 - hf, 32, 10);
  ctx.lineTo(20, 5);
  ctx.quadraticCurveTo(26, -30, 20, -65);
  ctx.closePath();
  ctx.fill();

  // Top hair
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(0, -75, 32, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair spikes / bangs (anime style)
  ctx.fillStyle = '#1a1a1a';
  // Center spike
  ctx.beginPath();
  ctx.moveTo(-8, -78);
  ctx.quadraticCurveTo(0, -98 + hf, 8, -78);
  ctx.fill();
  // Left spike
  ctx.beginPath();
  ctx.moveTo(-18, -74);
  ctx.quadraticCurveTo(-28, -92 + hf * 0.7, -10, -73);
  ctx.fill();
  // Right spike
  ctx.beginPath();
  ctx.moveTo(18, -74);
  ctx.quadraticCurveTo(28, -92 - hf * 0.7, 10, -73);
  ctx.fill();

  // Hair shine
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-8, -82, 10, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // ── EYES ──
  const blink = s.eyeBlink;
  const eyeH = blink > 0.8 ? 2 : 12 * (1 - blink);

  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-13, -52, 10, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, -52, 10, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();

  if (blink < 0.8) {
    // Irises (anime large)
    const irisGrad = ctx.createRadialGradient(-13, -53, 1, -13, -52, 7);
    irisGrad.addColorStop(0, '#7c3aed');
    irisGrad.addColorStop(0.6, '#4f46e5');
    irisGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(-13, -52, 7, Math.min(7, eyeH - 1), 0, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad2 = ctx.createRadialGradient(13, -53, 1, 13, -52, 7);
    irisGrad2.addColorStop(0, '#7c3aed');
    irisGrad2.addColorStop(0.6, '#4f46e5');
    irisGrad2.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = irisGrad2;
    ctx.beginPath();
    ctx.ellipse(13, -52, 7, Math.min(7, eyeH - 1), 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-13, -52, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, -52, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-15, -55, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, -55, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyelashes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-22, -58); ctx.lineTo(-20, -62);
    ctx.moveTo(-18, -60); ctx.lineTo(-17, -64);
    ctx.moveTo(-13, -61); ctx.lineTo(-13, -65);
    ctx.moveTo(-8, -60); ctx.lineTo(-8, -64);
    ctx.moveTo(-4, -58); ctx.lineTo(-3, -62);
    ctx.moveTo(4, -58); ctx.lineTo(3, -62);
    ctx.moveTo(8, -60); ctx.lineTo(8, -64);
    ctx.moveTo(13, -61); ctx.lineTo(13, -65);
    ctx.moveTo(18, -60); ctx.lineTo(17, -64);
    ctx.moveTo(22, -58); ctx.lineTo(20, -62);
    ctx.stroke();
  }

  // Eyebrows
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  if (s.faceExpr === 'determined') {
    // Angled determined brows
    ctx.beginPath();
    ctx.moveTo(-22, -66); ctx.lineTo(-5, -63);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -63); ctx.lineTo(22, -66);
    ctx.stroke();
  } else if (s.faceExpr === 'surprised') {
    ctx.beginPath();
    ctx.moveTo(-22, -68); ctx.lineTo(-5, -70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -70); ctx.lineTo(22, -68);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-22, -65); ctx.quadraticCurveTo(-13, -66, -5, -63);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -63); ctx.quadraticCurveTo(13, -66, 22, -65);
    ctx.stroke();
  }

  // ── NOSE ──
  ctx.strokeStyle = '#d4a07a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(3, -43); ctx.quadraticCurveTo(6, -40, 3, -38);
  ctx.stroke();

  // ── MOUTH ──
  const mo = s.mouthOpen;
  if (mo > 0.1) {
    // Open mouth (speaking)
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.ellipse(0, -32, 8, mo * 7, 0, 0, Math.PI);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -33, 6, mo * 3, 0, 0, Math.PI);
    ctx.fill();
    // Tongue
    ctx.fillStyle = '#ff7777';
    ctx.beginPath();
    ctx.ellipse(0, -30 + mo * 2, 5, mo * 3, 0, 0, Math.PI);
    ctx.fill();
  } else if (s.faceExpr === 'smile') {
    ctx.strokeStyle = '#aa6644';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -33); ctx.quadraticCurveTo(0, -25, 10, -33);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#aa6644';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -33); ctx.quadraticCurveTo(0, -30, 8, -33);
    ctx.stroke();
  }

  // Ear
  ctx.fillStyle = '#ffcba4';
  ctx.beginPath();
  ctx.ellipse(-28, -50, 6, 9, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(28, -50, 6, 9, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // head

  // Collar / shirt collar
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-12, -5); ctx.lineTo(-20, 15); ctx.lineTo(0, 8); ctx.lineTo(20, 15); ctx.lineTo(12, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore(); // character
}

// ─── Scene definitions ────────────────────────────────────────────────────────
interface Scene {
  duration: number; // seconds
  phase: Phase;
  text: string;
  subtext?: string;
  bgFrom: string;
  bgTo: string;
  accentColor: string;
  particles: boolean;
  faceExpr: CharState['faceExpr'];
}

const SCENES: Scene[] = [
  {
    duration: 4,
    phase: 'walk',
    text: 'Your dreams are valid.',
    subtext: 'Every step counts.',
    bgFrom: '#0f0c29',
    bgTo: '#302b63',
    accentColor: '#a78bfa',
    particles: true,
    faceExpr: 'determined',
  },
  {
    duration: 4,
    phase: 'gesture_up',
    text: 'Rise above the doubt.',
    subtext: 'You were built for this.',
    bgFrom: '#1a1a2e',
    bgTo: '#16213e',
    accentColor: '#f59e0b',
    particles: true,
    faceExpr: 'determined',
  },
  {
    duration: 4,
    phase: 'speak',
    text: 'Every expert was once a beginner.',
    subtext: 'Keep going.',
    bgFrom: '#0d0d0d',
    bgTo: '#1a0533',
    accentColor: '#ec4899',
    particles: false,
    faceExpr: 'smile',
  },
  {
    duration: 4,
    phase: 'gesture_point',
    text: 'The grind never lies.',
    subtext: 'Success is earned.',
    bgFrom: '#0a0a1a',
    bgTo: '#1e1e3f',
    accentColor: '#06b6d4',
    particles: true,
    faceExpr: 'determined',
  },
  {
    duration: 4,
    phase: 'bow',
    text: 'Stay consistent.',
    subtext: 'Your future self will thank you.',
    bgFrom: '#0f1923',
    bgTo: '#1a3a2a',
    accentColor: '#22c55e',
    particles: false,
    faceExpr: 'smile',
  },
];

const TOTAL_DURATION = SCENES.reduce((s, sc) => s + sc.duration, 0);

// ─── Particle system ──────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

function spawnParticle(w: number, h: number, color: string): Particle {
  return {
    x: Math.random() * w,
    y: h + 10,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -(Math.random() * 2 + 0.5),
    radius: Math.random() * 3 + 1,
    alpha: Math.random() * 0.8 + 0.2,
    color,
    life: 0,
    maxLife: 80 + Math.random() * 60,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
const CharacterAnimator: React.FC<Props> = ({ notify }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastBlinkRef = useRef(0);
  const blinkStateRef = useRef(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const spokenSceneRef = useRef(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [status, setStatus] = useState('Click ▶ Preview or 🎬 Record Video');

  const W = 720, H = 1280; // 9:16 vertical

  // ─── Compute character state from time ──────────────────────────────────
  function computeState(_time: number, scene: Scene, sceneTime: number, frame: number): CharState {
    const t = sceneTime / scene.duration;
    const ef = easeInOut(Math.min(t, 1));
    const loopT = (frame % 60) / 60;
    const sinL = Math.sin(loopT * Math.PI * 2);
    const cosL = Math.cos(loopT * Math.PI * 2);

    let armL = 0, armR = 0, legL = 0, legR = 0;
    let bodyBob = 0;
    let mouthOpen = 0;
    let headTilt = sinL * 0.3;

    switch (scene.phase) {
      case 'walk':
        legL = sinL * 0.45;
        legR = -sinL * 0.45;
        armL = -sinL * 0.35;
        armR = sinL * 0.35;
        bodyBob = Math.abs(sinL) * 6 - 3;
        break;
      case 'gesture_up':
        armL = -1.8 + Math.sin(loopT * Math.PI * 4) * 0.15;
        armR = -0.4 + sinL * 0.1;
        bodyBob = cosL * 2;
        headTilt = sinL * 0.1;
        break;
      case 'gesture_point':
        armR = -0.8;
        armL = sinL * 0.1;
        bodyBob = sinL * 2;
        headTilt = sinL * 0.15;
        break;
      case 'speak':
        armL = -0.2 + sinL * 0.15;
        armR = -0.4 + cosL * 0.15;
        bodyBob = sinL * 3;
        mouthOpen = Math.abs(Math.sin(frame * 0.18)) * (0.4 + Math.random() * 0.3);
        headTilt = sinL * 0.2;
        break;
      case 'bow':
        armL = 0.3 + ef * 0.4;
        armR = 0.3 + ef * 0.4;
        bodyBob = ef * 15;
        headTilt = ef * 3;
        break;
      default:
        bodyBob = sinL * 2;
    }

    // Eye blink
    const now = frame;
    let eyeBlink = 0;
    if (now - lastBlinkRef.current > 70 + Math.random() * 50) {
      blinkStateRef.current = 1;
      lastBlinkRef.current = now;
    }
    if (blinkStateRef.current > 0) {
      blinkStateRef.current++;
      if (blinkStateRef.current < 5) eyeBlink = blinkStateRef.current / 4;
      else if (blinkStateRef.current < 10) eyeBlink = (10 - blinkStateRef.current) / 5;
      else blinkStateRef.current = 0;
    }

    return {
      phase: scene.phase,
      frame,
      x: W / 2,
      y: H * 0.62,
      mouthOpen,
      eyeBlink,
      headTilt: headTilt * 10,
      armLAngle: armL,
      armRAngle: armR,
      legLAngle: legL,
      legRAngle: legR,
      bodyBob,
      hairFlow: sinL * 3,
      faceExpr: scene.faceExpr,
    };
  }

  // ─── Draw full scene ─────────────────────────────────────────────────────
  function drawScene(
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    sceneTime: number,
    totalTime: number,
    frame: number
  ) {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, scene.bgFrom);
    bg.addColorStop(1, scene.bgTo);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle)
    ctx.strokeStyle = `${scene.accentColor}18`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Radial glow at character position
    const glow = ctx.createRadialGradient(W / 2, H * 0.62, 20, W / 2, H * 0.62, 300);
    glow.addColorStop(0, `${scene.accentColor}40`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Floor line
    ctx.strokeStyle = `${scene.accentColor}80`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.lineTo(W, H * 0.72);
    ctx.stroke();

    // Floor reflection glow
    const floorGlow = ctx.createLinearGradient(0, H * 0.72, 0, H * 0.85);
    floorGlow.addColorStop(0, `${scene.accentColor}30`);
    floorGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, H * 0.72, W, H * 0.15);

    // Particles
    if (scene.particles) {
      if (Math.random() < 0.3) {
        particlesRef.current.push(spawnParticle(W, H, scene.accentColor));
      }
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const pAlpha = p.alpha * (1 - p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Draw character
    const charState = computeState(totalTime, scene, sceneTime, frame);
    drawCharacter(ctx, charState, 1.55);

    // Scene intro fade
    const t = sceneTime / scene.duration;
    if (t < 0.1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.1})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (t > 0.85) {
      ctx.fillStyle = `rgba(0,0,0,${(t - 0.85) / 0.15})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ── TEXT OVERLAY ──
    const textY = H * 0.15;

    // Accent bar
    ctx.fillStyle = scene.accentColor;
    ctx.fillRect(W / 2 - 40, textY - 38, 80, 4);

    // Main text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = scene.text.length > 25 ? 52 : 62;
    ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;

    // Text shadow / glow
    ctx.shadowColor = scene.accentColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(scene.text, W / 2, textY);
    ctx.fillText(scene.text, W / 2, textY);

    // Subtext
    if (scene.subtext) {
      ctx.shadowBlur = 10;
      ctx.font = `italic 36px Arial, sans-serif`;
      ctx.fillStyle = `${scene.accentColor}ee`;
      ctx.fillText(scene.subtext, W / 2, textY + 70);
    }

    ctx.shadowBlur = 0;

    // ── BOTTOM INFO ──
    ctx.font = `bold 28px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('AnimStudio AI — Pradeep', W / 2, H - 60);

    // Progress bar
    const totalProgress = totalTime / TOTAL_DURATION;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(40, H - 30, W - 80, 6, 3);
    ctx.fill();
    ctx.fillStyle = scene.accentColor;
    ctx.beginPath();
    ctx.roundRect(40, H - 30, (W - 80) * totalProgress, 6, 3);
    ctx.fill();
  }

  // ─── Main animation loop ─────────────────────────────────────────────────
  const animate = useCallback((preview: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;
    

    particlesRef.current = [];
    frameRef.current = 0;
    startTimeRef.current = performance.now();
    lastBlinkRef.current = 0;
    blinkStateRef.current = 0;
    spokenSceneRef.current = -1;

    const FPS = 30;
    const MS_PER_FRAME = 1000 / FPS;
    let lastFrameTime = 0;

    function loop(ts: number) {
      if (ts - lastFrameTime < MS_PER_FRAME - 2) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameTime = ts;

      const elapsed = (ts - startTimeRef.current) / 1000;
      if (elapsed >= TOTAL_DURATION) {
        // Loop
        startTimeRef.current = ts;
        spokenSceneRef.current = -1;
        return;
      }

      // Find current scene
      let acc = 0;
      let scIdx = 0;
      let sceneTime = 0;
      for (let i = 0; i < SCENES.length; i++) {
        if (elapsed < acc + SCENES[i].duration) {
          scIdx = i;
          sceneTime = elapsed - acc;
          break;
        }
        acc += SCENES[i].duration;
      }

      const scene = SCENES[scIdx];

      // Speak scene text (preview only)
      if (preview && scIdx !== spokenSceneRef.current && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(scene.text + '. ' + (scene.subtext || ''));
        utt.rate = 0.95;
        utt.pitch = 1.1;
        utt.volume = 1;
        window.speechSynthesis.speak(utt);
        speechRef.current = utt;
        spokenSceneRef.current = scIdx;
      }

      drawScene(ctx, scene, sceneTime, elapsed, frameRef.current);
      frameRef.current++;

      setCurrentScene(scIdx);
      setProgress(Math.min(1, elapsed / TOTAL_DURATION));

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
  }, []);

  // ─── Preview ─────────────────────────────────────────────────────────────
  const startPreview = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    window.speechSynthesis?.cancel();
    setIsPlaying(true);
    setStatus('Playing preview with voiceover...');
    animate(true);
  }, [animate]);

  const stopAll = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsRecording(false);
    setStatus('Stopped.');
  }, []);

  // ─── Record video ────────────────────────────────────────────────────────
  const recordVideo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelAnimationFrame(animRef.current);
    window.speechSynthesis?.cancel();

    chunksRef.current = [];
    particlesRef.current = [];
    frameRef.current = 0;
    spokenSceneRef.current = -1;

    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    recorderRef.current = rec;

    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsRecording(false);
      setIsPlaying(false);
      setStatus(`✅ Video ready! (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
      notify('🎬 Video encoded successfully! Click Download to save.', 'success');
    };

    rec.start(100);
    setIsRecording(true);
    setIsPlaying(true);
    setDownloadUrl(null);
    setStatus('🔴 Recording... rendering all scenes...');

    // Render all scenes synchronously at 30fps
    const FPS = 30;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;
    let elapsed = 0;
    lastBlinkRef.current = 0;
    blinkStateRef.current = 0;

    function renderFrame() {
      if (elapsed >= TOTAL_DURATION) {
        rec.stop();
        return;
      }
      // Find scene
      let acc = 0;
      let scIdx = 0;
      let sceneTime = 0;
      for (let i = 0; i < SCENES.length; i++) {
        if (elapsed < acc + SCENES[i].duration) {
          scIdx = i;
          sceneTime = elapsed - acc;
          break;
        }
        acc += SCENES[i].duration;
      }
      drawScene(ctx, SCENES[scIdx], sceneTime, elapsed, frame);
      frame++;
      elapsed = frame / FPS;
      setProgress(Math.min(1, elapsed / TOTAL_DURATION));
      setCurrentScene(scIdx);
      animRef.current = requestAnimationFrame(renderFrame);
    }
    animRef.current = requestAnimationFrame(renderFrame);
  }, [notify]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      window.speechSynthesis?.cancel();
      recorderRef.current?.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Character Animator (Experimental Lab)
            </h1>
          </div>
          <p className="text-gray-400 ml-13 text-sm">
            Procedural canvas rig demo with walk cycles, gestures & simulated lip sync.
          </p>
        </div>

        {/* Experimental Banner */}
        <div className="mb-8 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <strong className="block text-red-400 font-semibold mb-1">EXPERIMENTAL CANVAS RIG (OFFLINE LAB)</strong>
            <p className="text-gray-300 text-xs leading-relaxed">
              This screen is a client-side procedural 2D canvas rig demo. It is not connected to the 18-preset style registry, database schema, or the production Remotion/FFmpeg render pipeline.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Canvas Panel */}
          <div className="flex flex-col gap-4">
            <div className="relative bg-black rounded-2xl overflow-hidden border border-purple-500/30"
              style={{ aspectRatio: '9/16', maxHeight: '70vh' }}>
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="w-full h-full object-contain"
              />
              {/* Recording badge */}
              {isRecording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full inline-block" />
                  RECORDING
                </div>
              )}
              {/* Scene badge */}
              {isPlaying && (
                <div className="absolute top-3 right-3 bg-black/60 text-purple-300 text-xs px-2 py-1 rounded-lg border border-purple-500/30">
                  Scene {currentScene + 1}/{SCENES.length}
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-400">{status}</p>
          </div>

          {/* Controls Panel */}
          <div className="flex flex-col gap-6">

            {/* Scene List */}
            <div className="bg-gray-900 rounded-2xl border border-purple-500/20 p-5">
              <h2 className="text-lg font-bold text-purple-300 mb-4">📽️ Animation Scenes</h2>
              <div className="space-y-3">
                {SCENES.map((sc, i) => (
                  <div key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      currentScene === i && isPlaying
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-gray-700/50 bg-gray-800/30'
                    }`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: sc.accentColor + '33', color: sc.accentColor }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">"{sc.text}"</p>
                      {sc.subtext && <p className="text-xs text-gray-400 mt-0.5">{sc.subtext}</p>}
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">{sc.phase}</span>
                        <span className="text-[10px] text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">{sc.duration}s</span>
                        <span className="text-[10px] text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">{sc.faceExpr}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">Total: {TOTAL_DURATION}s · 30fps · 720×1280 (9:16)</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isPlaying ? (
                <button onClick={startPreview}
                  className="col-span-2 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all">
                  <Play size={18} />
                  Preview (with Voiceover)
                </button>
              ) : (
                <button onClick={stopAll}
                  className="col-span-2 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all">
                  <Square size={18} />
                  Stop
                </button>
              )}

              {!isRecording ? (
                <button onClick={recordVideo}
                  disabled={isRecording}
                  className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50">
                  <Film size={18} />
                  🎬 Record & Export Video
                </button>
              ) : (
                <div className="col-span-2 flex items-center justify-center gap-2 bg-red-900/40 border border-red-500/50 text-red-300 font-bold py-3 px-6 rounded-xl animate-pulse">
                  <span className="w-3 h-3 bg-red-500 rounded-full inline-block" />
                  Recording... {Math.round(progress * TOTAL_DURATION)}s / {TOTAL_DURATION}s
                </div>
              )}

              {downloadUrl && (
                <>
                  <a href={downloadUrl} download="animstudio-character-animation.webm"
                    className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all">
                    <Download size={18} />
                    ⬇ Download Video (.webm)
                  </a>
                  <button onClick={() => { setDownloadUrl(null); setProgress(0); setStatus('Ready to record again.'); }}
                    className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-xl text-sm">
                    <RefreshCw size={14} />
                    Re-record
                  </button>
                  <a href={downloadUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-sm">
                    👁 Preview in Tab
                  </a>
                </>
              )}
            </div>

            {/* How it works */}
            <div className="bg-gray-900/60 rounded-xl border border-gray-700/50 p-4 text-sm text-gray-400">
              <p className="font-semibold text-gray-300 mb-2">⚡ How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong className="text-purple-300">5 scenes</strong> · walk → gesture up → speak → point → bow</li>
                <li><strong className="text-purple-300">Full character rig:</strong> arms, legs, hair, blinking eyes, mouth sync</li>
                <li><strong className="text-purple-300">Preview</strong> adds live browser voiceover (Web Speech API)</li>
                <li><strong className="text-purple-300">Record</strong> captures canvas → WebM video at 6 Mbps</li>
                <li>Export is <strong className="text-pink-300">720×1280 @ 30fps</strong> — ready for Reels/Shorts/TikTok</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterAnimator;
