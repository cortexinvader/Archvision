
import { ShapeType, ShapeVariant, MaterialType } from './types';

export const GRID_SIZE = 20;
export const DEFAULT_WALL_HEIGHT = 120;

export interface PaletteItem {
  type: ShapeType;
  variant: ShapeVariant;
  label: string;
  color: string;
  material: MaterialType;
  defaultSize: { w: number, h: number };
}

export const SHAPE_PALETTE: PaletteItem[] = [
  { type: 'room', variant: 'rect', label: 'Living Room', color: '#fef3c7', material: 'plaster', defaultSize: { w: 240, h: 180 } },
  { type: 'room', variant: 'rect', label: 'Master Bedroom', color: '#e0f2fe', material: 'plaster', defaultSize: { w: 180, h: 160 } },
  { type: 'room', variant: 'rect', label: 'Kitchen', color: '#f1f5f9', material: 'stone', defaultSize: { w: 160, h: 140 } },
  { type: 'room', variant: 'l-shape', label: 'L-Gallery', color: '#fae8ff', material: 'plaster', defaultSize: { w: 200, h: 200 } },
  { type: 'wall', variant: 'rect', label: 'Exterior Wall', color: '#1e293b', material: 'brick', defaultSize: { w: 100, h: 12 } },
  { type: 'door', variant: 'rect', label: 'Entrance Door', color: '#78350f', material: 'wood', defaultSize: { w: 50, h: 10 } },
  { type: 'window', variant: 'rect', label: 'Panoramic Window', color: '#bae6fd', material: 'glass', defaultSize: { w: 80, h: 6 } },
  { type: 'furniture', variant: 'rect', label: 'King Bed', color: '#6366f1', material: 'metal', defaultSize: { w: 100, h: 120 } },
  { type: 'furniture', variant: 'rect', label: 'Sofa Sectional', color: '#4ade80', material: 'plaster', defaultSize: { w: 140, h: 60 } },
  { type: 'furniture', variant: 'rect', label: 'Dining Table', color: '#fb923c', material: 'wood', defaultSize: { w: 100, h: 60 } },
];

export const MATERIAL_COLORS: Record<MaterialType, string> = {
  plaster: '#f8fafc',
  wood: '#78350f',
  glass: '#bae6fd',
  brick: '#991b1b',
  stone: '#57534e',
  metal: '#475569'
};
