import { api } from './api.js'

const outlines = {}

export function loadOutlines(name) {
  outlines[name] ??= api(`/api/outlines/${name}`)
  return outlines[name]
}
