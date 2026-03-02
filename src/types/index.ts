export type Rol = 'ADMIN' | 'KASSIR' | 'OMBORCHI'
export type Birlik = 'DONA' | 'KG' | 'LITR' | 'METR' | 'PACHKA' | 'QUTI'
export type TovarHolati = 'FAOL' | 'ARXIVLANGAN'
export type HarakatTuri = 'KIRIM' | 'CHIQIM' | 'QAYTARISH' | 'YOQOTISH'
export type TolovUsuli = 'NAQD' | 'KARTA' | 'ARALASH' | 'NASIYA'
export type SotuvHolati = 'YAKUNLANGAN' | 'BEKOR_QILINGAN'
export type NasiyaHolati = 'OCHIQ' | 'YOPILGAN' | 'MUDDATI_OTGAN'
export type XarajatKategoriya = 'IJARA' | 'MAOSH' | 'TRANSPORT' | 'KOMMUNAL' | 'BOSHQA'

export interface SavatItem {
  tovarId: string
  nomi: string
  birlikNarxi: number
  miqdor: number
  birlik: Birlik
  chegirma: number
  jami: number
  mavjudQoldiq: number
}
