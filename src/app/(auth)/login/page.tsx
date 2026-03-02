import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  let dokonNomi = 'Optimum'
  try {
    const sozlama = await prisma.sozlama.findUnique({ where: { kalit: 'dokon_nomi' } })
    if (sozlama?.qiymat) dokonNomi = sozlama.qiymat
  } catch {
    // DB xatosi bo'lsa standart nom ishlatiladi
  }

  return (
    <div className="min-h-screen flex">

      {/* Chap panel — brending */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background dekor */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] bg-black/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full" />
        </div>
        {/* Kontent */}
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center mb-8 bg-white/10 backdrop-blur-sm rounded-3xl p-6">
            <Image
              src="/logo.png"
              alt={dokonNomi}
              width={180}
              height={72}
              className="object-contain max-h-18 w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{dokonNomi}</h1>
          <p className="text-red-200 text-base leading-relaxed max-w-xs mx-auto">
            Do&apos;kon boshqaruv tizimi — sotuv, ombor, hisobot
          </p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {[
              'Sotuv va kassa boshqaruvi',
              'Ombor va tovar hisobi',
              'Moliyaviy hisobotlar',
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* O'ng panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-neutral-950">

        <div className="w-full max-w-[380px]">
          <LoginForm />
        </div>

        <p className="mt-8 text-gray-400 dark:text-gray-600 text-xs">
          © {new Date().getFullYear()} {dokonNomi}
        </p>
      </div>

    </div>
  )
}
