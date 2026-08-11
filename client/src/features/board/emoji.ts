export interface EmojiCategory {
  label: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Common',
    emojis: ['👍', '👎', '👏', '🙌', '🙏', '👌', '✌️', '🤝', '💪', '🙌', '👀', '🤔'],
  },
  {
    label: 'Smileys',
    emojis: ['😀', '😄', '😂', '🤣', '😊', '😍', '😅', '😭', '😡', '😴', '🤯', '🥳'],
  },
  {
    label: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✨', '🔥', '⭐'],
  },
  {
    label: 'Actions',
    emojis: ['✅', '❌', '⚠️', '🚨', '🚀', '🎉', '🎊', '📌', '🔔', '💤', '🛑', '🏁'],
  },
];
