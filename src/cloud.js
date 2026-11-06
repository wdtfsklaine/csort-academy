import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const cloudConfigured = Boolean(url && key);
export const supabase = cloudConfigured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

export const CATALOG = [
  { kind: 'course', id: 'documents', label: 'Документы без переделок', detail: 'Пять практических уроков' },
  { kind: 'lab', id: 'timesheet', label: 'Спаси табель Самары' },
  { kind: 'lab', id: 'expenses', label: 'Заполни подотчёт' },
  { kind: 'lab', id: 'trip', label: 'Собери командировку' },
  { kind: 'lab', id: 'match', label: 'Назови документ' },
  { kind: 'lab', id: 'prize', label: 'Записка на премию' },
  { kind: 'lab', id: 'errors', label: 'Найди косяк' },
  { kind: 'lab', id: 'sort', label: 'Разложи документы по местам' }
];

export function progressFromRows(rows = []) {
  return {
    lessons: rows.filter(x => x.kind === 'lesson').map(x => x.item_id),
    labs: rows.filter(x => x.kind === 'lab').map(x => x.item_id),
    ai: rows.some(x => x.kind === 'ai' && x.item_id === 'source-check')
  };
}
export function hasAssignment(rows, kind, itemId) {
  return rows.some(x => x.kind === kind && x.item_id === itemId);
}
export async function fetchMyData(userId) {
  if (!supabase || !userId) throw new Error('База данных не подключена');
  const [p, a, r] = await Promise.all([
    supabase.from('profiles').select('id,display_name,department,role').eq('id', userId).single(),
    supabase.from('assignments').select('kind,item_id').eq('user_id', userId),
    supabase.from('learning_progress').select('kind,item_id,completed_at').eq('user_id', userId)
  ]);
  for (const result of [p, a, r]) if (result.error) throw result.error;
  return { profile: p.data, assignments: a.data || [], progress: progressFromRows(r.data) };
}
export async function saveCompletion(userId, kind, itemId) {
  if (!supabase || !userId) throw new Error('Войди в личный кабинет');
  const { error } = await supabase.from('learning_progress').upsert(
    { user_id: userId, kind, item_id: itemId },
    { onConflict: 'user_id,kind,item_id', ignoreDuplicates: true }
  );
  if (error) throw error;
}
