import Link from "next/link"
import styles from "./header.module.css"
import path from "path"

export function Header() {
  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3v12"></path>
                <path d="M18 9a3 3 0 0 0-3-3H7"></path>
                <path d="M3 9a3 3 0 0 0 3 3h11"></path>
                <path d="M18 21a3 3 0 0 1-3-3H7"></path>
                <path d="M3 15a3 3 0 0 1 3-3h11"></path>
              </svg>
            </div>
            <span className={styles.logoText}>RaizSábia</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/about" className={styles.navLink}>
              Sobre Nós
            </Link>
            <Link href="/contact" className={styles.navLink}>
              Contacte-nos
            </Link>
            <Link href="/admin" className={styles.navLink}>
              Admin
            </Link>
          </nav>

          <button className={styles.mobileMenuButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.mobileMenuIcon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
