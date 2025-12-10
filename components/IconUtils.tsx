

import React from 'react';
import { 
  Video, Image as ImageIcon, FileText, Mic, Box, Layers, 
  Camera, Music, PenTool, Brush, Palette, Monitor, Gamepad2, 
  Code, Terminal, Cpu, Database, Cloud, Zap, 
  Heart, Star, Flag, Bookmark, Map, Globe, Coffee, Aperture
} from 'lucide-react';

// Optimized to 27 Icons (3 rows of 9 in UI)
export const ICON_MAP: Record<string, React.ElementType> = {
  // Row 1
  'Video': Video,
  'Image': ImageIcon,
  'FileText': FileText,
  'Mic': Mic,
  'Box': Box,
  'Layers': Layers,
  'Star': Star,
  'PenTool': PenTool,
  'Brush': Brush,

  // Row 2
  'Palette': Palette,
  'Monitor': Monitor,
  'Gamepad': Gamepad2,
  'Code': Code,
  'Terminal': Terminal,
  'Cpu': Cpu,
  'Database': Database,
  'Cloud': Cloud,
  'Zap': Zap,

  // Row 3
  'Heart': Heart,
  'Flag': Flag,
  'Map': Map,
  'Globe': Globe,
  'Coffee': Coffee,
  'Bookmark': Bookmark,
  'Camera': Camera,
  'Music': Music,
  'Aperture': Aperture
};

// Optimized to 24 Colors (12 Distinct Hues x 2 Variants: Bright/Dark)
// Designed for 2 rows of 12
export const COLOR_PALETTE = [
  // Row 1: Brights (600)
  'bg-red-600', 
  'bg-orange-600', 
  'bg-amber-600', 
  'bg-lime-600',
  'bg-green-600', 
  'bg-emerald-600', 
  'bg-teal-600', 
  'bg-cyan-600',
  'bg-sky-600', 
  'bg-indigo-600', 
  'bg-violet-600', 
  'bg-pink-600',

  // Row 2: Darks (900)
  'bg-red-900', 
  'bg-orange-900', 
  'bg-amber-900', 
  'bg-lime-900',
  'bg-green-900', 
  'bg-emerald-900', 
  'bg-teal-900', 
  'bg-cyan-900',
  'bg-sky-900', 
  'bg-indigo-900', 
  'bg-violet-900', 
  'bg-pink-900'
];

export const DynamicIcon = React.memo(({ iconKey, className }: { iconKey: string, className?: string }) => {
  const IconComponent = ICON_MAP[iconKey] || Layers;
  return <IconComponent className={className} />;
});
