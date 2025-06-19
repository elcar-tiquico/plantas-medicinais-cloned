"use client"

import { useState } from "react"
import { useSearch } from "@/context/search-context"
import { PlantDetails } from "@/components/plant-details"
import { useLanguage } from "@/context/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import styles from "./results-table.module.css"

// Componente para tooltip de autores
function AuthorTooltip({ plant }: { plant: any }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Extrair autores dos dados (assumindo que estão na estrutura atual)
  const autores = plant.autores_detalhados || []
  
  if (autores.length === 0) {
    return <span className={styles.authorInfo}>{plant.afiliacao}</span>
  }

  return (
    <div className={styles.authorTooltipContainer}>
      <button
        className={styles.authorButton}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        👥 Autores
      </button>
      
      {showTooltip && (
        <div className={styles.authorTooltip}>
          <div className={styles.tooltipTitle}>Autores e Afiliações:</div>
          <div className={styles.authorsList}>
            {autores.map((autor: any, index: number) => (
              <div key={autor.id_autor || index} className={styles.authorItem}>
                <div className={styles.authorName}>{autor.nome_autor}</div>
                {autor.afiliacao && (
                  <div className={styles.authorAffiliation}>
                    🏛️ {autor.afiliacao}
                    {autor.sigla_afiliacao && (
                      <span className={styles.authorSigla}> ({autor.sigla_afiliacao})</span>
                    )}
                  </div>
                )}
                {index < autores.length - 1 && <div className={styles.authorDivider}></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultsTable() {
  const { results, isLoading, hasSearched } = useSearch()
  const { translate } = useLanguage()
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)

  const toggleDetails = (id: number) => {
    setSelectedPlant(selectedPlant === id ? null : id)
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.loadingState}>
          <div className={styles.loadingIcon}>
            <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                className={styles.spinnerCircle}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className={styles.loadingTitle}>{translate("results.searching")}</h3>
          <p className={styles.loadingText}>
            Consultando a nossa base de dados... Isso pode levar alguns instantes.
          </p>
        </div>
      </div>
    )
  }

  // Nenhuma busca realizada ainda
  if (!hasSearched) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
          <h3 className={styles.emptyTitle}>{translate("results.searchPrompt")}</h3>
          <p className={styles.emptyText}>
            Use o formulário ao lado para pesquisar informações sobre plantas medicinais de Moçambique.
          </p>
        </div>
      </div>
    )
  }

  // Nenhum resultado encontrado
  if (results.length === 0) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
          <h3 className={styles.emptyTitle}>{translate("results.noResults")}</h3>
          <p className={styles.emptyText}>{translate("results.tryAgain")}</p>
        </div>
      </div>
    )
  }

  // Resultados encontrados
  return (
    <div className={styles.resultsCard}>
      <div className={styles.resultsHeader}>
        <h2 className={styles.resultsTitle}>{translate("results.title")}</h2>
        <div className={styles.resultsActions}>
          <span className={styles.resultsCount}>
            {results.length} {results.length === 1 ? translate("results.found") : translate("results.found_plural")}
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      <div className={styles.resultsList}>
        {results.map((plant) => (
          <div key={plant.id} className={styles.resultItem}>
            <div className={styles.resultItemHeader} onClick={() => toggleDetails(plant.id)}>
              <div className={styles.resultItemInfo}>
                {/* Nomes populares (normal) */}
                <h3 className={styles.resultItemTitle}>
                  {plant.nomes_comuns?.join(' • ') || plant.nome}
                </h3>
                
                {/* Família (MAIÚSCULAS) */}
                <p className={styles.resultItemFamily}>{plant.familia?.toUpperCase()}</p>
                
                {/* Nome científico (itálico) */}
                <p className={styles.resultItemScientific}>
                  <em>{plant.nomeCientifico}</em>
                </p>
                
                {/* Tooltip de autores */}
                <div className={styles.authorSection}>
                  <AuthorTooltip plant={plant} />
                </div>
              </div>

              <div className={styles.resultItemActions}>
                <button
                  className={styles.toggleButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDetails(plant.id)
                  }}
                >
                  {selectedPlant === plant.id ? (
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
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  ) : (
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
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {selectedPlant === plant.id && <PlantDetails plant={plant} />}
          </div>
        ))}
      </div>
    </div>
  )
}