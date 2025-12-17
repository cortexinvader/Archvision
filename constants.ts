
import { ShapeType, MaterialType } from './types';

export const GRID_SIZE = 20;
export const DEFAULT_WALL_HEIGHT = 120;

export interface PaletteItem {
  type: ShapeType;
  label: string;
  color: string;
  material: MaterialType;
  defaultSize: { w: number, h: number };
}

export const SHAPE_PALETTE: PaletteItem[] = [
  { type: 'room', label: 'Living Space', color: '#cbd5e1', material: 'plaster', defaultSize: { w: 160, h: 120 } },
  { type: 'wall', label: 'Main Wall', color: '#475569', material: 'brick', defaultSize: { w: 100, h: 10 } },
  { type: 'door', label: 'Oak Door', color: '#b45309', material: 'wood', defaultSize: { w: 40, h: 8 } },
  { type: 'window', label: 'Glass Window', color: '#bae6fd', material: 'glass', defaultSize: { w: 60, h: 6 } },
  { type: 'furniture', label: 'Master Bed', color: '#6366f1', material: 'metal', defaultSize: { w: 80, h: 100 } },
];

export const MATERIAL_COLORS: Record<MaterialType, string> = {
  plaster: '#f8fafc',
  wood: '#78350f',
  glass: '#bae6fd',
  brick: '#991b1b',
  stone: '#57534e',
  metal: '#475569'
};
