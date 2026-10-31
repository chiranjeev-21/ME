export const CHAPTERS = [
  { id: 'opening', number: '01', title: 'Opening', caption: 'From orbit' },
  { id: 'identity', number: '02', title: 'Identity', caption: 'Who is building' },
  { id: 'journey', number: '03', title: 'Journey', caption: 'Where I have built' },
  { id: 'work', number: '04', title: 'Engineering & Work', caption: 'Selected work' },
  { id: 'lab', number: '05', title: 'Lab', caption: 'Experiments in progress' },
  { id: 'beyond', number: '06', title: 'Beyond Code', caption: 'Music, games, after hours' },
  { id: 'contact', number: '07', title: 'Contact', caption: 'Send a signal' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === 'string' && CHAPTERS.some(chapter => chapter.id === value);
}
