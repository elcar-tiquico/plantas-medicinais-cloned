"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./plants.module.css"

// Dados simulados de plantas
const plantasIniciais = [
  {
    id: 1,
    nome: "Carqueja",
    nomeCientifico: "Baccharis crispa Spreng.",
    familia: "ASTERACEAE",
    localColheita: "Cerrado",
    usos: "Problemas digestivos, diabetes, obesidade",
    idiomas: ["pt", "xangana"],
    adicionadoEm: "2023-05-15",
  },
  {
    id: 2,
    nome: "Aroeira",
    nomeCientifico: "Schinus terebinthifolia Raddi",
    familia: "ANACARDIACEAE",
    localColheita: "Mata Atlântica",
    usos: "Anti-inflamatório, cicatrizante, antimicrobiano",
    idiomas: ["pt", "xangana", "xopeee"],
    adicionadoEm: "2023-05-12",
  },
  {
    id: 3,
    nome: "Quebra-pedra",
    nomeCientifico: "Phyllanthus niruri L.",
    familia: "PHYLLANTHACEAE",
    localColheita: "Amazônia",
    usos: "Problemas renais, cálculos renais",
    idiomas: ["pt"],
    adicionadoEm: "2023-05-10",
  },
  {
    id: 4,
    nome: "Espinheira-santa",
    nomeCientifico: "Maytenus ilicifolia Mart. ex Reissek",
    familia: "CELASTRACEAE",
    localColheita: "Mata Atlântica",
    usos: "Problemas gástricos, úlceras",
    idiomas: ["pt", "xopeee"],
    adicionadoEm: "2023-05-08",
  },
  {
    id: 5,
    nome: "Guaco",
    nomeCientifico: "Mikania glomerata Spreng.",
    familia: "ASTERACEAE",
    localColheita: "Mata Atlântica",
    usos: "Problemas respiratórios, bronquite",
    idiomas: ["pt", "xangana"],
    adicionadoEm: "2023-05-05",
  },
]

export default function PlantsPage() {
  const [plantas, setPlantas] = useState(plantasIniciais)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFamily, setSelectedFamily] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("")

  // Filtrar plantas com base nos critérios de pesquisa
  const filteredPlantas = plantas.filter((planta) => {
    const matchesSearch =
      searchTerm === "" ||
      planta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planta.nomeCientifico.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFamily = selectedFamily === "" || planta.familia === selectedFamily
    const matchesLocation = selectedLocation === "" || planta.localColheita === selectedLocation
    const matchesLanguage = selectedLanguage === "" || planta.idiomas.includes(selectedLanguage)

    return matchesSearch && matchesFamily && matchesLocation && matchesLanguage
  })

  // Extrair famílias únicas para o filtro
  const uniqueFamilies = Array.from(new Set(plantas.map((planta) => planta.familia)))

  // Extrair locais únicos para o filtro
  const uniqueLocations = Array.from(new Set(plantas.map((planta) => planta.localColheita)))

  // Função para excluir uma planta
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta planta?")) {
      setPlantas(plantas.filter((planta) => planta.id !== id))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerenciar Plantas</h1>
        <Link href="/admin/plants/add" className={styles.addButton}>
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
            className={styles.icon}
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar Nova Planta
        </Link>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Pesquisa por nome */}
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              Pesquisar
            </label>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
                placeholder="Nome ou nome científico"
              />
              <div className={styles.searchIcon}>
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
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro por família */}
          <div className={styles.filterItem}>
            <label htmlFor="family" className={styles.filterLabel}>
              Família
            </label>
            <select
              id="family"
              name="family"
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className={styles.select}
            >
              <option value="">Todas as famílias</option>
              {uniqueFamilies.map((familia) => (
                <option key={familia} value={familia}>
                  {familia}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por local */}
          <div className={styles.filterItem}>
            <label htmlFor="location" className={styles.filterLabel}>
              Local de Colheita
            </label>
            <select
              id="location"
              name="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os locais</option>
              {uniqueLocations.map((local) => (
                <option key={local} value={local}>
                  {local}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por idioma */}
          <div className={styles.filterItem}>
            <label htmlFor="language" className={styles.filterLabel}>
              Idioma
            </label>
            <select
              id="language"
              name="language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os idiomas</option>
              <option value="pt">Português</option>
              <option value="xangana">Xangana</option>
              <option value="xopeee">Xopeee</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("")
              setSelectedFamily("")
              setSelectedLocation("")
              setSelectedLanguage("")
            }}
            className={styles.clearButton}
          >
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
              className={styles.icon}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Lista de plantas */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Nome</th>
                <th className={styles.tableHeaderCell}>Nome Científico</th>
                <th className={styles.tableHeaderCell}>Família</th>
                <th className={styles.tableHeaderCell}>Local</th>
                <th className={styles.tableHeaderCell}>Idiomas</th>
                <th className={styles.tableHeaderCell}>Data de Adição</th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlantas.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyMessage}>
                    Nenhuma planta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredPlantas.map((planta) => (
                  <tr key={planta.id} className={styles.tableRow}>
                    <td className={styles.tableCellName}>{planta.nome}</td>
                    <td className={styles.tableCell}>
                      <em>{planta.nomeCientifico}</em>
                    </td>
                    <td className={styles.tableCell}>{planta.familia}</td>
                    <td className={styles.tableCell}>{planta.localColheita}</td>
                    <td className={styles.tableCell}>
                      <div className={styles.badgeContainer}>
                        {planta.idiomas.includes("pt") && (
                          <span className={`${styles.badge} ${styles.badgeBlue}`}>PT</span>
                        )}
                        {planta.idiomas.includes("xangana") && (
                          <span className={`${styles.badge} ${styles.badgeGreen}`}>XA</span>
                        )}
                        {planta.idiomas.includes("xopeee") && (
                          <span className={`${styles.badge} ${styles.badgePurple}`}>XO</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.tableCell}>{planta.adicionadoEm}</td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <Link href={`/admin/plants/${planta.id}`} className={styles.viewButton}>
                          Ver
                        </Link>
                        <Link href={`/admin/plants/${planta.id}/edit`} className={styles.editButton}>
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(planta.id)} className={styles.deleteButton}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      <div className={styles.pagination}>
        <div className={styles.paginationMobile}>
          <button className={styles.paginationButton}>Anterior</button>
          <button className={styles.paginationButton}>Próximo</button>
        </div>
        <div className={styles.paginationDesktop}>
          <div>
            <p className={styles.paginationText}>
              Mostrando <span className={styles.paginationBold}>1</span> a{" "}
              <span className={styles.paginationBold}>{filteredPlantas.length}</span> de{" "}
              <span className={styles.paginationBold}>{filteredPlantas.length}</span> resultados
            </p>
          </div>
          <div>
            <nav className={styles.paginationNav} aria-label="Pagination">
              <button className={`${styles.paginationNavButton} ${styles.paginationNavButtonLeft}`}>
                <span className={styles.srOnly}>Anterior</span>
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
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button className={styles.paginationNavButtonCurrent}>1</button>
              <button className={`${styles.paginationNavButton} ${styles.paginationNavButtonRight}`}>
                <span className={styles.srOnly}>Próximo</span>
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
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
