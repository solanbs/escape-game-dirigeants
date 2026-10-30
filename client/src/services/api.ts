import type { AnswerRequest, AnswerResult } from '@escape/shared'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }

  return (await res.json()) as T
}

export const api = {
  ping: () => request<{ ok: boolean; uptime: number }>('/api/ping'),
  answer: (body: AnswerRequest) =>
    request<AnswerResult>('/api/answer', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
