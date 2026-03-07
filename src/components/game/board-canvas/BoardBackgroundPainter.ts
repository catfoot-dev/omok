import { GRID_SIZE, STAR_POINTS } from '@/lib/game/constants';

import { BoardGeometry } from './BoardGeometry';
import { clearCanvas, fillRoundedRect, strokeRoundedRect } from './drawUtils';

export class BoardBackgroundPainter {
  paint(context: CanvasRenderingContext2D, geometry: BoardGeometry): void {
    clearCanvas(context, geometry);

    const width = geometry.getCssWidth();
    const height = geometry.getCssHeight();
    const radius = geometry.getBoardRadius();

    const baseGradient = context.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#ddb777');
    baseGradient.addColorStop(1, '#ad7337');
    fillRoundedRect(context, 0, 0, width, height, radius, baseGradient);

    const sheenGradient = context.createLinearGradient(0, 0, 0, height);
    sheenGradient.addColorStop(0, 'rgba(255, 241, 213, 0.28)');
    sheenGradient.addColorStop(0.45, 'rgba(255, 241, 213, 0.06)');
    sheenGradient.addColorStop(1, 'rgba(74, 43, 18, 0.16)');
    fillRoundedRect(context, 0, 0, width, height, radius, sheenGradient);

    strokeRoundedRect(context, 1, 1, width - 2, height - 2, radius, 'rgba(50, 34, 21, 0.9)', 2);

    const lineStart = geometry.getBoardStart();
    const lineEnd = geometry.getBoardEnd();

    context.save();
    context.strokeStyle = 'rgba(45, 34, 21, 0.95)';
    context.lineWidth = geometry.getLineWidth();

    for (let index = 0; index < GRID_SIZE; index += 1) {
      const point = geometry.gridToPoint(index, index);

      context.beginPath();
      context.moveTo(lineStart, point.y);
      context.lineTo(lineEnd, point.y);
      context.stroke();

      context.beginPath();
      context.moveTo(point.x, lineStart);
      context.lineTo(point.x, lineEnd);
      context.stroke();
    }

    context.restore();

    context.save();
    context.fillStyle = 'rgba(45, 34, 21, 0.94)';
    for (const row of STAR_POINTS) {
      for (const column of STAR_POINTS) {
        const point = geometry.gridToPoint(column, row);
        context.beginPath();
        context.arc(point.x, point.y, Math.max(3, geometry.getCellSize() * 0.1), 0, Math.PI * 2);
        context.closePath();
        context.fill();
      }
    }
    context.restore();
  }
}
