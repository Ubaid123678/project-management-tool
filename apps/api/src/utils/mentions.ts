const mentionRegex = /@([a-zA-Z0-9_]+)/g;

export const parseMentions = (content: string) => {
  const mentions: { username: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      username: match[1],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return mentions;
};
