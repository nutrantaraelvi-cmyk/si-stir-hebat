// PRD 5.11 WhatsApp Click-to-Chat. Hanya sapaan umum yang dikirim ke WhatsApp;
// tidak ada nama murid atau data pribadi lain di URL.
export function whatsappUrl(number: string, schoolName: string): string | null {
  if (!/^62\d{8,13}$/.test(number)) return null
  const text = `Halo ${schoolName.trim() || 'sekolah'}, saya ingin bertanya.`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
