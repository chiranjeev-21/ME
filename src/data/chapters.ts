export const CHAPTERS = [
  { id: 'opening', number: '01', title: 'Opening', caption: 'From orbit' },
  { id: 'identity', number: '02', title: 'Identity', caption: 'Who is building' },
  { id: 'journey', number: '03', title: 'Journey', caption: 'Where I have built' },
  { id: 'work', number: '04', title: 'Engineering & Work', caption: 'Selected work, side quests' },
  { id: 'beyond', number: '05', title: 'Beyond Code', caption: 'Music, games, after hours' },
  { id: 'contact', number: '06', title: 'Contact', caption: 'Send a signal' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === 'string' && CHAPTERS.some(chapter => chapter.id === value);
}
