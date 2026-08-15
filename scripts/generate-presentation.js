/**
 * QaqNus222 ERP — Mijozlar uchun professional taqdimot
 * Run: node scripts/generate-presentation.js
 */

const pptxgen = require('pptxgenjs')

const COLORS = {
  navy: '1E2761',
  navyDark: '141B47',
  iceBlue: 'CADCFC',
  white: 'FFFFFF',
  offWhite: 'F8F9FB',
  green: '2E7D32',
  greenLight: 'E8F5E9',
  red: 'D32F2F',
  redLight: 'FFEBEE',
  amber: 'F57C00',
  amberLight: 'FFF3E0',
  teal: '028090',
  tealLight: 'E0F7FA',
  textDark: '212121',
  textMuted: '64748B',
  border: 'E2E8F0',
}

const FONT_HEAD = 'Arial Black'
const FONT_BODY = 'Calibri'

const pres = new pptxgen()
pres.layout = 'LAYOUT_WIDE' // 13.3" x 7.5"
pres.author = 'QaqNus Team'
pres.title = 'QaqNus222 ERP — Tizim taqdimoti'

const W = 13.3
const H = 7.5

// Helper: shadow factory (avoid shared object mutation)
const cardShadow = () => ({
  type: 'outer',
  color: '000000',
  blur: 8,
  offset: 2,
  angle: 90,
  opacity: 0.08,
})

// Helper: small badge
function addBadge(slide, x, y, text, fillColor, textColor) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 0.7, h: 0.28,
    fill: { color: fillColor },
    line: { color: fillColor },
    rectRadius: 0.04,
  })
  slide.addText(text, {
    x, y, w: 0.7, h: 0.28,
    fontSize: 9, fontFace: FONT_BODY, bold: true,
    color: textColor, align: 'center', valign: 'middle', margin: 0,
  })
}

// Helper: section card
function addSectionCard(slide, x, y, w, h, num, title, desc, accentColor = COLORS.teal) {
  // Card background
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
    shadow: cardShadow(),
  })
  // Left accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.08, h,
    fill: { color: accentColor },
    line: { color: accentColor },
  })
  // Number circle
  slide.addShape(pres.shapes.OVAL, {
    x: x + 0.2, y: y + 0.18, w: 0.42, h: 0.42,
    fill: { color: accentColor },
    line: { color: accentColor },
  })
  slide.addText(String(num), {
    x: x + 0.2, y: y + 0.18, w: 0.42, h: 0.42,
    fontSize: 14, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
  })
  // Title
  slide.addText(title, {
    x: x + 0.75, y: y + 0.15, w: w - 0.85, h: 0.4,
    fontSize: 14, fontFace: FONT_BODY, bold: true,
    color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
  })
  // Description
  slide.addText(desc, {
    x: x + 0.2, y: y + 0.7, w: w - 0.3, h: h - 0.85,
    fontSize: 10.5, fontFace: FONT_BODY,
    color: COLORS.textMuted, align: 'left', valign: 'top', margin: 0,
  })
}

// Helper: page header (slide title bar)
function addPageHeader(slide, title, subtitle) {
  // Top accent dot
  slide.addShape(pres.shapes.OVAL, {
    x: 0.5, y: 0.42, w: 0.12, h: 0.12,
    fill: { color: COLORS.teal }, line: { color: COLORS.teal },
  })
  // Title
  slide.addText(title, {
    x: 0.7, y: 0.3, w: W - 1.4, h: 0.5,
    fontSize: 26, fontFace: FONT_HEAD, bold: true,
    color: COLORS.navy, align: 'left', valign: 'middle', margin: 0,
  })
  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.7, y: 0.85, w: W - 1.4, h: 0.3,
      fontSize: 12, fontFace: FONT_BODY, italic: true,
      color: COLORS.textMuted, align: 'left', valign: 'top', margin: 0,
    })
  }
  // Page number / brand mark right side
  slide.addText('QaqNus222 ERP', {
    x: W - 2.5, y: 0.42, w: 2, h: 0.3,
    fontSize: 9, fontFace: FONT_BODY, bold: true, charSpacing: 3,
    color: COLORS.textMuted, align: 'right', valign: 'middle', margin: 0,
  })
  // Footer line
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: H - 0.4, w: W - 1, h: 0,
    line: { color: COLORS.border, width: 1 },
  })
  slide.addText('© QaqNus222 — Biznes boshqaruv tizimi', {
    x: 0.5, y: H - 0.35, w: W - 1, h: 0.25,
    fontSize: 8, fontFace: FONT_BODY,
    color: COLORS.textMuted, align: 'right', valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 1 — Title
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.navy }
  // Decorative accent (top-right corner triangle)
  s.addShape(pres.shapes.RECTANGLE, {
    x: W - 4, y: 0, w: 4, h: 0.18,
    fill: { color: COLORS.teal }, line: { color: COLORS.teal },
  })
  // Logo placeholder (Q in circle)
  s.addShape(pres.shapes.OVAL, {
    x: 0.8, y: 1.3, w: 1.4, h: 1.4,
    fill: { color: COLORS.teal }, line: { color: COLORS.teal },
  })
  s.addText('Q', {
    x: 0.8, y: 1.3, w: 1.4, h: 1.4,
    fontSize: 72, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
  })
  // Subtitle small
  s.addText('BIZNES BOSHQARUV TIZIMI', {
    x: 0.8, y: 3.0, w: 11, h: 0.4,
    fontSize: 13, fontFace: FONT_BODY, bold: true, charSpacing: 8,
    color: COLORS.iceBlue, align: 'left', valign: 'middle', margin: 0,
  })
  // Main title
  s.addText('QaqNus222', {
    x: 0.8, y: 3.4, w: 11, h: 1.2,
    fontSize: 84, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'left', valign: 'middle', margin: 0,
  })
  // Tagline
  s.addText('Do\'koningiz uchun to\'liq raqamli yechim', {
    x: 0.8, y: 4.7, w: 11, h: 0.5,
    fontSize: 22, fontFace: FONT_BODY, italic: true,
    color: COLORS.iceBlue, align: 'left', valign: 'middle', margin: 0,
  })
  // Bottom feature row
  const features = ['19 ta bo\'lim', 'Real-time hisobot', 'USD / UZS valyuta', 'Telegram bot']
  features.forEach((f, i) => {
    const x = 0.8 + i * 2.95
    s.addShape(pres.shapes.OVAL, {
      x: x, y: 6.2, w: 0.18, h: 0.18,
      fill: { color: COLORS.teal }, line: { color: COLORS.teal },
    })
    s.addText(f, {
      x: x + 0.25, y: 6.1, w: 2.7, h: 0.35,
      fontSize: 12, fontFace: FONT_BODY, bold: true,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0,
    })
  })
}

// =============================================================
// SLIDE 2 — Loyiha haqida
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Tizim nima qiladi?', 'Sizning biznesingizni boshidan oxirigacha boshqaradi')

  // Three big stat cards on top
  const stats = [
    { num: '19', label: 'Ta bo\'lim', color: COLORS.teal },
    { num: '50+', label: 'Funksiya', color: COLORS.green },
    { num: '24/7', label: 'Ishlash', color: COLORS.navy },
  ]
  stats.forEach((st, i) => {
    const x = 0.7 + i * 4.13
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.5, w: 3.9, h: 1.6,
      fill: { color: COLORS.white },
      line: { color: COLORS.border, width: 0.5 },
      shadow: cardShadow(),
    })
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.5, w: 3.9, h: 0.08,
      fill: { color: st.color }, line: { color: st.color },
    })
    s.addText(st.num, {
      x, y: 1.6, w: 3.9, h: 0.95,
      fontSize: 60, fontFace: FONT_HEAD, bold: true,
      color: st.color, align: 'center', valign: 'middle', margin: 0,
    })
    s.addText(st.label, {
      x, y: 2.55, w: 3.9, h: 0.5,
      fontSize: 14, fontFace: FONT_BODY,
      color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
    })
  })

  // Main description
  s.addText('Nimani hal qiladi?', {
    x: 0.7, y: 3.4, w: 12, h: 0.4,
    fontSize: 18, fontFace: FONT_HEAD, bold: true,
    color: COLORS.navy, align: 'left', valign: 'middle', margin: 0,
  })

  const features = [
    { title: 'Sotuv va kassa', desc: 'Tez kassa ekrani, chek chiqarish, qaytarish' },
    { title: 'Ombor nazorati', desc: 'Real-time qoldiq, kirim/chiqim, o\'tkazma' },
    { title: 'Nasiya boshqaruv', desc: 'Mijoz qarzlari, to\'lov muddati, eslatma' },
    { title: 'Hisobotlar', desc: 'Foyda, ABC tahlil, o\'lik qoldiq, valyuta bo\'yicha' },
  ]
  features.forEach((f, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.7 + col * 6.1
    const y = 3.9 + row * 1.55
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 5.85, h: 1.4,
      fill: { color: COLORS.white },
      line: { color: COLORS.border, width: 0.5 },
      shadow: cardShadow(),
    })
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.3, y: y + 0.4, w: 0.6, h: 0.6,
      fill: { color: COLORS.tealLight }, line: { color: COLORS.tealLight },
    })
    s.addText(String(i + 1), {
      x: x + 0.3, y: y + 0.4, w: 0.6, h: 0.6,
      fontSize: 22, fontFace: FONT_HEAD, bold: true,
      color: COLORS.teal, align: 'center', valign: 'middle', margin: 0,
    })
    s.addText(f.title, {
      x: x + 1.05, y: y + 0.3, w: 4.5, h: 0.4,
      fontSize: 14, fontFace: FONT_BODY, bold: true,
      color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
    })
    s.addText(f.desc, {
      x: x + 1.05, y: y + 0.7, w: 4.5, h: 0.6,
      fontSize: 11, fontFace: FONT_BODY,
      color: COLORS.textMuted, align: 'left', valign: 'top', margin: 0,
    })
  })
}

// =============================================================
// SLIDE 3 — 19 ta bo'lim umumiy ko'rinishi (grid)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, '19 ta bo\'lim — bir qarashda', 'Har bir bo\'lim — alohida funksiya, ammo bir tizimda birlashgan')

  const sections = [
    { num: 1, title: 'Login', color: COLORS.navy },
    { num: 2, title: 'Dashboard', color: COLORS.teal },
    { num: 3, title: 'Tovarlar', color: COLORS.green },
    { num: 4, title: 'Ombor', color: COLORS.green },
    { num: 5, title: 'Sotuv (kassa)', color: COLORS.red },
    { num: 6, title: 'Sotuvlar tarixi', color: COLORS.red },
    { num: 7, title: 'Xaridlar', color: COLORS.amber },
    { num: 8, title: 'Nasiyalar', color: COLORS.amber },
    { num: 9, title: 'Mijozlar', color: COLORS.teal },
    { num: 10, title: 'Sotuvchilar', color: COLORS.teal },
    { num: 11, title: 'Agentlar', color: COLORS.teal },
    { num: 12, title: 'Taminotchilar', color: COLORS.navy },
    { num: 13, title: 'Sheriklar', color: COLORS.navy },
    { num: 14, title: 'Sherikdan olish', color: COLORS.navy },
    { num: 15, title: 'Buyurtmalar', color: COLORS.green },
    { num: 16, title: 'Xarajatlar', color: COLORS.amber },
    { num: 17, title: 'Xabarlar', color: COLORS.teal },
    { num: 18, title: 'Hisobotlar', color: COLORS.red },
    { num: 19, title: 'Sozlamalar', color: COLORS.navy },
  ]

  // 5 cols x 4 rows grid
  const cols = 5
  const cellW = 2.4
  const cellH = 1.05
  const startX = 0.65
  const startY = 1.55
  const gapX = 0.13
  const gapY = 0.13

  sections.forEach((sec, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * (cellW + gapX)
    const y = startY + row * (cellH + gapY)

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cellW, h: cellH,
      fill: { color: COLORS.white },
      line: { color: COLORS.border, width: 0.5 },
      shadow: cardShadow(),
    })
    // Top color stripe
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cellW, h: 0.06,
      fill: { color: sec.color }, line: { color: sec.color },
    })
    // Number small
    s.addText(String(sec.num).padStart(2, '0'), {
      x: x + 0.15, y: y + 0.2, w: 0.6, h: 0.3,
      fontSize: 14, fontFace: FONT_HEAD, bold: true,
      color: sec.color, align: 'left', valign: 'middle', margin: 0,
    })
    // Title
    s.addText(sec.title, {
      x: x + 0.15, y: y + 0.5, w: cellW - 0.3, h: 0.45,
      fontSize: 13, fontFace: FONT_BODY, bold: true,
      color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
    })
  })

  // Color legend at bottom
  s.addText('Rang qo\'llanmasi:', {
    x: 0.65, y: 6.45, w: 1.7, h: 0.35,
    fontSize: 10, fontFace: FONT_BODY, bold: true,
    color: COLORS.textMuted, align: 'left', valign: 'middle', margin: 0,
  })
  const legend = [
    { color: COLORS.navy, label: 'Tizim' },
    { color: COLORS.teal, label: 'Foydalanuvchi' },
    { color: COLORS.green, label: 'Mahsulot' },
    { color: COLORS.red, label: 'Sotuv' },
    { color: COLORS.amber, label: 'Moliya' },
  ]
  legend.forEach((l, i) => {
    const x = 2.4 + i * 1.95
    s.addShape(pres.shapes.OVAL, {
      x: x, y: 6.5, w: 0.2, h: 0.2,
      fill: { color: l.color }, line: { color: l.color },
    })
    s.addText(l.label, {
      x: x + 0.25, y: 6.45, w: 1.5, h: 0.3,
      fontSize: 10, fontFace: FONT_BODY,
      color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
    })
  })
}

// =============================================================
// SLIDE 4 — Login + Dashboard
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Tizimga kirish va Bosh sahifa', 'Boshlanish va umumiy nazorat')

  // Card 1 — Login
  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 1, 'Tizimga kirish (Login)',
    'Foydalanuvchi tizimga kiradi va o\'z roliga (Admin, Kassir, Omborchi, Sotuvchi) qarab ko\'rishi mumkin bo\'lgan bo\'limlar avtomatik ochiladi.\n\nKim nima qila oladi:\n\n  • Email yoki telefon raqami bilan kirish\n  • Parolni unutgan bo\'lsa — tiklash\n  • Bir foydalanuvchi har bir do\'konga alohida kirishi\n  • Xavfsiz seans (30 kun)\n  • Avtomatik chiqish (xavfsizlik uchun)\n  • Telegram orqali tasdiqlash\n\nNega muhim: faqat ruxsat berilgan xodimlar tizimga kira oladi va har biri o\'z ishini ko\'radi. Boshqalarning ma\'lumoti ko\'rinmaydi.',
    COLORS.navy)

  // Card 2 — Dashboard
  addSectionCard(s, 6.85, 1.55, 6.0, 5.4, 2, 'Bosh sahifa (Dashboard)',
    'Do\'koningizning bugungi holati bir ekranda. Telefonni qo\'lga olishingiz bilan — bugun nima bo\'layotganini ko\'rasiz.\n\nKim nima qila oladi:\n\n  • Bugun nechta sotuv bo\'lganini ko\'rish\n  • Bugun qancha pul tushganini ko\'rish\n  • Eng ko\'p sotilgan tovarlarni ko\'rish\n  • Qaysi mijoz qancha qarz ekanini ko\'rish\n  • Ombor qoldig\'i tugayotgan tovarlarni ko\'rish\n  • Oyma-oy / haftalik diagramma\n\nNega muhim: do\'kon egasi ish joyida bo\'lmay turib ham, do\'konning real holatini telefondan ko\'ra oladi.',
    COLORS.teal)
}

// =============================================================
// SLIDE 5 — Tovarlar va Ombor
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Tovarlar va Ombor', 'Mahsulot katalogi va qoldiq nazorati')

  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 3, 'Tovarlar (Mahsulot katalogi)',
    'Do\'koningizdagi har bir mahsulotni alohida kartochka qilib saqlash.\n\nKim nima qila oladi:\n\n  • Yangi tovar qo\'shish (nomi, narxi, rasm)\n  • Shtrix-kod (barcode) bilan ishlash\n  • Tovarni kategoriyaga ajratish\n  • Sotuv narxi va xarid narxini saqlash\n  • Tovarni tahrirlash yoki o\'chirish\n  • Excel orqali yuzlab tovarni bir vaqtda yuklash\n  • Tovarni qidirish (nomi yoki kod orqali)\n  • Eski tovarni "arxivga" yuborish\n\nNega muhim: bir marta tovarni kiritsangiz, butun tizim — sotuv, ombor, hisobot — shu ma\'lumotdan foydalanadi.',
    COLORS.green)

  addSectionCard(s, 6.85, 1.55, 6.0, 5.4, 4, 'Ombor (Qoldiq nazorati)',
    'Har bir tovardan nechta dona bor — real vaqtda ko\'rinadi.\n\nKim nima qila oladi:\n\n  • Joriy qoldiqni ko\'rish (har tovar bo\'yicha)\n  • Kirim qilish — yangi tovar olib kelinganda\n  • Chiqim qilish — sotilganda yoki yo\'qotilganda\n  • Bir do\'kondan ikkinchisiga o\'tkazma\n  • Inventarizatsiya — fizik sanoq\n  • Spisaniye (yo\'qotish, buzilish)\n  • Tugab qolayotgan tovarlar haqida ogohlantirish\n  • Harakat tarixi (kim, qachon, nimani o\'zgartirgan)\n\nNega muhim: omborchi va kassir bir vaqtda ishlasa ham — qoldiq aniq. "Tovar bor" deb sotgan, keyin "yo\'q ekan" demaslik uchun.',
    COLORS.green)
}

// =============================================================
// SLIDE 6 — Sotuv (Kassa) + Sotuvlar tarixi
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Sotuv va Tarix', 'Kassa ekrani — biznesning yuragi')

  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 5, 'Sotuv (Kassa ekrani)',
    'Mijoz keldi → tovarni tanlang → pulni qabul qiling → chek bering. Hammasi 30 soniyada.\n\nKim nima qila oladi:\n\n  • Shtrix-kod skanerlash bilan tovar qo\'shish\n  • Qo\'lda tovar tanlash (qidiruv yoki ro\'yxatdan)\n  • Bir nechta tovarni bitta chekga jamlash\n  • Chegirma berish (foiz yoki summa)\n  • To\'lov: naqd, karta, aralash, nasiyaga\n  • Mijozni tanlash (nasiya uchun)\n  • Chek chiqarish (chop etish yoki SMS)\n  • Bekor qilish (xato bo\'lsa)\n\nNega muhim: tezroq sotuv = ko\'proq mijoz xizmati. Kassirni kompyuter eksperti bo\'lishi shart emas.',
    COLORS.red)

  addSectionCard(s, 6.85, 1.55, 6.0, 5.4, 6, 'Sotuvlar tarixi',
    'O\'tgan barcha savdolar — 1 yil oldin ham, kecha ham — bir joyda saqlanadi.\n\nKim nima qila oladi:\n\n  • Sana bo\'yicha filtrlash (bugun, bu hafta, oy)\n  • Kassir bo\'yicha filtrlash\n  • Mijoz bo\'yicha filtrlash\n  • Bitta chekni ochib ko\'rish\n  • Qaytarish (vozvrat) — tovarni qaytarib olish\n  • Chekni qayta chop etish\n  • Excel orqali eksport qilish\n  • Sotuvni o\'chirish (faqat egasi)\n\nNega muhim: "kim qachon nimani sotgan" savoliga bir bosishda javob. Soliq, audit, mijoz nizolari uchun isbot.',
    COLORS.red)
}

// =============================================================
// SLIDE 7 — Xaridlar (with USD/UZS)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Xaridlar — Ta\'minotchidan tovar olish', 'Endi USD va UZS ham qo\'llab-quvvatlanadi')

  // Big card on left
  addSectionCard(s, 0.65, 1.55, 7.5, 5.4, 7, 'Xaridlar boshqaruvi',
    'Ta\'minotchidan tovar olganda — qachon, qancha pul, qarzga yoki naqd, dollardami yoki so\'mda — hammasi yoziladi.\n\nKim nima qila oladi:\n\n  • Yangi xarid kiritish (tovarlar ro\'yxati bilan)\n  • Valyutani tanlash: SO\'M (UZS) yoki DOLLAR (USD)\n  • Bir qismini to\'lash, qolganini qarzga olish\n  • Mavjud qarzga to\'lov qabul qilish\n  • Yangi qarz yozish (tovarsiz, masalan pul qarz)\n  • Ta\'minotchini avtomatik qo\'shish\n  • Filtrlash: ta\'minotchi, valyuta, sana bo\'yicha\n  • Har bir xaridning batafsil tarkibini ko\'rish\n  • Xarid o\'chirish (xato bo\'lsa)\n\nNega muhim: chet eldan dollar bilan tovar olasizmi? Mahalliy ta\'minotchidan so\'mda? Endi ikkalasi ham aralashtirilmasdan saqlanadi.',
    COLORS.amber)

  // Right column — currency feature highlight
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.4, y: 1.55, w: 4.45, h: 5.4,
    fill: { color: COLORS.navy }, line: { color: COLORS.navy },
    shadow: cardShadow(),
  })
  s.addText('YANGI', {
    x: 8.4, y: 1.7, w: 4.45, h: 0.3,
    fontSize: 11, fontFace: FONT_BODY, bold: true, charSpacing: 4,
    color: COLORS.teal, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('Ikki valyuta', {
    x: 8.4, y: 2.05, w: 4.45, h: 0.55,
    fontSize: 26, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('USD va UZS — alohida hisob', {
    x: 8.4, y: 2.6, w: 4.45, h: 0.4,
    fontSize: 12, fontFace: FONT_BODY, italic: true,
    color: COLORS.iceBlue, align: 'center', valign: 'middle', margin: 0,
  })

  // UZS card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.65, y: 3.3, w: 3.95, h: 1.5,
    fill: { color: COLORS.white }, line: { color: COLORS.white },
  })
  s.addText('SO\'M qarz', {
    x: 8.65, y: 3.4, w: 3.95, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 3,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('3 500 000 so\'m', {
    x: 8.65, y: 3.7, w: 3.95, h: 0.7,
    fontSize: 22, fontFace: FONT_HEAD, bold: true,
    color: COLORS.navy, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('Mahalliy ta\'minotchilar', {
    x: 8.65, y: 4.4, w: 3.95, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })

  // USD card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.65, y: 4.95, w: 3.95, h: 1.5,
    fill: { color: COLORS.white }, line: { color: COLORS.white },
  })
  s.addText('DOLLAR qarz', {
    x: 8.65, y: 5.05, w: 3.95, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 3,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('$ 250', {
    x: 8.65, y: 5.35, w: 3.95, h: 0.7,
    fontSize: 22, fontFace: FONT_HEAD, bold: true,
    color: COLORS.green, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('Chet el ta\'minotchilar', {
    x: 8.65, y: 6.05, w: 3.95, h: 0.3,
    fontSize: 10, fontFace: FONT_BODY,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })

  // Bottom note
  s.addText('Aralashtirilmaydi — har valyuta o\'z hisobida', {
    x: 8.4, y: 6.5, w: 4.45, h: 0.4,
    fontSize: 10, fontFace: FONT_BODY, italic: true,
    color: COLORS.iceBlue, align: 'center', valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 8 — Nasiyalar
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Nasiyalar — Mijoz qarzlari', 'Kim, qancha, qachon to\'laydi — hammasi ko\'rinib turadi')

  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 8, 'Nasiya boshqaruv',
    'Mijozga tovar nasiyaga (qarzga) bersangiz — qancha pul qarzdor, qachon to\'lashi kerak, hammasi shu yerda.\n\nKim nima qila oladi:\n\n  • Yangi nasiya ochish (mijoz, summa, muddat)\n  • Bo\'lib-bo\'lib to\'lov qabul qilish\n  • To\'liq to\'lov qabul qilish\n  • Nasiya tarixini ko\'rish\n  • Muddati o\'tgan nasiyalarni ajratib ko\'rish\n  • Mijozga SMS / Telegram eslatma yuborish\n  • Nasiyalarni Excel\'ga eksport qilish\n  • Nasiyani bekor qilish (kelishuv bilan)\n\nNega muhim: mijoz "men to\'laganman" desa — sistema "yo\'q, qoldi" deb aniq isbotlaydi. Yo\'qotilgan pul yo\'q.',
    COLORS.amber)

  // Right — visual stats
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.85, y: 1.55, w: 6.0, h: 5.4,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
    shadow: cardShadow(),
  })
  s.addText('Nasiya hayot tsikli', {
    x: 7.0, y: 1.75, w: 5.7, h: 0.5,
    fontSize: 18, fontFace: FONT_HEAD, bold: true,
    color: COLORS.navy, align: 'left', valign: 'middle', margin: 0,
  })

  const steps = [
    { num: '1', title: 'Nasiya ochish', desc: 'Mijoz tovar oladi, summa va muddat belgilanadi', color: COLORS.teal },
    { num: '2', title: 'Holat: AKTIV', desc: 'Sistema kuzatadi, muddat keladi', color: COLORS.amber },
    { num: '3', title: 'To\'lov qabul', desc: 'Bo\'lib-bo\'lib yoki to\'liq to\'lov', color: COLORS.green },
    { num: '4', title: 'Holat: YOPILGAN', desc: 'To\'lov tugadi, mijoz haqi qolmadi', color: COLORS.navy },
  ]
  steps.forEach((st, i) => {
    const y = 2.5 + i * 1.05
    s.addShape(pres.shapes.OVAL, {
      x: 7.0, y, w: 0.55, h: 0.55,
      fill: { color: st.color }, line: { color: st.color },
    })
    s.addText(st.num, {
      x: 7.0, y, w: 0.55, h: 0.55,
      fontSize: 18, fontFace: FONT_HEAD, bold: true,
      color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
    })
    s.addText(st.title, {
      x: 7.7, y: y - 0.05, w: 4.9, h: 0.4,
      fontSize: 14, fontFace: FONT_BODY, bold: true,
      color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
    })
    s.addText(st.desc, {
      x: 7.7, y: y + 0.3, w: 4.9, h: 0.4,
      fontSize: 11, fontFace: FONT_BODY,
      color: COLORS.textMuted, align: 'left', valign: 'top', margin: 0,
    })
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: 7.27, y: y + 0.6, w: 0, h: 0.45,
        line: { color: COLORS.border, width: 1.5, dashType: 'dash' },
      })
    }
  })
}

// =============================================================
// SLIDE 9 — Mijozlar va xodimlar
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Mijozlar va Xodimlar', 'Sizning mijozingiz va sizning jamoangiz')

  const cards = [
    { num: 9, title: 'Mijozlar bazasi', desc: 'Har bir mijozni alohida kartochka:\n\n  • Ism, telefon, manzil\n  • Sotuv tarixi (qachon, nimani olgan)\n  • Joriy qarzi\n  • Tug\'ilgan kuni — bayram tabrigi uchun\n  • Mijozlarni Excel\'ga eksport\n\nMijoz qaytib kelganda — kim ekanini bilib, eski savdo tarixini ko\'rasiz.', color: COLORS.teal },
    { num: 10, title: 'Sotuvchilar', desc: 'Do\'kon ichidagi sotuvchi xodimlar:\n\n  • Yangi sotuvchi qo\'shish\n  • Har sotuvchining sotuv natijasi\n  • Qaysi sotuvchi qancha sotgani\n  • Bonus / foiz hisob-kitobi\n  • Sotuvchini bloklash (ish to\'xtatilganda)\n\nKim eng yaxshi ishlayotganini raqamlar bilan ko\'rasiz.', color: COLORS.teal },
    { num: 11, title: 'Agentlar', desc: 'Ko\'chada yurib mijoz topadigan agentlar:\n\n  • Yangi agent qo\'shish\n  • Agent topgan mijozlar\n  • Agent buyurtmalari\n  • Komissiya hisob-kitobi\n  • Agentning faollik darajasi\n\nDo\'kon ichida emas, tashqarida ishlovchilar uchun.', color: COLORS.teal },
  ]
  cards.forEach((c, i) => {
    const x = 0.5 + i * 4.27
    addSectionCard(s, x, 1.55, 4.07, 5.4, c.num, c.title, c.desc, c.color)
  })
}

// =============================================================
// SLIDE 10 — Hamkorlar (Taminotchi, Sherik, Sherikdan olish)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Hamkorlar tizimi', 'Ta\'minotchi, sherik do\'konlar — alohida boshqariladi')

  const cards = [
    { num: 12, title: 'Taminotchilar', desc: 'Sizga tovar yetkazib beruvchilar:\n\n  • Yangi ta\'minotchi qo\'shish\n  • Aloqa: telefon, manzil, kontakt shaxs\n  • Ta\'minotchi qarzi (siz qancha qarzdor)\n  • Xarid tarixi\n  • Eng faol ta\'minotchilar\n\nKimdan qancha tovar olganingizni va kimga qancha qarzdor ekanligingizni bir joyda ko\'rasiz.', color: COLORS.navy },
    { num: 13, title: 'Sheriklar', desc: 'Hamkor do\'konlar (boshqa do\'konlar):\n\n  • Sherik do\'kon qo\'shish\n  • Sherikning ombor qoldig\'ini ko\'rish\n  • O\'tkazma tarixi\n  • O\'zaro hisob-kitob\n  • Sherik qarzi\n\nMasalan: 2 ta filialingiz bor — har birini sherik sifatida qo\'shib, o\'rtada tovar yuborish.', color: COLORS.navy },
    { num: 14, title: 'Sherikdan olish', desc: 'Sherik do\'kondan tovar qabul qilish jarayoni:\n\n  • Yangi qabul yozish\n  • Tovarlar va miqdor\n  • To\'lov yoki qarz holati\n  • Sherikga qarz hisob-kitobi\n  • Tovar avtomatik omborga kiradi\n\nFilial 1 → Filial 2 ga tovar berdi — bu yerda yoziladi.', color: COLORS.navy },
  ]
  cards.forEach((c, i) => {
    const x = 0.5 + i * 4.27
    addSectionCard(s, x, 1.55, 4.07, 5.4, c.num, c.title, c.desc, c.color)
  })
}

// =============================================================
// SLIDE 11 — Buyurtmalar va Xarajatlar
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Buyurtmalar va Xarajatlar', 'Mijoz buyurtmasi va do\'kon chiqimlari')

  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 15, 'Buyurtmalar',
    'Mijoz oldindan buyurtma bersa — bu yerda yoziladi va kuzatib boriladi.\n\nKim nima qila oladi:\n\n  • Yangi buyurtma qabul qilish\n  • Mijoz va tovarlar ro\'yxati\n  • Buyurtma holati: KUTILMOQDA, TAYYOR, BERILGAN\n  • Sotuvchi yoki agent kim qabul qilganini\n  • Buyurtmani bekor qilish\n  • Buyurtmadan sotuv yaratish (oson o\'tish)\n  • Yetkazib berish manzili\n\nMisol: mijoz "ertaga 10 ta non kerak" desa — buyurtma yoziladi, ertaga chop etib beriladi. Yo\'qolmaydi.',
    COLORS.green)

  addSectionCard(s, 6.85, 1.55, 6.0, 5.4, 16, 'Xarajatlar',
    'Do\'koningiz har oy nimaga pul sarflaydi — ijara, elektr, maosh, yoqilg\'i va h.k.\n\nKim nima qila oladi:\n\n  • Yangi xarajat yozish\n  • Kategoriya: ijara, transport, maosh, soliq, kommunal\n  • Sana va summa\n  • Izoh va tegishli hujjat\n  • Oylik xarajatlar tahlili\n  • Kategoriya bo\'yicha grafika\n  • Xarajatni o\'chirish yoki tahrirlash\n\nNega muhim: "Daromad katta, lekin pul yo\'q" muammosini hal qiladi. Sof foyda = sotuvdan kelgan pul - xarajat.',
    COLORS.amber)
}

// =============================================================
// SLIDE 12 — Hisobotlar (the most important slide)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Hisobotlar — biznesingizning oynasi', 'Raqamlar yolg\'on gapirmaydi')

  // Big card title
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 1.55, w: 12.2, h: 5.4,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.5 },
    shadow: cardShadow(),
  })
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 1.55, w: 0.08, h: 5.4,
    fill: { color: COLORS.red }, line: { color: COLORS.red },
  })
  s.addShape(pres.shapes.OVAL, {
    x: 0.85, y: 1.75, w: 0.5, h: 0.5,
    fill: { color: COLORS.red }, line: { color: COLORS.red },
  })
  s.addText('18', {
    x: 0.85, y: 1.75, w: 0.5, h: 0.5,
    fontSize: 16, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
  })
  s.addText('7+ turdagi hisobotlar', {
    x: 1.5, y: 1.75, w: 11, h: 0.5,
    fontSize: 18, fontFace: FONT_BODY, bold: true,
    color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
  })

  // Grid of reports
  const reports = [
    { title: 'Sotuv dinamikasi', desc: 'Kun, hafta, oy bo\'yicha sotuv grafigi. O\'sish trendi ko\'rinadi.', color: COLORS.green },
    { title: 'Foyda tahlili', desc: 'Daromad - xarajat = sof foyda. Davr bo\'yicha taqqoslash.', color: COLORS.green },
    { title: 'ABC tahlil', desc: 'A — eng ko\'p sotiladi, B — o\'rtacha, C — kam. Qaysiga e\'tibor berish kerak.', color: COLORS.teal },
    { title: 'O\'lik qoldiq', desc: '30 / 60 / 90 kun sotilmagan tovarlar. Qaytarish yoki chegirma.', color: COLORS.amber },
    { title: 'Nasiya aging', desc: 'Mijoz qarzlari yoshi: 0-30 kun, 30-60, 60-90, 90+. Kechikkanlarga eslatma.', color: COLORS.red },
    { title: 'Qaytarishlar', desc: 'Qaysi tovar ko\'p qaytariladi. Sifat muammosi yoki noto\'g\'ri tavsif?', color: COLORS.amber },
    { title: 'Ta\'minotchi qarzi', desc: 'Siz qaysi ta\'minotchiga qancha qarzdorsiz. Valyuta bo\'yicha.', color: COLORS.navy },
  ]
  reports.forEach((r, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = 1.5 + col * 2.85
    const y = 2.6 + row * 2.05

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.6, h: 1.85,
      fill: { color: COLORS.offWhite },
      line: { color: COLORS.border, width: 0.5 },
    })
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.6, h: 0.06,
      fill: { color: r.color }, line: { color: r.color },
    })
    s.addText(r.title, {
      x: x + 0.15, y: y + 0.2, w: 2.3, h: 0.4,
      fontSize: 12, fontFace: FONT_BODY, bold: true,
      color: COLORS.textDark, align: 'left', valign: 'middle', margin: 0,
    })
    s.addText(r.desc, {
      x: x + 0.15, y: y + 0.65, w: 2.3, h: 1.1,
      fontSize: 9.5, fontFace: FONT_BODY,
      color: COLORS.textMuted, align: 'left', valign: 'top', margin: 0,
    })
  })
}

// =============================================================
// SLIDE 13 — Sozlamalar va Xabarlar
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Sozlamalar va Xabarlar', 'Tizimni o\'zingizga moslang')

  addSectionCard(s, 0.65, 1.55, 6.0, 5.4, 19, 'Sozlamalar',
    'Tizimni o\'z biznesingizga moslash va xodimlarni boshqarish.\n\nKim nima qila oladi:\n\n  • Yangi xodim (foydalanuvchi) qo\'shish\n  • Rolni belgilash: Admin, Kassir, Omborchi, Sotuvchi\n  • Har rolga huquq berish (kim nima ko\'radi)\n  • Do\'kon ma\'lumotlari (nomi, manzil, logotip)\n  • Chek shabloni (chiqishda ko\'rinadi)\n  • Valyuta sozlamalari\n  • Telegram bot ulash\n  • Backup (zaxira nusxa)\n\nMuhim: faqat egasi (admin) bu yerga kira oladi. Kassir bu yerni ko\'rmaydi.',
    COLORS.navy)

  addSectionCard(s, 6.85, 1.55, 6.0, 5.4, 17, 'Xabarlar (Telegram bot)',
    'Tizim avtomatik xabar yuboradi — siz pochta yoki Telegram\'da olasiz.\n\nKim nima qila oladi:\n\n  • Telegram bot orqali xabar olish\n  • Kunlik hisobot — har kuni 21:00 da\n  • Qarz muddati keldi — eslatma\n  • Tovar tugab qoldi — ogohlantirish\n  • Katta sotuv bo\'ldi — bildirishnoma\n  • Mijoz tug\'ilgan kuni\n  • Yangi xodim qo\'shildi — admin xabardor\n  • Eski xabarlar tarixi\n\nNega muhim: do\'kondan tashqarida bo\'lsangiz ham — muhim narsalardan xabardor. Telefonni qo\'lga olib turishingiz kerak emas.',
    COLORS.teal)
}

// =============================================================
// SLIDE 14 — BPMN: Sotuv jarayoni
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.offWhite }
  addPageHeader(s, 'Use Case: Sotuv jarayoni (BPMN)', 'Mijoz keldi → tovar oldi → ketdi. Sistema ichida nima sodir bo\'ladi.')

  // BPMN canvas
  // Lane 1: Mijoz
  // Lane 2: Kassir
  // Lane 3: Sistema

  const laneX = 1.4
  const laneW = 11.4
  const laneStartY = 1.4

  // Pool header
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: laneStartY, w: 0.7, h: 5.55,
    fill: { color: COLORS.navy }, line: { color: COLORS.navy },
  })
  s.addText('SOTUV JARAYONI', {
    x: 0.65, y: laneStartY, w: 0.7, h: 5.55,
    fontSize: 11, fontFace: FONT_BODY, bold: true, charSpacing: 4,
    color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
    rotate: 270,
  })

  const lanes = [
    { name: 'MIJOZ', color: COLORS.tealLight, textColor: COLORS.teal },
    { name: 'KASSIR', color: COLORS.amberLight, textColor: COLORS.amber },
    { name: 'SISTEMA', color: COLORS.iceBlue, textColor: COLORS.navy },
  ]
  const laneH = 1.85

  lanes.forEach((lane, i) => {
    const y = laneStartY + i * laneH
    // Lane label
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.35, y, w: 0.6, h: laneH,
      fill: { color: lane.color }, line: { color: COLORS.border, width: 0.5 },
    })
    s.addText(lane.name, {
      x: 1.35, y, w: 0.6, h: laneH,
      fontSize: 10, fontFace: FONT_BODY, bold: true, charSpacing: 3,
      color: lane.textColor, align: 'center', valign: 'middle', margin: 0,
      rotate: 270,
    })
    // Lane area
    s.addShape(pres.shapes.RECTANGLE, {
      x: 1.95, y, w: laneW - 0.55, h: laneH,
      fill: { color: COLORS.white }, line: { color: COLORS.border, width: 0.5 },
    })
  })

  // Helper: BPMN element coordinates (relative to lane area)
  // Lane area: x=1.95 to 12.8, each lane y starts at 1.4, 3.25, 5.1
  // Lane height = 1.85, center y = laneY + 0.925

  // Y-centers
  const yMijoz = laneStartY + laneH / 2 // 2.325
  const yKassir = laneStartY + laneH + laneH / 2 // 4.175
  const ySistema = laneStartY + 2 * laneH + laneH / 2 // 6.025

  // BPMN elements
  // Start event (circle) - Mijoz lane
  function startEvent(x, y) {
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.3, y: y - 0.3, w: 0.6, h: 0.6,
      fill: { color: COLORS.greenLight },
      line: { color: COLORS.green, width: 2 },
    })
  }
  // End event (circle, bold border)
  function endEvent(x, y) {
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.3, y: y - 0.3, w: 0.6, h: 0.6,
      fill: { color: COLORS.redLight },
      line: { color: COLORS.red, width: 4 },
    })
  }
  // Task (rounded rect)
  function task(x, y, label, color = COLORS.navy) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x - 0.7, y: y - 0.4, w: 1.4, h: 0.8,
      fill: { color: COLORS.white },
      line: { color: color, width: 1.5 },
      rectRadius: 0.08,
    })
    s.addText(label, {
      x: x - 0.7, y: y - 0.4, w: 1.4, h: 0.8,
      fontSize: 9, fontFace: FONT_BODY, bold: true,
      color: COLORS.textDark, align: 'center', valign: 'middle', margin: 0,
    })
  }
  // Gateway (diamond)
  function gateway(x, y, label) {
    // Use rectangle rotated 45deg or just OVAL? Best: a diamond via two triangles, but pptx only has standard shapes. Use a rotated rectangle.
    // Alternative: use the DIAMOND shape if available
    s.addShape(pres.shapes.DIAMOND, {
      x: x - 0.4, y: y - 0.4, w: 0.8, h: 0.8,
      fill: { color: COLORS.amberLight },
      line: { color: COLORS.amber, width: 2 },
    })
    s.addText('?', {
      x: x - 0.4, y: y - 0.4, w: 0.8, h: 0.8,
      fontSize: 18, fontFace: FONT_HEAD, bold: true,
      color: COLORS.amber, align: 'center', valign: 'middle', margin: 0,
    })
    if (label) {
      s.addText(label, {
        x: x - 0.7, y: y + 0.45, w: 1.4, h: 0.3,
        fontSize: 8, fontFace: FONT_BODY, italic: true,
        color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
      })
    }
  }
  // Arrow
  function arrow(x1, y1, x2, y2, label) {
    // simple line — pptx doesn't have arrowheads in addShape line, so add small triangle at end
    s.addShape(pres.shapes.LINE, {
      x: x1, y: y1, w: x2 - x1, h: y2 - y1,
      line: { color: COLORS.textMuted, width: 1.5, endArrowType: 'triangle' },
    })
    if (label) {
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      s.addText(label, {
        x: mx - 0.5, y: my - 0.15, w: 1.0, h: 0.3,
        fontSize: 8, fontFace: FONT_BODY, italic: true,
        color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
      })
    }
  }

  // Layout: 7 columns, each step shifts right; vertical jumps between lanes when handoff occurs
  const C = { c1: 2.7, c2: 4.2, c3: 5.9, c4: 7.6, c5: 9.2, c6: 10.7, c7: 12.2 }

  // STEP 1 — Mijoz: keladi (start)
  startEvent(C.c1, yMijoz)
  s.addText('Mijoz keladi', {
    x: C.c1 - 0.7, y: yMijoz + 0.35, w: 1.4, h: 0.3,
    fontSize: 8, fontFace: FONT_BODY, italic: true,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })

  // STEP 2 — Mijoz: Tovarni tanlaydi
  task(C.c2, yMijoz, 'Tovarni\ntanlaydi', COLORS.teal)

  // STEP 3 — Kassir: Shtrix-kod (directly below Tovarni tanlaydi)
  task(C.c2, yKassir, 'Shtrix-kod\nskanerlash', COLORS.amber)

  // STEP 4 — Sistema: Qidirish
  task(C.c3, ySistema, 'Tovar va qoldiq\nqidirish', COLORS.navy)

  // STEP 5 — Sistema: Gateway
  gateway(C.c4, ySistema, 'Qoldiq bor?')

  // STEP 6 — Kassir: Chekka qo'shish (jump up to kassir lane)
  task(C.c5, yKassir, 'Chekka\nqo\'shish', COLORS.amber)

  // STEP 7 — Kassir: To'lov qabul qilish (naqd/karta)
  task(C.c6, yKassir, 'To\'lov\nqabul qilish', COLORS.amber)

  // STEP 8 — Sistema: Chek va stok yangilash
  task(C.c7, ySistema, 'Chek va\nstok yangilash', COLORS.navy)

  // STEP 9 — End event in MIJOZ lane (above STEP 8)
  endEvent(C.c7, yMijoz)
  s.addText('Mijoz ketadi', {
    x: C.c7 - 0.7, y: yMijoz + 0.35, w: 1.4, h: 0.3,
    fontSize: 8, fontFace: FONT_BODY, italic: true,
    color: COLORS.textMuted, align: 'center', valign: 'middle', margin: 0,
  })

  // ARROWS — clean horizontal/vertical/diagonal flow
  // 1. Start → Tovar tanlaydi (horizontal)
  arrow(C.c1 + 0.3, yMijoz, C.c2 - 0.7, yMijoz)
  // 2. Tovar tanlaydi → Shtrix-kod (vertical down within column 2)
  arrow(C.c2, yMijoz + 0.4, C.c2, yKassir - 0.4)
  // 3. Shtrix-kod → Qidirish (diagonal down-right)
  arrow(C.c2 + 0.7, yKassir + 0.2, C.c3 - 0.7, ySistema - 0.2)
  // 4. Qidirish → Gateway (horizontal)
  arrow(C.c3 + 0.7, ySistema, C.c4 - 0.4, ySistema)
  // 5. Gateway "Ha" → Chekka qo'shish (diagonal up-right)
  arrow(C.c4 + 0.4, ySistema - 0.2, C.c5 - 0.7, yKassir + 0.2, 'Ha')
  // 6. Chekka → To'lov qabul (horizontal in kassir lane)
  arrow(C.c5 + 0.7, yKassir, C.c6 - 0.7, yKassir)
  // 7. To'lov → Chek va stok (diagonal down-right)
  arrow(C.c6 + 0.7, yKassir + 0.2, C.c7 - 0.7, ySistema - 0.2)
  // 8. Chek va stok → End (vertical up within column 7)
  arrow(C.c7, ySistema - 0.4, C.c7, yMijoz + 0.3)

  // Legend at bottom
  s.addText('Belgi qo\'llanmasi:', {
    x: 0.65, y: 7.0, w: 1.7, h: 0.3,
    fontSize: 9, fontFace: FONT_BODY, bold: true,
    color: COLORS.textMuted, align: 'left', valign: 'middle', margin: 0,
  })
  // Start
  s.addShape(pres.shapes.OVAL, {
    x: 2.5, y: 7.05, w: 0.2, h: 0.2,
    fill: { color: COLORS.greenLight },
    line: { color: COLORS.green, width: 1.5 },
  })
  s.addText('Boshlanish', { x: 2.75, y: 7.0, w: 1.3, h: 0.3, fontSize: 9, fontFace: FONT_BODY, color: COLORS.textDark, valign: 'middle', margin: 0 })
  // Task
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.1, y: 7.0, w: 0.4, h: 0.3,
    fill: { color: COLORS.white }, line: { color: COLORS.navy, width: 1 }, rectRadius: 0.05,
  })
  s.addText('Vazifa', { x: 4.55, y: 7.0, w: 1.0, h: 0.3, fontSize: 9, fontFace: FONT_BODY, color: COLORS.textDark, valign: 'middle', margin: 0 })
  // Gateway
  s.addShape(pres.shapes.DIAMOND, {
    x: 5.7, y: 7.0, w: 0.3, h: 0.3,
    fill: { color: COLORS.amberLight }, line: { color: COLORS.amber, width: 1 },
  })
  s.addText('Tanlov', { x: 6.05, y: 7.0, w: 1.0, h: 0.3, fontSize: 9, fontFace: FONT_BODY, color: COLORS.textDark, valign: 'middle', margin: 0 })
  // End
  s.addShape(pres.shapes.OVAL, {
    x: 7.2, y: 7.05, w: 0.2, h: 0.2,
    fill: { color: COLORS.redLight }, line: { color: COLORS.red, width: 2.5 },
  })
  s.addText('Tugash', { x: 7.45, y: 7.0, w: 1.0, h: 0.3, fontSize: 9, fontFace: FONT_BODY, color: COLORS.textDark, valign: 'middle', margin: 0 })
}

// =============================================================
// SLIDE 15 — Foyda va xulosa
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: COLORS.navy }

  // Title
  s.addText('Nega QaqNus222?', {
    x: 0.7, y: 0.7, w: 12, h: 0.7,
    fontSize: 32, fontFace: FONT_HEAD, bold: true,
    color: COLORS.white, align: 'left', valign: 'middle', margin: 0,
  })
  s.addText('5 ta asosiy foyda', {
    x: 0.7, y: 1.4, w: 12, h: 0.4,
    fontSize: 14, fontFace: FONT_BODY, italic: true,
    color: COLORS.iceBlue, align: 'left', valign: 'middle', margin: 0,
  })

  const benefits = [
    { num: '1', title: 'Tezlik', desc: 'Sotuv 30 soniyada. Hisobot bir bosishda. Vaqt — pul.' },
    { num: '2', title: 'Aniqlik', desc: 'Kassir xato qila olmaydi. Sistema har raqamni tekshiradi.' },
    { num: '3', title: 'Ko\'rinish', desc: 'Do\'koningiz holati telefoningizda. 24/7. Istalgan joydan.' },
    { num: '4', title: 'Boshqaruv', desc: 'Xodimlar nima qilayotganini ko\'rasiz. Yo\'qotilgan pul yo\'q.' },
    { num: '5', title: 'O\'sish', desc: 'Hisobotlar — qaerda yaxshi, qaerda yomon ekanini ko\'rsatadi.' },
  ]

  benefits.forEach((b, i) => {
    const y = 2.2 + i * 0.95
    s.addShape(pres.shapes.OVAL, {
      x: 0.7, y, w: 0.7, h: 0.7,
      fill: { color: COLORS.teal }, line: { color: COLORS.teal },
    })
    s.addText(b.num, {
      x: 0.7, y, w: 0.7, h: 0.7,
      fontSize: 28, fontFace: FONT_HEAD, bold: true,
      color: COLORS.white, align: 'center', valign: 'middle', margin: 0,
    })
    s.addText(b.title, {
      x: 1.6, y, w: 3, h: 0.4,
      fontSize: 18, fontFace: FONT_BODY, bold: true,
      color: COLORS.white, align: 'left', valign: 'middle', margin: 0,
    })
    s.addText(b.desc, {
      x: 1.6, y: y + 0.35, w: 11, h: 0.4,
      fontSize: 13, fontFace: FONT_BODY,
      color: COLORS.iceBlue, align: 'left', valign: 'middle', margin: 0,
    })
  })

  // Bottom CTA
  s.addShape(pres.shapes.LINE, {
    x: 0.7, y: H - 0.7, w: W - 1.4, h: 0,
    line: { color: COLORS.teal, width: 2 },
  })
  s.addText('Demo so\'rang — savollarga javob beramiz.', {
    x: 0.7, y: H - 0.55, w: W - 1.4, h: 0.4,
    fontSize: 13, fontFace: FONT_BODY, italic: true,
    color: COLORS.iceBlue, align: 'right', valign: 'middle', margin: 0,
  })
}

// Save
pres.writeFile({ fileName: 'docs/presentations/qaqnus222-mijozlar-uchun.pptx' })
  .then(filename => console.log('Saved:', filename))
  .catch(err => { console.error('Error:', err); process.exit(1) })
