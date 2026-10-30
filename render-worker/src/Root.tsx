import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoComposition, CompositionProps } from './Composition';

export const RemotionRoot: React.FC = () => {
  const defaultProps: CompositionProps = {
    title: 'The Truth Lantern',
    scenes: [
      {
        id: 'S01',
        duration: 4,
        phase: 'hook',
        action: 'A glowing red lantern lights up on an empty midnight platform',
        narration: 'What if one lantern could tell who was lying?',
        onScreenText: 'THE TRUTH LANTERN',
        keyword: 'TRUTH',
        palette: {
          bg: '#0f141c',
          card: '#161e2b',
          primary: '#e14b45',
          accent: '#f59e0b',
          text: '#f2f0ea',
        },
      },
      {
        id: 'S02',
        duration: 5,
        phase: 'value',
        action: 'A courier sets the heavy lantern onto the wooden bench',
        narration: 'She carried it through twelve silent cities before it sparkled.',
        onScreenText: 'TWELVE CITIES SILENT',
        keyword: 'SILENT',
        palette: {
          bg: '#0f141c',
          card: '#161e2b',
          primary: '#3b82f6',
          accent: '#60a5fa',
          text: '#f2f0ea',
        },
      },
      {
        id: 'S03',
        duration: 6,
        phase: 'cta',
        action: 'The golden flame surges as the night train doors slide open',
        narration: 'Subscribe now to ride the night line tomorrow.',
        onScreenText: 'FOLLOW THE NIGHT LINE',
        keyword: 'NIGHT',
        palette: {
          bg: '#0f141c',
          card: '#161e2b',
          primary: '#10b981',
          accent: '#34d399',
          text: '#f2f0ea',
        },
      },
    ],
  };

  // 15 seconds total at 30 fps = 450 frames
  const totalSeconds = defaultProps.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <Composition
      id="FlatKineticVideo"
      component={VideoComposition}
      durationInFrames={totalSeconds * 30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};

registerRoot(RemotionRoot);
