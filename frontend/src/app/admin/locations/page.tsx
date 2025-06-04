"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./locations.module.css"

// Dados simulados de locais
const locaisIniciais = [
  {
    id: 1,
    nome: "Maputo",
    pais: "Moçambique",
    regiao: "Sul",
    coordenadas: { lat: -25.9692, lng: 32.5732 },
    plantas: 156,
    ativo: true,
  },
  {
    id: 2,
    nome: "Gaza",
    pais: "Moçambique",
    regiao: "Sul",
    coordenadas: { lat: -23.9, lng: 32.8 },
    plantas: 98,
    ativo: true,
  },
  {
    id: 3,
    nome: "Inhambane",
    pais: "Moçambique",
    regiao: "Sul",
    coordenadas: { lat: -23.8658, lng: 35.3833 },
    plantas: 87,
    ativo: true,
  },
  {
    id: 4,
    nome: "Sofala",
    pais: "Moçambique",
    regiao: "Centro",
    coordenadas: { lat: -19.8, lng: 34.8 },
    plantas: 76,
    ativo: true,
  },
  {
    id: 5,
    nome: "Manica",
    pais: "Moçambique",
    regiao: "Centro",
    coordenadas: { lat: -19.5, lng: 33.6 },
    plantas: 65,
    ativo: true,
  },
  {
    id: 6,
    nome: "Tete",
    pais: "Moçambique",
    regiao: "Centro",
    coordenadas: { lat: -16.1564, lng: 33.5867 },
    plantas: 54,
    ativo: true,
  },
  {
    id: 7,
    nome: "Zambézia",
    pais: "Moçambique",
    regiao: "Centro",
    coordenadas: { lat: -16.5, lng: 36.6 },
    plantas: 43,
    ativo: true,
  },
  {
    id: 8,
    nome: "Nampula",
    pais: "Moçambique",
    regiao: "Norte",
    coordenadas: { lat: -15.1165, lng: 39.2666 },
    plantas: 32,
    ativo: true,
  },
  {
    id: 9,
    nome: "Cabo Delgado",
    pais: "Moçambique",
    regiao: "Norte",
    coordenadas: { lat: -12.3335, lng: 39.3167 },
    plantas: 21,
    ativo: true,
  },
  {
    id: 10,
    nome: "Niassa",
    pais: "Moçambique",
    regiao: "Norte",
    coordenadas: { lat: -13.3, lng: 35.6 },
    plantas: 10,
    ativo: true,
  },
  {
    id: 11,
    nome: "Amazônia",
    pais: "Brasil",
    regiao: "Norte",
    coordenadas: { lat: -3.4653, lng: -62.2159 },
    plantas: 245,
    ativo: true,
  },
  {
    id: 12,
    nome: "Cerrado",
    pais: "Brasil",
    regiao: "Centro-Oeste",
    coordenadas: { lat: -15.8267, lng: -47.9218 },
    plantas: 187,
    ativo: true,
  },
  {
    id: 13,
    nome: "Caatinga",
    pais: "Brasil",
    regiao: "Nordeste",
    coordenadas: { lat: -9.6498, lng: -40.3496 },
    plantas: 156,
    ativo: true,
  },
  {
    id: 14,
    nome: "Mata Atlântica",
    pais: "Brasil",
    regiao: "Sudeste",
    coordenadas: { lat: -22.9068, lng: -43.1729 },
    plantas: 324,
    ativo: true,
  },
  {
    id: 15,
    nome: "Pampa",
    pais: "Brasil",
    regiao: "Sul",
    coordenadas: { lat: -30.0346, lng: -51.2177 },
    plantas: 98,
    ativo: true,
  },
]

export default function LocationsPage() {
  const [locais, setLocais] = useState(locaisIniciais)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPais, setSelectedPais] = useState("")
  const [selectedRegiao, setSelectedRegiao] = useState("")

  // Filtrar locais com base nos critérios de pesquisa
  const filteredLocais = locais.filter((local) => {
    const matchesSearch = searchTerm === "" || local.nome.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPais = selectedPais === "" || local.pais === selectedPais
    const matchesRegiao = selectedRegiao === "" || local.regiao === selectedRegiao

    return matchesSearch && matchesPais && matchesRegiao
  })

  // Extrair países únicos para o filtro
  const uniquePaises = Array.from(new Set(locais.map((local) => local.pais)))

  // Extrair regiões únicas para o filtro
  const uniqueRegioes = Array.from(new Set(locais.map((local) => local.regiao)))

  // Função para excluir um local
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este local?")) {
      setLocais(locais.filter((local) => local.id !== id))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerenciar Locais de Colheita</h1>
        <Link href="/admin/locations/add" className={styles.addButton}>
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
          Adicionar Novo Local
        </Link>
      </div>

      {/* Mapa */}
      <div className={styles.mapCard}>
        <h2 className={styles.cardTitle}>Mapa de Locais</h2>
        <div className={styles.mapContainer}>
          <p className={styles.mapPlaceholder}>Mapa interativo de locais de colheita</p>
        </div>
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
                placeholder="Nome do local"
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

          {/* Filtro por país */}
          <div className={styles.filterItem}>
            <label htmlFor="pais" className={styles.filterLabel}>
              País
            </label>
            <select
              id="pais"
              name="pais"
              value={selectedPais}
              onChange={(e) => setSelectedPais(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os países</option>
              {uniquePaises.map((pais) => (
                <option key={pais} value={pais}>
                  {pais}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por região */}
          <div className={styles.filterItem}>
            <label htmlFor="regiao" className={styles.filterLabel}>
              Região
            </label>
            <select
              id="regiao"
              name="regiao"
              value={selectedRegiao}
              onChange={(e) => setSelectedRegiao(e.target.value)}
              className={styles.select}
            >
              <option value="">Todas as regiões</option>
              {uniqueRegioes.map((regiao) => (
                <option key={regiao} value={regiao}>
                  {regiao}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("")
              setSelectedPais("")
              setSelectedRegiao("")
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

      {/* Lista de locais */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Nome</th>
                <th className={styles.tableHeaderCell}>País</th>
                <th className={styles.tableHeaderCell}>Região</th>
                <th className={styles.tableHeaderCell}>Coordenadas</th>
                <th className={styles.tableHeaderCell}>Plantas</th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLocais.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    Nenhum local encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLocais.map((local) => (
                  <tr key={local.id} className={styles.tableRow}>
                    <td className={styles.tableCellName}>{local.nome}</td>
                    <td className={styles.tableCell}>{local.pais}</td>
                    <td className={styles.tableCell}>{local.regiao}</td>
                    <td className={styles.tableCell}>
                      {local.coordenadas.lat.toFixed(4)}, {local.coordenadas.lng.toFixed(4)}
                    </td>
                    <td className={styles.tableCell}>{local.plantas}</td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <Link href={`/admin/locations/${local.id}`} className={styles.viewButton}>
                          Ver
                        </Link>
                        <Link href={`/admin/locations/${local.id}/edit`} className={styles.editButton}>
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(local.id)} className={styles.deleteButton}>
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
              <span className={styles.paginationBold}>{filteredLocais.length}</span> de{" "}
              <span className={styles.paginationBold}>{filteredLocais.length}</span> resultados
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
