"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearch } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import styles from "./search-form.module.css"

// Tipos baseados na estrutura real da BD
interface Uso {
  id_uso: number;
  parte_usada?: string;
  indicacao_uso?: string;
  metodo_preparacao_tradicional?: string;
  metodo_extraccao?: string;
}

interface LocalColheita {
  id_local: number;
  provincia?: string;
  regiao?: string;
}

interface Autor {
  id_autor: number;
  nome_autor: string;
  afiliacao?: string;
}

interface Familia {
  id_familia: number;
  nome_familia: string;
}

// URL base da API - ajuste conforme necessário
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function SearchForm() {
  const { filters, setFilters, performSearch, clearSearch, isLoading } = useSearch()
  const { translate } = useLanguage()
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)
  
  // Estados para armazenar dados das comboboxes
  const [familias, setFamilias] = useState<Familia[]>([])
  const [usos, setUsos] = useState<Uso[]>([])
  const [locais, setLocais] = useState<LocalColheita[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [loadingFamilias, setLoadingFamilias] = useState(true)
  const [loadingUsos, setLoadingUsos] = useState(true)
  const [loadingLocais, setLoadingLocais] = useState(true)
  const [loadingAutores, setLoadingAutores] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para partes únicas
  const [partesUnicas, setPartesUnicas] = useState<string[]>([])

  // Função genérica para fazer requisições
  const fetchData = async <T,>(
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    loadingSetter: React.Dispatch<React.SetStateAction<boolean>>,
    entityName: string
  ) => {
    try {
      loadingSetter(true)
      setError(null)
      console.log(`Buscando ${entityName} de:`, `${API_BASE_URL}${endpoint}`)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      console.log(`Response status ${entityName}:`, response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`${entityName} recebidos:`, data)
        setter(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error(`Erro ao buscar ${entityName}:`, response.status, errorText)
        setError(`Erro ao carregar ${entityName}: ${response.status}`)
      }
    } catch (error) {
      console.error(`Erro na requisição de ${entityName}:`, error)
      setError(`Erro de conexão ao carregar ${entityName}: ${error}`)
    } finally {
      loadingSetter(false)
    }
  }

  // Funções específicas para cada entidade
  const fetchFamilias = () => fetchData('/familias', setFamilias, setLoadingFamilias, 'famílias')
  const fetchUsos = () => fetchData('/usos', setUsos, setLoadingUsos, 'usos')
  const fetchLocais = () => fetchData('/locais', setLocais, setLoadingLocais, 'locais')
  const fetchAutores = () => fetchData('/autores', setAutores, setLoadingAutores, 'autores')

  // Função para extrair partes únicas dos usos
  useEffect(() => {
    if (usos.length > 0) {
      const partesSet = new Set<string>()
      
      usos.forEach(uso => {
        if (uso.parte_usada && uso.parte_usada.trim()) {
          // Dividir por vírgulas caso tenha múltiplas partes
          const partes = uso.parte_usada.split(',').map(p => p.trim())
          partes.forEach(parte => {
            if (parte) partesSet.add(parte)
          })
        }
      })
      
      const partesArray = Array.from(partesSet).sort()
      setPartesUnicas(partesArray)
      console.log('Partes únicas extraídas:', partesArray)
    }
  }, [usos])

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Componente montado, carregando dados...')
    fetchFamilias()
    fetchUsos()
    fetchLocais()
    fetchAutores()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filtros de busca usando parte_usada em vez de uso_id
    const searchFilters = {
      // Filtros específicos usando os IDs corretos
      familia_id: filters.family ? parseInt(filters.family) : undefined,
      autor_id: filters.author ? parseInt(filters.author) : undefined,
      local_id: filters.observationLocation ? parseInt(filters.observationLocation) : undefined,
      
      // NOVO: Usar parte_usada em vez de uso_id
      parte_usada: filters.traditionalUse ? filters.traditionalUse : undefined,
      
      // Parâmetros específicos para nome popular e científico
      search_popular: filters.popularName ? filters.popularName.trim() : undefined,
      search_cientifico: filters.scientificName ? filters.scientificName.trim() : undefined,
    }
    
    console.log('Filtros de busca:', searchFilters)
    performSearch(searchFilters)
  }

  const handleClear = () => {
    clearSearch()
    setError(null)
  }

  const toggleRecordingPopular = () => {
    setIsRecordingPopular(!isRecordingPopular)
    if (!isRecordingPopular) {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          setFilters((prev) => ({ ...prev, popularName: "Mpalhacufa" }))
        } else {
          setFilters((prev) => ({ ...prev, popularName: "Moringa" }))
        }
        setIsRecordingPopular(false)
      }, 2000)
    }
  }

  const toggleRecordingScientific = () => {
    setIsRecordingScientific(!isRecordingScientific)
    if (!isRecordingScientific) {
      setTimeout(() => {
        setFilters((prev) => ({ ...prev, scientificName: "Baccharis" }))
        setIsRecordingScientific(false)
      }, 2000)
    }
  }

  // Função para formatar o texto de exibição do local
  const formatLocalDisplay = (local: LocalColheita) => {
    const parts = []
    
    if (local.regiao && local.regiao.trim()) {
      parts.push(local.regiao.trim())
    }
    
    if (local.provincia && local.provincia.trim() && local.provincia !== local.regiao) {
      parts.push(local.provincia.trim())
    }
    
    if (parts.length > 0) {
      return parts.join(', ')
    }
    
    return `Local ${local.id_local}`
  }

  // Função para formatar o texto de exibição do autor
  const formatAutorDisplay = (autor: Autor) => {
    let display = autor.nome_autor || `Autor ${autor.id_autor}`
    
    if (autor.afiliacao && autor.afiliacao.trim()) {
      display += ` - ${autor.afiliacao.trim()}`
    }
    
    return display
  }

  // Função para retentar carregamento
  const retryLoad = () => {
    setError(null)
    fetchFamilias()
    fetchUsos()
    fetchLocais()
    fetchAutores()
  }

  return (
    <div className={styles.searchForm}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>{translate("search.title")}</h2>
      </div>
      <div className={styles.searchBody}>
        {error && (
          <div className={styles.errorMessage}>
            <p>⚠️ {error}</p>
            <button 
              onClick={retryLoad}
              className={styles.retryButton}
            >
              Tentar Novamente
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Nome Popular */}
          <div className={styles.formGroup}>
            <label htmlFor="nomePopular" className={styles.formLabel}>
              {translate("search.popularName")}
            </label>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                id="nomePopular"
                className={styles.formInput}
                placeholder={translate("search.placeholder.popular")}
                value={filters.popularName}
                onChange={(e) => setFilters((prev) => ({ 
                  ...prev, 
                  popularName: e.target.value
                }))}
              />
              <button
                type="button"
                onClick={toggleRecordingPopular}
                className={`${styles.iconButton} ${isRecordingPopular ? styles.recording : ""}`}
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
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </button>
            </div>
            {isRecordingPopular && (
              <p className={styles.recordingText}>
                <span className={styles.recordingDot}></span>
                {translate("search.recording")}
              </p>
            )}
          </div>

          {/* Nome Científico */}
          <div className={styles.formGroup}>
            <label htmlFor="nomeCientifico" className={styles.formLabel}>
              {translate("search.scientificName")}
            </label>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                id="nomeCientifico"
                className={styles.formInput}
                placeholder={translate("search.placeholder.scientific")}
                value={filters.scientificName}
                onChange={(e) => setFilters((prev) => ({ 
                  ...prev, 
                  scientificName: e.target.value
                }))}
              />
              <button
                type="button"
                onClick={toggleRecordingScientific}
                className={`${styles.iconButton} ${isRecordingScientific ? styles.recording : ""}`}
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
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </button>
            </div>
            {isRecordingScientific && (
              <p className={styles.recordingText}>
                <span className={styles.recordingDot}></span>
                {translate("search.recording")}
              </p>
            )}
          </div>

          {/* Família */}
          <div className={styles.formGroup}>
            <label htmlFor="familia" className={styles.formLabel}>
              Família Botânica
            </label>
            <select
              id="familia"
              className={styles.formSelect}
              value={filters.family || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, family: e.target.value }))}
              disabled={loadingFamilias}
            >
              <option value="">
                {loadingFamilias ? "Carregando famílias..." : 
                 familias.length === 0 ? "Nenhuma família encontrada" :
                 "Escolha uma família botânica..."}
              </option>
              {familias.map((familia) => (
                <option key={familia.id_familia} value={familia.id_familia.toString()}>
                  {familia.nome_familia}
                </option>
              ))}
            </select>
            {loadingFamilias && (
              <p className={styles.loadingText}>Carregando famílias...</p>
            )}
          </div>

          {/* Uso Tradicional - CORRIGIDO: Agora usa partes únicas */}
          <div className={styles.formGroup}>
            <label htmlFor="usoTradicional" className={styles.formLabel}>
              {translate("search.traditionalUse")}
            </label>
            <select
              id="usoTradicional"
              className={styles.formSelect}
              value={filters.traditionalUse || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, traditionalUse: e.target.value }))}
              disabled={loadingUsos}
            >
              <option value="">
                {loadingUsos ? "Carregando partes usadas..." : 
                 partesUnicas.length === 0 ? "Nenhuma parte encontrada" :
                 "Escolha uma parte usada..."}
              </option>
              {partesUnicas.map((parte) => (
                <option key={parte} value={parte}>
                  {parte}
                </option>
              ))}
            </select>
            {loadingUsos && (
              <p className={styles.loadingText}>Carregando partes usadas...</p>
            )}
          </div>

          {/* Autor */}
          <div className={styles.formGroup}>
            <label htmlFor="autor" className={styles.formLabel}>
              {translate("search.author")}
            </label>
            <select
              id="autor"
              className={styles.formSelect}
              value={filters.author || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
              disabled={loadingAutores}
            >
              <option value="">
                {loadingAutores ? "Carregando autores..." : 
                 autores.length === 0 ? "Nenhum autor encontrado" :
                 "Escolha um autor..."}
              </option>
              {autores.map((autor) => (
                <option key={autor.id_autor} value={autor.id_autor.toString()}>
                  {formatAutorDisplay(autor)}
                </option>
              ))}
            </select>
            {loadingAutores && (
              <p className={styles.loadingText}>Carregando autores...</p>
            )}
          </div>

          {/* Local de Observação */}
          <div className={styles.formGroup}>
            <label htmlFor="localObservacao" className={styles.formLabel}>
              {translate("search.location")}
            </label>
            <select
              id="localObservacao"
              className={styles.formSelect}
              value={filters.observationLocation || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, observationLocation: e.target.value }))}
              disabled={loadingLocais}
            >
              <option value="">
                {loadingLocais ? "Carregando locais..." : 
                 locais.length === 0 ? "Nenhum local encontrado" :
                 "Escolha um local..."}
              </option>
              {locais.map((local) => (
                <option key={local.id_local} value={local.id_local.toString()}>
                  {formatLocalDisplay(local)}
                </option>
              ))}
            </select>
            {loadingLocais && (
              <p className={styles.loadingText}>Carregando locais...</p>
            )}
          </div>

          <p className={styles.helpText}>{translate("search.empty")}</p>

          <div className={styles.formActions}>
            <button type="button" onClick={handleClear} className={styles.clearButton}>
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              {translate("search.clear")}
            </button>
            <button type="submit" disabled={isLoading} className={styles.searchButton}>
              {isLoading ? (
                <>
                  <svg
                    className={styles.spinnerIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  Consultando...
                </>
              ) : (
                <>
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
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  {translate("search.button")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}