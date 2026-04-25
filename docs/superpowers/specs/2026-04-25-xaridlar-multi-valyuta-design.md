# Xaridlar — Multi-Valyuta (USD/UZS) Dizayni

**Sana:** 2026-04-25
**Mualif:** Claude + foydalanuvchi
**Status:** Draft

## 1. Maqsad

Xaridlar modulida ham **so'm (UZS)**, ham **dollar (USD)** valyutalarini qo'llab-quvvatlash. Ta'minotchidan dollar bilan tovar olinganda — dollar saqlanadi; so'mda olinganda — so'm saqlanadi. **Kurs (exchange rate) saqlanmaydi va aylantirilmaydi** — har valyuta o'zicha yashaydi.

## 2. Scope (qamrov)

### Ichida
- Xaridlar sahifasi (`/xaridlar`) — yangi xarid modali ichida tovar qo'shish
- Qarz qo'shish modali (yangi va mavjud xaridga qarz qo'shish)
- To'lov modali (xarid valyutasida)
- Jadvalda valyuta ko'rsatish, valyuta filtri
- Summary kartalar (so'mda jami qarz + USDda jami qarz alohida)
- API: `POST/GET /api/xaridlar`, `/tolov`, `/qarz` — valyutani qabul/qaytarish

### Tashqarisida (kelgusi)
- Tovarlar catalog (`/tovarlar`) — sotuv narxi, ombor qiymati
- Sotuv (kassa), Nasiyalar — ular hozircha so'mda qoladi
- Hisobotlar — alohida task
- Kurs (exchange rate) saqlash, valyutalar o'rtasida konvertatsiya

## 3. Asosiy tamoyillar

| # | Qoida |
|---|------|
| 1 | **Bitta xarid = bitta valyuta** — barcha tarkiblar shu valyutada |
| 2 | **Kurs saqlanmaydi** — UZS va USD bir-biriga aylantirilmaydi |
| 3 | **Qarz va to'lov xarid valyutasida** — boshqa valyutada to'lash mumkin emas |
| 4 | **Default UZS** — eski yozuvlar va default qiymat so'mda |
| 5 | **Per-currency rollup** — qarzlar har valyuta uchun alohida hisoblanadi |

## 4. Ma'lumotlar bazasi (schema)

### 4.1 Yangi enum

```prisma
enum Valyuta {
  UZS
  USD
}
```

### 4.2 Modellar

```prisma
model Xarid {
  // ... mavjud maydonlar
  valyuta  Valyuta  @default(UZS)
  // jamiSumma, tolangan, qoldiqQarz — hammasi shu valyutada
}

model XaridTarkibi {
  // ... mavjud maydonlar
  // valyuta saqlanmaydi — Xariddan meros oladi
  // birlikNarxi, jami — Xarid valyutasida
}

model XaridQarzTarixi {
  // ... mavjud maydonlar
  // valyuta saqlanmaydi — Xariddan meros oladi
  // summa — Xarid valyutasida
}

model XaridTolov {
  // ... mavjud maydonlar
  // valyuta saqlanmaydi — Xariddan meros oladi
  // summa — Xarid valyutasida
}
```

### 4.3 Migration

- Yangi `Valyuta` enum
- `Xarid.valyuta` ustuni `DEFAULT 'UZS'` bilan qo'shiladi
- Mavjud yozuvlar avtomatik `UZS` bo'ladi
- Indeks: `@@index([taminotchiId, valyuta])` — per-supplier per-currency rollup uchun

## 5. API

### 5.1 `POST /api/xaridlar` — yangi xarid

Body:
```json
{
  "taminotchiId": "...",
  "valyuta": "USD",          // yangi: "UZS" yoki "USD", default "UZS"
  "tarkiblar": [
    { "tovarNomi": "...", "miqdor": 2, "birlikNarxi": 50 }
  ],
  "tolangan": "100",
  "izoh": "..."
}
```

Validation:
- `valyuta` — `"UZS"` yoki `"USD"`, kiritilmasa `"UZS"`

### 5.2 `POST /api/xaridlar` — qarz rejimi (rejim: "qarz")

Body:
```json
{
  "rejim": "qarz",
  "taminotchiId": "...",
  "valyuta": "USD",          // yangi
  "qarzSumma": 50,
  "izoh": "..."
}
```

### 5.3 `GET /api/xaridlar?valyuta=USD`

Yangi query param: `valyuta=UZS|USD` — filtr.

Response: har xarid o'z `valyuta` maydoni bilan qaytadi.

### 5.4 `POST /api/xaridlar/[id]/tolov` va `/qarz`

Server xarid valyutasini bilib turadi — **mijoz valyutani yubormaydi**. Server javobida valyutani qaytaradi.

### 5.5 `GET /api/xaridlar/summary` — yangi endpoint

Response:
```json
{
  "uzsQarz": 3500000,
  "usdQarz": 250
}
```

Foydalanish: yuqoridagi summary kartalar uchun.

## 6. Frontend

### 6.1 Yangi util — `formatPul(summa, valyuta)`

`src/lib/utils.ts` ichiga:

```ts
export function formatPul(summa: number, valyuta: 'UZS' | 'USD' = 'UZS'): string {
  if (valyuta === 'USD') {
    return `$${summa.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }
  return `${formatSum(summa)} so'm`
}
```

Note: `formatSum` mavjud — uni saqlab qolamiz, `formatPul` yangi.

### 6.2 Xaridlar sahifasi (`/xaridlar`)

#### Toolbar
- Ta'minotchi filter — bor
- **Valyuta filter** — yangi (`Hammasi / So'm / Dollar`)
- Sana filterlar — bor
- Buttonlar — bor

#### Summary kartalar (yangi, toolbardan oldin)
```
┌────────────────────┐  ┌────────────────────┐
│ So'mda jami qarz   │  │ Dollarda jami qarz │
│ 3,500,000 so'm     │  │ $250               │
└────────────────────┘  └────────────────────┘
```

#### Jadval — qaror
- **Alohida "Valyuta" ustuni qo'shilmaydi.**
- Har bir summa `formatPul(summa, valyuta)` orqali o'z valyuta belgisi bilan ko'rsatiladi (`$150` yoki `150,000 so'm`).
- Ta'minotchi yonida kichik badge `[USD]` / `[UZS]` — tezroq aniqlash uchun (rangli: USD yashil, UZS ko'k).

#### Yangi xarid modali
1. Yuqorida valyuta toggle (segmented control):
   ```
   [ So'm (UZS) ] [ Dollar (USD) ]
   ```
2. Tarkib qatorlarida narx inputi yonida valyuta belgisi (`$` yoki `so'm`)
3. Jami summa shu valyutada hisoblanadi
4. To'langan input ham shu valyutada

#### Qarz modallari (yangi va mavjud)
- "Yangi qarz" modali — valyuta toggle yuqorida
- Mavjud xaridga qarz qo'shish modali — valyuta xariddan kelib chiqadi (toggle yo'q, faqat ko'rsatiladi)
- To'lov modali — valyuta xariddan, ko'rsatiladi xolos

### 6.3 MoneyInput komponenti

Hozir `MoneyInput` faqat raqam qabul qiladi. Yangi prop:
```ts
<MoneyInput valyuta="USD" ... />
```

Bu prop:
- Suffix sifatida `$` yoki `so'm` ko'rsatadi
- USD uchun decimal (2 ta) qabul qiladi, UZS uchun butun son
- Format ham unga qarab

## 7. Validation va edge case'lar

| Holat | Xulq |
|-------|------|
| Valyuta yuborilmadi | Default `UZS` |
| Noto'g'ri valyuta (`EUR`) | 400 xato: `Valyuta UZS yoki USD bo'lishi kerak` |
| Xarid USDda, to'lov uzs body'da | Server xarid valyutasini olib, yuborilgan summa shu valyutada deb qabul qiladi (mijoz valyuta yubormaydi) |
| Mavjud xaridga qarz qo'shish | Xarid valyutasida qabul qilinadi |
| Filter `valyuta=ALL` yoki bo'sh | Hammasi qaytadi |

## 8. UX prinsiplari

1. **Tushunarli vizual farq:** USD — `$` prefiks; UZS — ` so'm` suffiks. Foydalanuvchi adashmasin.
2. **Default UZS:** ko'p foydalanuvchi so'mda ishlaydi — modal ochilganda UZS tanlangan
3. **Xato oldini olish:** valyuta o'zgartirilsa, tarkiblar tozalanmaydi (faqat narx inputi suffiksi o'zgaradi)
4. **Aralashtirilmaslik:** USD va UZS hech qachon qo'shilib jami chiqarilmaydi. Hisobotlar va summary'da ham alohida.

## 9. Test rejasi

### Unit
- `formatPul('1000', 'USD')` → `'$1,000'`
- `formatPul('1000', 'UZS')` → `"1,000 so'm"`

### Integration (API)
- POST xarid USD valyutada — `valyuta: 'USD'` saqlanadi
- POST xarid valyutasiz — default `UZS`
- GET filter `?valyuta=USD` — faqat USD xaridlar qaytadi
- GET summary — alohida `uzsQarz` va `usdQarz`

### E2E (Playwright)
- USDda xarid yaratish, jadvalda `$` belgi bilan ko'rinishi
- USDda qarz qo'shish, summary'da `usdQarz` ortishi
- Valyuta filter ishlashi

## 10. Migratsiya rejasi

1. Schema migration ishga tushiriladi
2. `Xarid.valyuta` default `UZS` — eski yozuvlarga ta'sir yo'q
3. Frontend yangilanadi
4. Test ma'lumotlar (seed) ham UZSda — sinab ko'rishda foydalanuvchi USD xarid qo'shadi

## 11. Ochiq savollar

| Savol | Javob |
|-------|-------|
| Tovarlar (catalog) ham USD/UZS bo'ladimi? | Yo'q (kelajakda alohida task) |
| Sotuv (kassa) USD bo'ladimi? | Yo'q (kelajakda) |
| Nasiyalarda valyuta? | Yo'q (kelajakda) |
| Hisobotlar valyuta bo'yicha? | Yo'q (kelajakda) |

---

**Approval:** ushbu dizayn tasdiqlanganidan so'ng `writing-plans` skill orqali implementatsiya rejasi yaratiladi.
