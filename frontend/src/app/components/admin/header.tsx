"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./header.module.css"

export function AdminHeader() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>Painel Administrativo</h1>
          </div>

          <div className={styles.actions}>
            {/* Botão de pesquisa */}
            <button className={styles.actionButton}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Botão de notificações */}
            <div className={styles.notificationsContainer}>
              <button
                className={styles.actionButton}
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen)
                  setIsProfileOpen(false)
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className={styles.notificationBadge}></span>
              </button>

              {isNotificationsOpen && (
                <div className={styles.notificationsDropdown}>
                  <div className={styles.notificationsHeader}>
                    <h3 className={styles.notificationsTitle}>Notificações</h3>
                  </div>
                  <div className={styles.notificationsList}>
                    <div className={styles.notificationItem}>
                      <div className={styles.notificationIconGreen}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.notificationSvg}
                        >
                          <path d="M6 3v12"></path>
                          <path d="M18 9a3 3 0 0 0-3-3H7"></path>
                          <path d="M3 9a3 3 0 0 0 3 3h11"></path>
                          <path d="M18 21a3 3 0 0 1-3-3H7"></path>
                          <path d="M3 15a3 3 0 0 1 3-3h11"></path>
                        </svg>
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationTitle}>Nova planta adicionada</p>
                        <p className={styles.notificationDesc}>Carqueja foi adicionada ao banco de dados</p>
                        <p className={styles.notificationTime}>Há 2 horas</p>
                      </div>
                    </div>
                    <div className={styles.notificationItem}>
                      <div className={styles.notificationIconBlue}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={styles.notificationSvg}
                        >
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationTitle}>Aumento nas pesquisas</p>
                        <p className={styles.notificationDesc}>As pesquisas aumentaram 25% esta semana</p>
                        <p className={styles.notificationTime}>Há 1 dia</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.notificationsFooter}>
                    <a href="#" className={styles.notificationsLink}>
                      Ver todas as notificações
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil do usuário */}
            <div className={styles.profileContainer}>
              <button
                className={styles.profileButton}
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen)
                  setIsNotificationsOpen(false)
                }}
              >
                <div className={styles.avatar}>A</div>
                <span className={styles.profileName}>Admin</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.profileArrow}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {isProfileOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/admin/profile" className={styles.profileLink}>
                    Seu Perfil
                  </Link>
                  <Link href="/admin/settings" className={styles.profileLink}>
                    Configurações
                  </Link>
                  <div className={styles.profileDivider}></div>
                  <Link href="/" className={styles.profileLink}>
                    Sair
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
