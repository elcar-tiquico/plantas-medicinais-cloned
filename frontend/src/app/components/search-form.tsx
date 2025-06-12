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

// URL base da API - ajuste conforme necessário
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function SearchForm() {
  const { filters, setFilters, performSearch, clearSearch, isLoading } = useSearch()
  const { translate } = useLanguage()
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)
  
  // Estados para armazenar dados das comboboxes
  const [usos, setUsos] = useState<Uso[]>([])
  const [locais, setLocais] = useState<LocalColheita[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [loadingUsos, setLoadingUsos] = useState(true)
  const [loadingLocais, setLoadingLocais] = useState(true)
  const [loadingAutores, setLoadingAutores] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar usos da API
  const fetchUsos = async () => {
    try {
      setLoadingUsos(true)
      setError(null)
      console.log('Buscando usos de:', `${API_BASE_URL}/usos`)
      
      const response = await fetch(`${API_BASE_URL}/usos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      console.log('Response status usos:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Usos recebidos:', data)
        setUsos(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro ao buscar usos:', response.status, errorText)
        setError(`Erro ao carregar usos: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro na requisição de usos:', error)
      setError(`Erro de conexão ao carregar usos: ${error}`)
    } finally {
      setLoadingUsos(false)
    }
  }

  // Função para buscar locais da API
  const fetchLocais = async () => {
    try {
      setLoadingLocais(true)
      console.log('Buscando locais de:', `${API_BASE_URL}/locais`)
      
      const response = await fetch(`${API_BASE_URL}/locais`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      console.log('Response status locais:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Locais recebidos:', data)
        setLocais(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro ao buscar locais:', response.status, errorText)
        setError(`Erro ao carregar locais: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro na requisição de locais:', error)
      setError(`Erro de conexão ao carregar locais: ${error}`)
    } finally {
      setLoadingLocais(false)
    }
  }

  // Função para buscar autores da API
  const fetchAutores = async () => {
    try {
      setLoadingAutores(true)
      console.log('Buscando autores de:', `${API_BASE_URL}/autores`)
      
      const response = await fetch(`${API_BASE_URL}/autores`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      console.log('Response status autores:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Autores recebidos:', data)
        setAutores(Array.isArray(data) ? data : [])
      } else {
        const errorText = await response.text()
        console.error('Erro ao buscar autores:', response.status, errorText)
        setError(`Erro ao carregar autores: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro na requisição de autores:', error)
      setError(`Erro de conexão ao carregar autores: ${error}`)
    } finally {
      setLoadingAutores(false)
    }
  }

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Componente montado, carregando dados...')
    fetchUsos()
    fetchLocais()
    fetchAutores()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const handleClear = () => {
    clearSearch()
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

  // Função para obter partes únicas dos usos
  const getPartesUnicas = () => {
    const partesSet = new Set<string>()
    
    usos.forEach(uso => {
      if (uso.parte_usada && uso.parte_usada.trim()) {
        partesSet.add(uso.parte_usada.trim())
      }
    })
    
    return Array.from(partesSet).sort()
  }

  // Função para formatar o texto de exibição do local
  const formatLocalDisplay = (local: LocalColheita) => {
    const parts = []
    
    if (local.regiao && local.regiao.trim()) {
      parts.push(local.regiao.trim())
    }
    
    if (local.provincia && local.provincia.trim()) {
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
              onClick={() => {
                setError(null)
                fetchUsos()
                fetchLocais()
                fetchAutores()
              }}
              className={styles.retryButton}
            >
              Tentar Novamente
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
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
                onChange={(e) => setFilters((prev) => ({ ...prev, popularName: e.target.value }))}
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
                onChange={(e) => setFilters((prev) => ({ ...prev, scientificName: e.target.value }))}
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

          <div className={styles.formGroup}>
            <label htmlFor="parteUsada" className={styles.formLabel}>
              {translate("search.traditionalUse")} - Parte Usada
            </label>
            <select
              id="parteUsada"
              className={styles.formSelect}
              value={filters.traditionalUse}
              onChange={(e) => setFilters((prev) => ({ ...prev, traditionalUse: e.target.value }))}
              disabled={loadingUsos}
            >
              <option value="">
                {loadingUsos ? "Carregando partes usadas..." : 
                 getPartesUnicas().length === 0 ? "Nenhuma parte encontrada" :
                 "Escolha uma parte usada..."}
              </option>
              {getPartesUnicas().map((parte) => (
                <option key={parte} value={parte}>
                  {parte}
                </option>
              ))}
            </select>
            {loadingUsos && (
              <p className={styles.loadingText}>Carregando partes usadas...</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="autor" className={styles.formLabel}>
              {translate("search.author")}
            </label>
            <select
              id="autor"
              className={styles.formSelect}
              value={filters.author}
              onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
              disabled={loadingAutores}
            >
              <option value="">
                {loadingAutores ? "Carregando autores..." : 
                 autores.length === 0 ? "Nenhum autor encontrado" :
                 "Escolha ou busque um autor na lista..."}
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

          <div className={styles.formGroup}>
            <label htmlFor="localObservacao" className={styles.formLabel}>
              {translate("search.location")}
            </label>
            <select
              id="localObservacao"
              className={styles.formSelect}
              value={filters.observationLocation}
              onChange={(e) => setFilters((prev) => ({ ...prev, observationLocation: e.target.value }))}
              disabled={loadingLocais}
            >
              <option value="">
                {loadingLocais ? "Carregando locais..." : 
                 locais.length === 0 ? "Nenhum local encontrado" :
                 "Escolha ou busque um local na lista..."}
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