import type { FFmpeg } from '@ffmpeg/ffmpeg';

declare global {
  interface Window {
    ffmpeg?: FFmpeg;
  }
}
