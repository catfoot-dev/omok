import type { StoneColor } from '@/lib/game/types';

import { BoardGeometry } from './BoardGeometry';

type GradientLike = {
  addColorStop: (offset: number, color: string) => void;
};

function drawRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const cornerRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + cornerRadius, y);
  context.lineTo(x + width - cornerRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  context.lineTo(x + width, y + height - cornerRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  context.lineTo(x + cornerRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  context.lineTo(x, y + cornerRadius);
  context.quadraticCurveTo(x, y, x + cornerRadius, y);
  context.closePath();
}

export function clearCanvas(context: CanvasRenderingContext2D, geometry: BoardGeometry): void {
  context.clearRect(0, 0, geometry.getCssWidth(), geometry.getCssHeight());
}

export function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
): void {
  drawRoundedRectPath(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

export function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number,
): void {
  drawRoundedRectPath(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
}

function applyGradientColors(
  gradient: GradientLike,
  colorStops: Array<[number, string]>,
): GradientLike {
  for (const [offset, color] of colorStops) {
    gradient.addColorStop(offset, color);
  }

  return gradient;
}

function createStoneGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: StoneColor,
): CanvasGradient {
  const gradient = applyGradientColors(
    context.createRadialGradient(x - radius * 0.45, y - radius * 0.45, radius * 0.25, x, y, radius),
    color === 0
      ? [
          [0, '#5a554f'],
          [0.65, '#1b1b1b'],
          [1, '#090909'],
        ]
      : [
          [0, '#ffffff'],
          [0.72, '#dddddd'],
          [1, '#c9c9c9'],
        ],
  );

  return gradient as CanvasGradient;
}

export function drawStone(
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  x: number,
  y: number,
  color: StoneColor,
  options?: {
    ghost?: boolean;
  },
): void {
  const radius = geometry.getStoneRadius();

  context.save();
  if (options?.ghost) {
    context.globalAlpha = 0.72;
  }

  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = createStoneGradient(context, x, y, radius, color);
  context.shadowColor = 'rgba(0, 0, 0, 0.25)';
  context.shadowBlur = radius * 0.45;
  context.shadowOffsetY = radius * 0.14;
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(x - radius * 0.28, y - radius * 0.28, radius * 0.18, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = color === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.58)';
  context.fill();
  context.restore();

  if (options?.ghost) {
    context.save();
    context.beginPath();
    context.arc(x, y, radius + 1, 0, Math.PI * 2);
    context.closePath();
    context.lineWidth = Math.max(2, geometry.getCellSize() * 0.08);
    context.strokeStyle = '#ff7235';
    context.stroke();
    context.restore();
  }
}

export function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    color: string;
    fontSize: number;
    weight?: number | string;
    shadowColor?: string;
  },
): void {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${options.weight ?? 700} ${options.fontSize}px sans-serif`;
  context.fillStyle = options.color;
  if (options.shadowColor) {
    context.shadowColor = options.shadowColor;
    context.shadowBlur = 8;
  }
  context.fillText(text, x, y);
  context.restore();
}

export function drawHighlightRing(
  context: CanvasRenderingContext2D,
  geometry: BoardGeometry,
  x: number,
  y: number,
): void {
  context.save();
  context.beginPath();
  context.arc(x, y, geometry.getStoneRadius() + geometry.getCellSize() * 0.12, 0, Math.PI * 2);
  context.closePath();
  context.lineWidth = Math.max(2, geometry.getCellSize() * 0.08);
  context.strokeStyle = '#fff270';
  context.stroke();
  context.restore();
}
