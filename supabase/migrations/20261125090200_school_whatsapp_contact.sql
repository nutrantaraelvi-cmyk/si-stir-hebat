-- PRD 5.11: WhatsApp Click-to-Chat (fase awal). Nomor kontak resmi sekolah, bukan
-- nomor pribadi guru. Format internasional tanpa tanda plus, contoh 6281234567890.
-- Kosong berarti tombol tidak ditampilkan. Dibaca semua peran sekolah lewat
-- policy master_read yang sudah ada; hanya administrator yang mengubah.
begin;

alter table public.school_settings
  add column if not exists whatsapp_number text not null default ''
  constraint school_settings_whatsapp_number_check check (whatsapp_number = '' or whatsapp_number ~ '^62[0-9]{8,13}$');

grant update (whatsapp_number) on public.school_settings to authenticated;

commit;
