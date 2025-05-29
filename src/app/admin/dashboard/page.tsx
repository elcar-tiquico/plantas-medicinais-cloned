"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./dashboard.module.css"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Dados simulados para o dashboard
  const stats = [
    {
      name: "Total de Plantas",
      value: "1,284",
      change: "+12.5%",
      changeType: "increase",
      icon: (
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
          className={styles.iconGreen}
        >
          <path d="M6 3v12"></path>
          <path d="M18 9a3 3 0 0 0-3-3H7"></path>
          <path d="M3 9a3 3 0 0 0 3 3h11"></path>
          <path d="M18 21a3 3 0 0 1-3-3H7"></path>
          <path d="M3 15a3 3 0 0 1 3-3h11"></path>
        </svg>
      ),
    },
    {
      name: "Famílias Botânicas",
      value: "87",
      change: "+4.6%",
      changeType: "increase",
      icon: (
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
          className={styles.iconPurple}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      name: "Idiomas Disponíveis",
      value: "3",
      change: "+50%",
      changeType: "increase",
      icon: (
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
          className={styles.iconBlue}
        >
          <path d="m5 8 6 6"></path>
          <path d="m4 14 6-6 2-3"></path>
          <path d="M2 5h12"></path>
          <path d="M7 2h1"></path>
          <path d="m22 22-5-10-5 10"></path>
          <path d="M14 18h6"></path>
        </svg>
      ),
    },
    {
      name: "Pesquisas Realizadas",
      value: "24,389",
      change: "+18.2%",
      changeType: "increase",
      icon: (
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
          className={styles.iconYellow}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      ),
    },
  ]

  // Dados simulados para o gráfico de plantas por família
  const plantsByFamily = [
    { name: "ASTERACEAE", count: 245, percentage: 19 },
    { name: "FABACEAE", count: 187, percentage: 15 },
    { name: "LAMIACEAE", count: 156, percentage: 12 },
    { name: "RUBIACEAE", count: 124, percentage: 10 },
    { name: "EUPHORBIACEAE", count: 98, percentage: 8 },
    { name: "Outras", count: 474, percentage: 36 },
  ]

  // Dados simulados para o mapa de Moçambique
  const locationData = [
    { name: "Maputo", count: 156, percentage: 25 },
    { name: "Gaza", count: 98, percentage: 15 },
    { name: "Inhambane", count: 87, percentage: 14 },
    { name: "Sofala", count: 76, percentage: 12 },
    { name: "Manica", count: 65, percentage: 10 },
    { name: "Tete", count: 54, percentage: 8 },
    { name: "Zambézia", count: 43, percentage: 7 },
    { name: "Nampula", count: 32, percentage: 5 },
    { name: "Cabo Delgado", count: 21, percentage: 3 },
    { name: "Niassa", count: 10, percentage: 1 },
  ]

  // Dados simulados para plantas por idioma
  const plantsByLanguage = [
    { language: "Português", count: 1284, percentage: 100 },
    { language: "Xangana", count: 876, percentage: 68 },
    { language: "Xopeee", count: 542, percentage: 42 },
  ]

  // Dados simulados para plantas recentes
  const recentPlants = [
    {
      id: 1,
      name: "Carqueja",
      scientificName: "Baccharis crispa Spreng.",
      family: "ASTERACEAE",
      addedAt: "2023-05-15",
    },
    {
      id: 2,
      name: "Aroeira",
      scientificName: "Schinus terebinthifolia Raddi",
      family: "ANACARDIACEAE",
      addedAt: "2023-05-12",
    },
    {
      id: 3,
      name: "Quebra-pedra",
      scientificName: "Phyllanthus niruri L.",
      family: "PHYLLANTHACEAE",
      addedAt: "2023-05-10",
    },
    {
      id: 4,
      name: "Espinheira-santa",
      scientificName: "Maytenus ilicifolia Mart. ex Reissek",
      family: "CELASTRACEAE",
      addedAt: "2023-05-08",
    },
    {
      id: 5,
      name: "Guaco",
      scientificName: "Mikania glomerata Spreng.",
      family: "ASTERACEAE",
      addedAt: "2023-05-05",
    },
  ]

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Dashboard</h1>
        <div className={styles.actionButtons}>
          <button className={styles.exportButton}>
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
              className={styles.buttonIcon}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar Relatório
          </button>
          <button className={styles.addButton}>
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
              className={styles.buttonIcon}
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Adicionar Planta
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.name} className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <div className={styles.statName}>{stat.name}</div>
                <div className={styles.statValue}>{stat.value}</div>
              </div>
            </div>
            <div className={styles.statFooter}>
              <div className={styles.statChange}>
                <span className={stat.changeType === "increase" ? styles.statIncrease : styles.statDecrease}>
                  {stat.change}
                </span>{" "}
                <span className={styles.statPeriod}>desde o mês passado</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <nav className={styles.tabsNav}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`${styles.tabButton} ${activeTab === "overview" ? styles.activeTab : ""}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`${styles.tabButton} ${activeTab === "categories" ? styles.activeTab : ""}`}
            >
              Categorias/Famílias
            </button>
            <button
              onClick={() => setActiveTab("languages")}
              className={`${styles.tabButton} ${activeTab === "languages" ? styles.activeTab : ""}`}
            >
              Idiomas
            </button>
            <button
              onClick={() => setActiveTab("locations")}
              className={`${styles.tabButton} ${activeTab === "locations" ? styles.activeTab : ""}`}
            >
              Locais de Colheita
            </button>
          </nav>
        </div>

        <div className={styles.tabContent}>
          {/* Visão Geral */}
          {activeTab === "overview" && (
            <div className={styles.overviewTab}>
              <h3 className={styles.tabTitle}>Visão Geral do Sistema</h3>
              <p className={styles.tabDescription}>
                Bem-vindo ao painel administrativo do RaizSábia. Aqui você pode gerenciar todas as plantas, categorias,
                idiomas e locais de colheita do sistema.
              </p>

              <div className={styles.recentPlantsSection}>
                <h4 className={styles.sectionTitle}>Plantas Recentemente Adicionadas</h4>
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead className={styles.tableHeader}>
                      <tr>
                        <th className={styles.tableHeaderCell}>Nome</th>
                        <th className={styles.tableHeaderCell}>Nome Científico</th>
                        <th className={styles.tableHeaderCell}>Família</th>
                        <th className={styles.tableHeaderCell}>Data de Adição</th>
                        <th className={styles.tableHeaderCell}>
                          <span className={styles.srOnly}>Editar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {recentPlants.map((plant) => (
                        <tr key={plant.id} className={styles.tableRow}>
                          <td className={styles.tableCell}>{plant.name}</td>
                          <td className={styles.tableCell}>
                            <em>{plant.scientificName}</em>
                          </td>
                          <td className={styles.tableCell}>{plant.family}</td>
                          <td className={styles.tableCell}>{plant.addedAt}</td>
                          <td className={styles.tableCellAction}>
                            <a href="#" className={styles.editLink}>
                              Editar
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.quickActionsSection}>
                <h4 className={styles.sectionTitle}>Ações Rápidas</h4>
                <div className={styles.quickActionsGrid}>
                  <div className={styles.quickActionCard + " " + styles.purpleCard}>
                    <div className={styles.quickActionContent}>
                      <div className={styles.quickActionIcon + " " + styles.purpleIcon}>
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
                      <div className={styles.quickActionInfo}>
                        <h5 className={styles.quickActionTitle}>Adicionar Nova Planta</h5>
                        <p className={styles.quickActionDescription}>Cadastre uma nova planta no banco de dados</p>
                      </div>
                    </div>
                    <div className={styles.quickActionFooter}>
                      <a href="#" className={styles.quickActionLink}>
                        Iniciar &rarr;
                      </a>
                    </div>
                  </div>

                  <div className={styles.quickActionCard + " " + styles.greenCard}>
                    <div className={styles.quickActionContent}>
                      <div className={styles.quickActionIcon + " " + styles.greenIcon}>
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
                          <path d="m5 8 6 6"></path>
                          <path d="m4 14 6-6 2-3"></path>
                          <path d="M2 5h12"></path>
                          <path d="M7 2h1"></path>
                          <path d="m22 22-5-10-5 10"></path>
                          <path d="M14 18h6"></path>
                        </svg>
                      </div>
                      <div className={styles.quickActionInfo}>
                        <h5 className={styles.quickActionTitle}>Gerenciar Traduções</h5>
                        <p className={styles.quickActionDescription}>
                          Adicione ou edite traduções para os idiomas disponíveis
                        </p>
                      </div>
                    </div>
                    <div className={styles.quickActionFooter}>
                      <a href="#" className={styles.quickActionLink + " " + styles.greenLink}>
                        Iniciar &rarr;
                      </a>
                    </div>
                  </div>

                  <div className={styles.quickActionCard + " " + styles.blueCard}>
                    <div className={styles.quickActionContent}>
                      <div className={styles.quickActionIcon + " " + styles.blueIcon}>
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
                          <circle cx="12" cy="10" r="3"></circle>
                          <path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"></path>
                        </svg>
                      </div>
                      <div className={styles.quickActionInfo}>
                        <h5 className={styles.quickActionTitle}>Mapear Locais</h5>
                        <p className={styles.quickActionDescription}>Adicione ou edite locais de colheita no mapa</p>
                      </div>
                    </div>
                    <div className={styles.quickActionFooter}>
                      <a href="#" className={styles.quickActionLink + " " + styles.blueLink}>
                        Iniciar &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Categorias/Famílias */}
          {activeTab === "categories" && (
            <div className={styles.categoriesTab}>
              <h3 className={styles.tabTitle}>Plantas por Categoria/Família</h3>
              <p className={styles.tabDescription}>
                Visualize a distribuição de plantas por família botânica no banco de dados.
              </p>

              <div className={styles.categoriesGrid}>
                <div className={styles.chartCard}>
                  <h4 className={styles.chartTitle}>Distribuição por Família</h4>
                  <div className={styles.chartPlaceholder}>
                    <p className={styles.placeholderText}>Gráfico de distribuição por família</p>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h4 className={styles.chartTitle}>Principais Famílias</h4>
                  <ul className={styles.progressList}>
                    {plantsByFamily.map((family) => (
                      <li key={family.name} className={styles.progressItem}>
                        <div className={styles.progressInfo}>
                          <span className={styles.progressLabel}>{family.name}</span>
                          <span className={styles.progressValue}>{family.count} plantas</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${family.percentage}%` }}></div>
                        </div>
                        <span className={styles.progressPercentage}>{family.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.viewAllContainer}>
                <Link href="/admin/categories" className={styles.viewAllButton}>
                  Ver todas as categorias
                </Link>
              </div>
            </div>
          )}

          {/* Idiomas */}
          {activeTab === "languages" && (
            <div className={styles.languagesTab}>
              <h3 className={styles.tabTitle}>Plantas por Idioma</h3>
              <p className={styles.tabDescription}>
                Visualize a distribuição de plantas por idioma disponível no banco de dados.
              </p>

              <div className={styles.languagesCard}>
                <h4 className={styles.chartTitle}>Cobertura por Idioma</h4>
                <ul className={styles.progressList}>
                  {plantsByLanguage.map((lang) => (
                    <li key={lang.language} className={styles.progressItem}>
                      <div className={styles.progressInfo}>
                        <span className={styles.progressLabel}>{lang.language}</span>
                        <span className={styles.progressValue}>{lang.count} plantas</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFillGreen} style={{ width: `${lang.percentage}%` }}></div>
                      </div>
                      <span className={styles.progressPercentage}>{lang.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.viewAllContainer}>
                <Link href="/admin/languages" className={styles.viewAllButtonGreen}>
                  Gerenciar idiomas
                </Link>
              </div>
            </div>
          )}

          {/* Locais de Colheita */}
          {activeTab === "locations" && (
            <div className={styles.locationsTab}>
              <h3 className={styles.tabTitle}>Plantas por Local de Colheita</h3>
              <p className={styles.tabDescription}>
                Visualize a distribuição de plantas por local de colheita em Moçambique.
              </p>

              <div className={styles.locationsGrid}>
                <div className={styles.chartCard}>
                  <h4 className={styles.chartTitle}>Mapa de Moçambique</h4>
                  <div className={styles.mapPlaceholder}>
                    <p className={styles.placeholderText}>Mapa interativo de Moçambique</p>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <h4 className={styles.chartTitle}>Distribuição por Província</h4>
                  <ul className={styles.progressListScroll}>
                    {locationData.map((location) => (
                      <li key={location.name} className={styles.progressItem}>
                        <div className={styles.progressInfo}>
                          <span className={styles.progressLabel}>{location.name}</span>
                          <span className={styles.progressValue}>{location.count} plantas</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFillBlue} style={{ width: `${location.percentage}%` }}></div>
                        </div>
                        <span className={styles.progressPercentage}>{location.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.viewAllContainer}>
                <Link href="/admin/locations" className={styles.viewAllButtonBlue}>
                  Gerenciar locais
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
