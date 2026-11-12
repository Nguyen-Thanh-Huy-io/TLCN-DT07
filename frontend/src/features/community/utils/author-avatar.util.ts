export const AUTHOR_TINTS = [
  { bg: '#E5EFE6', ink: '#1E4620' },
  { bg: '#F2E5C9', ink: '#6B4E16' },
  { bg: '#E3EEF5', ink: '#144E75' },
  { bg: '#F4E1DF', ink: '#7A1F24' },
] as const;

export function getAuthorTint(name: string): { bg: string; ink: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AUTHOR_TINTS[hash % AUTHOR_TINTS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
