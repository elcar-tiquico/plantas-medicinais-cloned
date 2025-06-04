"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import styles from "./admin-layout.module.css"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Verificar autenticação
  useEffect(() => {
    // Pular verificação na página de login
    if (pathname === "/admin/login") {
      return
    }

    // Verificar se o usuário está autenticado
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
    }
  }, [pathname, router])

  // Renderizar apenas o conteúdo para a página de login
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  // Layout para páginas administrativas autenticadas
  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <AdminHeader />
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  )
}
