export interface PublicRecordRow {
  id: string;
  person_id: string;
  platform: 'x';
  handle: string;
  display_name: string;
  avatar_url: string | null;
  profile_url: string;
  content: string;
  source_url: string | null;
  occurred_at: string | null;
  submitted_at: string;
}

const PUBLIC_RECORDS_FOR_PERSON_SQL = `
  SELECT
    records.id,
    records.person_id,
    persons.platform,
    persons.handle,
    persons.display_name,
    persons.avatar_url,
    persons.profile_url,
    records.content,
    records.source_url,
    records.occurred_at,
    records.created_at AS submitted_at
  FROM records
  INNER JOIN persons ON persons.id = records.person_id
  WHERE records.person_id = ? AND records.status = 'published'
  ORDER BY COALESCE(records.occurred_at, records.created_at) DESC, records.created_at DESC
`;

export async function listPublishedRecordsForPerson(
  db: Pick<D1Database, 'prepare'>,
  personId: string,
): Promise<PublicRecordRow[]> {
  if (personId.trim().length === 0) {
    throw new Error('Person ID is required.');
  }

  const result = await db
    .prepare(PUBLIC_RECORDS_FOR_PERSON_SQL)
    .bind(personId)
    .all<PublicRecordRow>();
  return result.results;
}
