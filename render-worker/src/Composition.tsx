import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

export interface SceneProps {
  id: string;
  duration: number; // in seconds
  phase: 'hook' | 'value' | 'cta';
  action: string;
  narration: string;
  onScreenText: string;
  keyword: string;
  palette: {
    bg: string;
    card: string;
    primary: string;
    accent: string;
    text: string;
  };
}

export interface CompositionProps {
  title: string;
  scenes: SceneProps[];
}

export const FlatScene: React.FC<{ scene: SceneProps; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Entrance spring
  const scale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const cardY = interpolate(frame, [0, 15], [80, 0], {
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Pulse effect for keyword
  const pulse = Math.sin((frame / fps) * Math.PI * 4) * 0.05 + 1;

  // Split onScreenText to highlight the keyword
  const words = (scene.onScreenText || '').split(/\s+/);
  const targetKeyword = (scene.keyword || words[0] || '').toLowerCase();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: scene.palette.bg,
        color: scene.palette.text,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '120px 80px',
      }}
    >
      {/* Background kinetic shapes */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${scene.palette.accent}22 0%, transparent 70%)`,
          transform: `scale(${1 + Math.sin(frame * 0.05) * 0.1})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${scene.palette.primary}22 0%, transparent 70%)`,
          transform: `scale(${1 + Math.cos(frame * 0.05) * 0.1})`,
        }}
      />

      {/* Top Header / Phase Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: scene.palette.accent,
            padding: '10px 24px',
            backgroundColor: `${scene.palette.accent}18`,
            borderRadius: 999,
            border: `1.5px solid ${scene.palette.accent}44`,
          }}
        >
          {scene.phase} · Scene 0{index + 1}
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          AnimStudio AI · 9:16 Safe
        </span>
      </div>

      {/* Central Visual & Kinetic Text Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${cardY}px) scale(${scale})`,
          opacity,
          backgroundColor: scene.palette.card,
          borderRadius: 48,
          padding: '80px 60px',
          border: '2px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        {/* Kinetic Icon Graphic */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            backgroundColor: scene.palette.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 48,
            boxShadow: `0 20px 50px ${scene.palette.primary}55`,
            transform: `rotate(${interpolate(frame, [0, 45], [-8, 4])}deg)`,
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        {/* Big On-Screen Kinetic Headline */}
        <div
          style={{
            fontSize: 76,
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            marginBottom: 36,
            maxWidth: 820,
          }}
        >
          {words.map((w, wIdx) => {
            const clean = w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const isHighlight = clean === targetKeyword;
            return (
              <span
                key={wIdx}
                style={{
                  display: 'inline-block',
                  margin: '0 10px',
                  color: isHighlight ? scene.palette.accent : '#ffffff',
                  transform: isHighlight ? `scale(${pulse})` : undefined,
                  textShadow: isHighlight ? `0 0 40px ${scene.palette.accent}88` : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* Action subtitle */}
        <p
          style={{
            fontSize: 34,
            lineHeight: 1.4,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.65)',
            maxWidth: 760,
            margin: 0,
          }}
        >
          {scene.action}
        </p>
      </div>

      {/* Bottom Subtitle / Narration Box inside 9:16 Safe Zone */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(20px)',
          borderRadius: 32,
          padding: '36px 48px',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 32,
            lineHeight: 1.4,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            margin: 0,
          }}
        >
          "{scene.narration}"
        </p>
      </div>
    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<CompositionProps> = ({ scenes }) => {
  const { fps } = useVideoConfig();

  let accumulatedFrames = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#090a0f' }}>
      {scenes.map((scene, idx) => {
        const from = accumulatedFrames;
        const durationInFrames = Math.round(scene.duration * fps);
        accumulatedFrames += durationInFrames;

        return (
          <Sequence key={scene.id || idx} from={from} durationInFrames={durationInFrames}>
            <FlatScene scene={scene} index={idx} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
