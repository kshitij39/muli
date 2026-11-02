export async function api(path, options = {}) {
  const form = options.body instanceof FormData
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers: options.body && !form ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body && !form ? JSON.stringify(options.body) : options.body,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Something went wrong. Try again.')
  }
  return data
}
