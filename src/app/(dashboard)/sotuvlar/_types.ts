import type { TolovUsuli } from '@prisma/client'

export type Preset = 'bugun' | 'kecha' | 'oxirgi7' | 'shuOy' | 'otganOy' | 'maxsus'

export type BreakdownTab = 'kassirlar' | 'mijozlar' | 'tolov' | 'tovarlar' | 'soatlar'

export interface Filtrlar {
  dan: string    // ISO YYYY-MM-DD
  gacha: string  // ISO YYYY-MM-DD
  kassirId?: string
  mijozId?: string
  tolovUsuli?: TolovUsuli
  q?: string
  sort: 'sana' | 'yakuniySumma' | 'chekRaqami'
  order: 'asc' | 'desc'
  page: number
  limit: number
}

export interface AnalitikaJavobi {
  jamiSotuv: number
  jamiQaytarish: number
  sotuvSoni: number
  ortachaChek: number
  jamiFoyda: number
  jamiChegirma: number
  oldingiDavr: {
    jamiSotuv: number
    sotuvSoni: number
    ortachaChek: number
    jamiFoyda: number
  }
  kunlikGrafik: Array<{ sana: string; sotuv: number; sotuvSoni: number; oldingiSotuv: number }>
  kassirlar: Array<{
    kassirId: string
    ism: string
    sotuvSoni: number
    jami: number
    ortachaChek: number
    foyda: number
    qaytarishlarSoni: number
  }>
  mijozlar: Array<{
    mijozId: string
    ism: string
    telefon: string | null
    sotuvSoni: number
    jami: number
    nasiyaQoldiq: number
  }>
  tolovUsullari: Array<{ tolovUsuli: TolovUsuli; sotuvSoni: number; jami: number; ulush: number }>
  topTovarlar: Array<{ tovarId: string; nomi: string; birlik: string; miqdor: number; jami: number; foyda: number }>
  soatlar: Array<{ soat: number; sotuvSoni: number; jami: number }>
}

export interface SotuvQatori {
  id: string
  chekRaqami: string
  sana: string
  yakuniySumma: number
  chegirma: number
  tolovUsuli: TolovUsuli
  holati: string
  kassir: { ism: string }
  mijoz: { ism: string; telefon: string | null } | null
  tarkiblar: Array<{ tovar: { nomi: string; birlik: string }; miqdor: number; birlikNarxi: number; jami: number }>
  nasiya: { qoldiq: number; muddat: string | null; holati: string } | null
  qaytarishlar?: Array<{
    id: string
    jamiSumma: number
    sabab: string | null
    yaratilgan: string
    tarkiblar: Array<{ tovar: { nomi: string; birlik: string }; miqdor: number; birlikNarxi: number; jami: number }>
  }>
}
