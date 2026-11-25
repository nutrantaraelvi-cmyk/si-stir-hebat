export const referenceLimit = 1000

/** Jumlah baris yang diizinkan dan halaman berasal dari permintaan PostgREST yang sama. */
export function hasMoreReferences(result: { count: number | null; data: readonly unknown[] | null } | null) {
  const received = result?.data?.length ?? 0
  return (result?.count ?? received) > Math.min(received, referenceLimit)
}
