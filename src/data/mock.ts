export interface MockPerson {
  id: string;
  platform: 'x';
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string;
}

export interface MockRecord {
  id: string;
  personId: string;
  content: string;
  sourceUrl: string | null;
  occurredAt: string | null;
  createdAt: string;
  imageUrl: string;
  sha256: string;
}

export const demoPerson: MockPerson = {
  id: 'person-demo',
  platform: 'x',
  handle: 'demo',
  displayName: '演示账号',
  avatarUrl: null,
  profileUrl: 'https://x.com/demo',
};

export const demoRecord: MockRecord = {
  id: 'demo',
  personId: demoPerson.id,
  content: '这是一条仅用于展示页面结构的 mock 记录，不对应真实账号、帖子或事件。',
  sourceUrl: null,
  occurredAt: '2026-09-18T09:00:00.000Z',
  createdAt: '2026-09-20T14:30:00.000Z',
  imageUrl: '/mock-record.svg',
  sha256: 'e48fd69cf35aab2165c7606f40167917efb43b42f5f3ae79241925c0db1a4aa7',
};

export const latestRecords: MockRecord[] = [demoRecord];

export function formatDate(value: string | null): string {
  if (!value) {
    return '未提供';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}
