
export type ShapeType = 'wall' | 'room' | 'door' | 'window' | 'furniture';

export type MaterialType = 'plaster' | 'wood' | 'glass' | 'brick' | 'stone' | 'metal';

export interface HouseElement {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  material?: MaterialType;
  opacity?: number;
  label?: string;
  wallHeight?: number;
}

export type ViewMode = '2D' | '3D';

export interface HistoryState {
  past: HouseElement[][];
  present: HouseElement[];
  future: HouseElement[][];
}
