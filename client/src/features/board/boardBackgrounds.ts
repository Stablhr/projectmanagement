export interface BoardBackground {
  id: string;
  name: string;
  type: 'color' | 'image';
  value: string;
}

export const BOARD_BACKGROUNDS: BoardBackground[] = [
  { id: 'bg-ink', name: 'Slate', type: 'color', value: '#2B3A45' },
  { id: 'bg-navy', name: 'Navy', type: 'color', value: '#274555' },
  { id: 'bg-turquoise', name: 'Turquoise', type: 'color', value: '#3AA7A0' },
  { id: 'bg-green', name: 'Green', type: 'color', value: '#4B9A6D' },
  { id: 'bg-lilac', name: 'Lilac', type: 'color', value: '#8F7BB8' },
  { id: 'bg-coral', name: 'Coral', type: 'color', value: '#D97A6A' },
  { id: 'bg-sand', name: 'Sand', type: 'color', value: '#D6B57A' },
  { id: 'bg-charcoal', name: 'Charcoal', type: 'color', value: '#3D3F45' },
  {
    id: 'bg-sunset',
    name: 'Sunset',
    type: 'image',
    value: 'linear-gradient(135deg, #FF9A8B, #FF6A88, #FF99AC)',
  },
  {
    id: 'bg-ocean',
    name: 'Ocean',
    type: 'image',
    value: 'linear-gradient(135deg, #1FA2FF, #12D8FA)',
  },
  {
    id: 'bg-forest',
    name: 'Forest',
    type: 'image',
    value: 'linear-gradient(135deg, #134E5E, #71B280)',
  },
  {
    id: 'bg-dusk',
    name: 'Dusk',
    type: 'image',
    value: 'linear-gradient(135deg, #4E54C8, #8F94FB)',
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
