import { supabase } from './supabase'

function client() {
  if (!supabase) throw new Error('Облачная синхронизация ещё не настроена')
  return supabase
}

export async function submitTask(taskId: string): Promise<string> {
  const { data, error } = await client().rpc('submit_task', { p_task_id: taskId })
  if (error) throw new Error(error.message)
  if (typeof data !== 'string') throw new Error('Некорректный ответ сервера')
  return data
}

export async function reviewTask(submissionId: string, approve: boolean): Promise<'approved' | 'rejected'> {
  const { data, error } = await client().rpc('review_task', {
    p_submission_id: submissionId,
    p_approve: approve,
  })
  if (error) throw new Error(error.message)
  if (data !== 'approved' && data !== 'rejected') throw new Error('Некорректный ответ сервера')
  return data
}

export async function fetchPointBalance(childId: string): Promise<number> {
  const { data, error } = await client().from('point_ledger').select('delta').eq('child_id', childId)
  if (error) throw new Error(error.message)
  return (data ?? []).reduce((balance, entry) => balance + entry.delta, 0)
}
