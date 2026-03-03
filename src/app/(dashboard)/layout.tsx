import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import { SidebarProvider } from '@/components/SidebarContext'
import DashboardContent from '@/components/layout/DashboardContent'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden bg-gray-50 dark:bg-neutral-950">
        <Sidebar />
        <DashboardContent>
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 transition-colors duration-200">
            {children}
          </main>
          <MobileNav />
        </DashboardContent>
      </div>
    </SidebarProvider>
  )
}
