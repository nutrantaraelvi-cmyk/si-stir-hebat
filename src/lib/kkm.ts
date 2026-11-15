export const KKM_DEFAULT = 75 as const

export type KetuntasanStatus = 'tuntas' | 'belum_tuntas' | 'belum_dinilai'

export function statusKetuntasan(skor: number | null | undefined, maksimum: number | null | undefined): KetuntasanStatus {
  if (skor === null || skor === undefined || Number.isNaN(skor)) return 'belum_dinilai'
  if (maksimum === null || maksimum === undefined || !Number.isFinite(maksimum) || maksimum <= 0) return 'belum_dinilai'
  if ((skor / maksimum) * 100 >= KKM_DEFAULT) return 'tuntas'
  return 'belum_tuntas'
}

export function labelKetuntasan(skor: number | null | undefined, maksimum: number | null | undefined) {
  const status = statusKetuntasan(skor, maksimum)
  return status === 'tuntas' ? 'Tuntas' : status === 'belum_tuntas' ? 'Belum tuntas' : 'Belum dinilai'
}
