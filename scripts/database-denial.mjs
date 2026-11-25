// A gateway error (invalid API key or JWT) is not evidence of a database grant.
export async function isDatabasePermissionDenied(response) {
  if (![401, 403].includes(response.status)) return false
  const failure = await response.json().catch(() => null)
  return failure?.code === '42501'
}
