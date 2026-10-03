// Keep the same request identity after a timeout or refresh.
export function pendingRequest(name: string) {
  const key = 'tempo-request-' + name;
  const saved = sessionStorage.getItem(key);
  if (saved) return saved;
  const value = crypto.randomUUID();
  sessionStorage.setItem(key, value);
  return value;
}
export function clearPendingRequest(name: string) {
  sessionStorage.removeItem('tempo-request-' + name);
}
