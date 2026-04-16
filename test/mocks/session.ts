import { vi } from 'vitest'
import * as authModule from '@/lib/auth'

export type TestRol = 'ADMIN' | 'KASSIR' | 'OMBORCHI' | 'SOTUVCHI'

export function setSession(rol: TestRol = 'ADMIN', id = 'test-user-id') {
  vi.mocked(authModule.auth).mockResolvedValue({
    user: { id, name: 'Test User', email: 'test@test.uz', rol },
  } as any)
}

export function clearSession() {
  vi.mocked(authModule.auth).mockResolvedValue(null as any)
}
