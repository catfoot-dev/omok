import { BoardGeometry, type BoardHitTarget } from './BoardGeometry';
import { BoardBackgroundPainter } from './BoardBackgroundPainter';
import { BoardInteractionPainter } from './BoardInteractionPainter';
import { BoardOverlayPainter } from './BoardOverlayPainter';
import type { BoardRenderState, BoardSceneCanvases } from './types';

type PointerLikeEvent = Pick<MouseEvent, 'clientX' | 'clientY'>;

type BoardSceneOptions = {
  onPlaceStone: (x: number, y: number) => void;
  geometry?: BoardGeometry;
  backgroundPainter?: BoardBackgroundPainter;
  overlayPainter?: BoardOverlayPainter;
  interactionPainter?: BoardInteractionPainter;
};

const EMPTY_STATE: BoardRenderState = {
  visibleBoard: {},
  currentTurn: null,
  disabled: true,
  highlightSet: new Set(),
  illegalSet: new Set(),
  scoreMap: new Map(),
  showStoneIndices: false,
  hoveredKey: null,
};

export class BoardScene {
  private readonly geometry: BoardGeometry;
  private readonly backgroundPainter: BoardBackgroundPainter;
  private readonly overlayPainter: BoardOverlayPainter;
  private readonly interactionPainter: BoardInteractionPainter;
  private backgroundContext: CanvasRenderingContext2D | null = null;
  private overlayContext: CanvasRenderingContext2D | null = null;
  private interactionContext: CanvasRenderingContext2D | null = null;
  private canvases: BoardSceneCanvases | null = null;
  private onPlaceStone: (x: number, y: number) => void;
  private renderState: BoardRenderState = EMPTY_STATE;
  private hoverKey: BoardRenderState['hoveredKey'] = null;

  constructor(options: BoardSceneOptions) {
    this.geometry = options.geometry ?? new BoardGeometry();
    this.backgroundPainter = options.backgroundPainter ?? new BoardBackgroundPainter();
    this.overlayPainter = options.overlayPainter ?? new BoardOverlayPainter();
    this.interactionPainter = options.interactionPainter ?? new BoardInteractionPainter();
    this.onPlaceStone = options.onPlaceStone;
  }

  mount(canvases: BoardSceneCanvases, _wrapper: HTMLElement): void {
    this.canvases = canvases;
    this.backgroundContext = canvases.background.getContext('2d');
    this.overlayContext = canvases.overlay.getContext('2d');
    this.interactionContext = canvases.interaction.getContext('2d');
  }

  setOnPlaceStone(onPlaceStone: (x: number, y: number) => void): void {
    this.onPlaceStone = onPlaceStone;
  }

  resize(width: number, height: number, dpr: number): void {
    if (
      !this.canvases ||
      !this.backgroundContext ||
      !this.overlayContext ||
      !this.interactionContext
    ) {
      return;
    }

    this.geometry.resize(width, height, dpr);

    for (const [canvas, context] of [
      [this.canvases.background, this.backgroundContext],
      [this.canvases.overlay, this.overlayContext],
      [this.canvases.interaction, this.interactionContext],
    ] as const) {
      canvas.width = Math.round(this.geometry.getCssWidth() * this.geometry.getDpr());
      canvas.height = Math.round(this.geometry.getCssHeight() * this.geometry.getDpr());
      canvas.style.width = `${this.geometry.getCssWidth()}px`;
      canvas.style.height = `${this.geometry.getCssHeight()}px`;
      context.setTransform(this.geometry.getDpr(), 0, 0, this.geometry.getDpr(), 0, 0);
    }

    this.backgroundPainter.paint(this.backgroundContext, this.geometry);
    this.overlayPainter.paint(this.overlayContext, this.geometry, this.renderState);
    this.paintInteraction();
  }

  sync(renderState: BoardRenderState): void {
    const nextHoverKey = this.isHoverValid(renderState, this.hoverKey) ? this.hoverKey : null;
    this.hoverKey = nextHoverKey;
    this.renderState = {
      ...renderState,
      hoveredKey: nextHoverKey,
    };

    if (!this.overlayContext) {
      return;
    }

    this.overlayPainter.paint(this.overlayContext, this.geometry, this.renderState);
    this.paintInteraction();
  }

  handlePointerMove(event: PointerLikeEvent): void {
    const target = this.resolveInteractiveTarget(event);
    const nextHoverKey = target?.key ?? null;
    this.updateCursor(Boolean(target));

    if (nextHoverKey === this.hoverKey) {
      return;
    }

    this.hoverKey = nextHoverKey;
    this.paintInteraction();
  }

  handlePointerLeave(): void {
    this.updateCursor(false);

    if (this.hoverKey === null) {
      return;
    }

    this.hoverKey = null;
    this.paintInteraction();
  }

  handleClick(event: PointerLikeEvent): void {
    const target = this.resolveInteractiveTarget(event);
    if (!target) {
      return;
    }

    this.onPlaceStone(target.x, target.y);
  }

  destroy(): void {
    this.updateCursor(false);
    this.backgroundContext = null;
    this.overlayContext = null;
    this.interactionContext = null;
    this.canvases = null;
    this.hoverKey = null;
    this.renderState = EMPTY_STATE;
  }

  private paintInteraction(): void {
    if (!this.interactionContext) {
      return;
    }

    this.interactionPainter.paint(this.interactionContext, this.geometry, {
      ...this.renderState,
      hoveredKey: this.hoverKey,
    });
  }

  private resolveInteractiveTarget(event: PointerLikeEvent): BoardHitTarget | null {
    if (!this.canvases) {
      return null;
    }

    const rect = this.canvases.interaction.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const target = this.geometry.pointToGrid(localX, localY);
    if (!target) {
      return null;
    }

    return this.isHoverValid(this.renderState, target.key) ? target : null;
  }

  private isHoverValid(
    renderState: BoardRenderState,
    hoverKey: BoardRenderState['hoveredKey'],
  ): hoverKey is NonNullable<BoardRenderState['hoveredKey']> {
    return this.interactionPainter.isInteractive(renderState, hoverKey);
  }

  private updateCursor(isPointer: boolean): void {
    if (this.canvases) {
      this.canvases.interaction.style.cursor = isPointer ? 'pointer' : 'default';
    }
  }
}
