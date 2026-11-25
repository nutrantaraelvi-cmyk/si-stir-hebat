import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { whatsappUrl } from '../../lib/whatsapp'

export function SchoolWhatsAppLink({ className = 'button secondary' }: { className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const client = supabase
    if (!client) return
    let active = true
    void client.from('school_settings').select('name,whatsapp_number').maybeSingle().then(({ data, error }) => {
      if (!active || error || !data) return
      const row = data as { name: string; whatsapp_number?: string }
      setUrl(whatsappUrl(row.whatsapp_number ?? '', row.name))
    }, () => { /* tombol opsional: abaikan kegagalan */ })
    return () => { active = false }
  }, [])
  if (!url) return null
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer">
    <MessageCircle aria-hidden="true" size={18} /> Hubungi sekolah via WhatsApp
  </a>
}
