export async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || 'Something went wrong. Try again.')
  }
  return data
}
