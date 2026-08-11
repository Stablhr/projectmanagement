export interface BoardBackground {
  id: string;
  name: string;
  type: 'color' | 'image';
  value: string;
}

export const BOARD_BACKGROUNDS: BoardBackground[] = [
  { id: 'bg-ink', name: 'Slate', type: 'color', value: '#1A2B2A' },
  { id: 'bg-teal', name: 'Deep Teal', type: 'color', value: '#0F4C45' },
  { id: 'bg-turquoise', name: 'Turquoise', type: 'color', value: '#99E1D9' },
  { id: 'bg-mid-teal', name: 'Mid Teal', type: 'color', value: '#4AAFA5' },
  { id: 'bg-amber', name: 'Amber', type: 'color', value: '#B45309' },
  { id: 'bg-sand', name: 'Sand', type: 'color', value: '#D6B57A' },
  { id: 'bg-charcoal', name: 'Charcoal', type: 'color', value: '#3D3F45' },
  {
    id: 'bg-dusk',
    name: 'Dusk',
    type: 'image',
    value: 'linear-gradient(135deg, #4AAFA5, #0F4C45)',
  },
  {
    id: 'bg-sunset',
    name: 'Sunset',
    type: 'image',
    value: 'linear-gradient(135deg, #2E8C83, #99E1D9)',
  },
  {
    id: 'bg-ocean',
    name: 'Ocean',
    type: 'image',
    value: 'linear-gradient(135deg, #1A2B2A, #4AAFA5)',
  },
  {
    id: 'bg-forest',
    name: 'Forest',
    type: 'image',
    value: 'linear-gradient(135deg, #1F9D6B, #51E898)',
  },
];

export const LABEL_COLORS = [
  { color: '#EB5A46', name: 'Red' },
  { color: '#FF9F1A', name: 'Orange' },
  { color: '#F2D600', name: 'Yellow' },
  { color: '#61BD4F', name: 'Green' },
  { color: '#51E898', name: 'Lime' },
  { color: '#00C2E0', name: 'Sky' },
  { color: '#0079BF', name: 'Blue' },
  { color: '#C377E0', name: 'Purple' },
  { color: '#FF78CB', name: 'Pink' },
  { color: '#344563', name: 'Black' },
];
