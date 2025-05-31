import styles from "./hero-section.module.css"

export function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className="container">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Base de Dados das Plantas Medicinais de Moçambique</h1>
          <p className={styles.heroSubtitle}>
            Explore o conhecimento tradicional e científico sobre as plantas 
          </p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryButton}>Explorar Plantas</button>
            <button className={styles.secondaryButton}>Sobre o Projeto</button>
          </div>
        </div>
      </div>
    </section>
  )
}
