"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearch } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import styles from "./search-form.module.css"

// Tipos baseados na nova estrutura da API
interface ParteUsada {
  id_uso: number;
  parte_usada?: string;
}

interface Provincia {
  id_provincia: number;
  nome_provincia: string;
}

interface Regiao {
  id_regiao: number;
  nome_regiao?: string;
  id_provincia: number;
  provincia?: string;
}

interface Autor {
  id_autor: number;
  nome_autor: string;
  afiliacao?: string;
  sigla_afiliacao?: string;
}

interface Familia {
  id_familia: number;
  nome_familia: string;
}

interface Indicacao {
  id_indicacao: number;
  descricao: string;
}

interface PropriedadeFarmacologica {
  id_propriedade: number;
  descricao: string;
}

interface ComposicaoQuimica {
  id_composto: number;
  nome_composto: string;
}

interface MetodoExtracao {
  id_extraccao: number;
  descricao: string;
}

interface MetodoPreparacao {
  id_preparacao: number;
  descricao: string;
}

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export function SearchForm() {
  const { filters, setFilters, performSearch, clearSearch, isLoading } = useSearch()
  const { translate } = useLanguage()
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)
  
  // Estados para armazenar dados das comboboxes
  const [familias, setFamilias] = useState<Familia[]>([])
  const [partesUsadas, setPartesUsadas] = useState<ParteUsada[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [regioes, setRegioes] = useState<Regiao[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([])
  const [propriedades, setPropriedades] = useState<PropriedadeFarmacologica[]>([])
  const [compostos, setCompostos] = useState<ComposicaoQuimica[]>([])
  const [metodosExtracao, setMetodosExtracao] = useState<MetodoExtracao[]>([])
  const [metodosPreparacao, setMetodosPreparacao] = useState<MetodoPreparacao[]>([])
  
  // Estados de loading
  const [loadingFamilias, setLoadingFamilias] = useState(true)
  const [loadingPartesUsadas, setLoadingPartesUsadas] = useState(true)
  const [loadingProvincias, setLoadingProvincias] = useState(true)
  const [loadingRegioes, setLoadingRegioes] = useState(false)
  const [loadingAutores, setLoadingAutores] = useState(true)
  const [loadingIndicacoes, setLoadingIndicacoes] = useState(true)
  const [loadingPropriedades, setLoadingPropriedades] = useState(true)
  const [loadingCompostos, setLoadingCompostos] = useState(true)
  const [loadingMetodosExtracao, setLoadingMetodosExtracao] = useState(true)
  const [loadingMetodosPreparacao, setLoadingMetodosPreparacao] = useState(true)
  
  const [error, setError] = useState<string | null>(null)

  // Estado para partes únicas extraídas
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
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error(`Erro na requisição de ${entityName}:`, error)
      setError(`Erro ao carregar ${entityName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      loadingSetter(false)
    }
  }

  // Funções específicas para cada entidade
  const fetchFamilias = () => fetchData('/familias', setFamilias, setLoadingFamilias, 'famílias')
  const fetchPartesUsadas = () => fetchData('/partes-usadas', setPartesUsadas, setLoadingPartesUsadas, 'partes usadas')
  const fetchProvincias = () => fetchData('/provincias', setProvincias, setLoadingProvincias, 'províncias')
  const fetchAutores = () => fetchData('/autores', setAutores, setLoadingAutores, 'autores')
  const fetchIndicacoes = () => fetchData('/indicacoes', setIndicacoes, setLoadingIndicacoes, 'indicações')
  const fetchPropriedades = () => fetchData('/propriedades', setPropriedades, setLoadingPropriedades, 'propriedades')
  const fetchCompostos = () => fetchData('/compostos', setCompostos, setLoadingCompostos, 'compostos')
  const fetchMetodosExtracao = () => fetchData('/metodos-extracao', setMetodosExtracao, setLoadingMetodosExtracao, 'métodos de extração')
  const fetchMetodosPreparacao = () => fetchData('/metodos-preparacao', setMetodosPreparacao, setLoadingMetodosPreparacao, 'métodos de preparação')

  // Função para buscar regiões de uma província específica
  const fetchRegioes = async (provinciaId?: number) => {
    try {
      setLoadingRegioes(true)
      const endpoint = provinciaId ? `/regioes?provincia_id=${provinciaId}` : '/regioes'
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setRegioes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Erro ao buscar regiões:', error)
    } finally {
      setLoadingRegioes(false)
    }
  }

  // Função para extrair partes únicas
  useEffect(() => {
    if (partesUsadas.length > 0) {
      const partesSet = new Set<string>()
      
      partesUsadas.forEach(parte => {
        if (parte.parte_usada && parte.parte_usada.trim()) {
          // Dividir por vírgulas e outros separadores comuns
          const partes = parte.parte_usada
            .split(/[,;\/\+\&]/)
            .map(p => p.trim())
            .filter(p => p.length > 0)
          
          partes.forEach(p => {
            if (p) partesSet.add(p)
          })
        }
      })
      
      const partesArray = Array.from(partesSet).sort()
      setPartesUnicas(partesArray)
      console.log('Partes únicas extraídas:', partesArray)
    }
  }, [partesUsadas])

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Componente montado, carregando dados...')
    const loadAllData = async () => {
      setError(null)
      
      // Carregar dados essenciais primeiro
      await Promise.all([
        fetchFamilias(),
        fetchPartesUsadas(),
        fetchProvincias(),
        fetchAutores()
      ])
      
      // Carregar dados complementares
      await Promise.all([
        fetchIndicacoes(),
        fetchPropriedades(),
        fetchCompostos(),
        fetchMetodosExtracao(),
        fetchMetodosPreparacao()
      ])
      
      // Carregar todas as regiões inicialmente
      fetchRegioes()
    }
    
    loadAllData()
  }, [])

  // Carregar regiões quando a província mudar
  useEffect(() => {
    if (filters.provincia && filters.provincia !== "") {
      fetchRegioes(parseInt(filters.provincia))
    } else {
      fetchRegioes() // Carregar todas as regiões
    }
  }, [filters.provincia])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Construir filtros baseados na API atual
    const searchFilters: Record<string, any> = {}
    
    // Filtros por ID
    if (filters.family) {
      searchFilters.familia_id = parseInt(filters.family)
    }
    
    if (filters.author) {
      searchFilters.autor_id = parseInt(filters.author)
    }
    
    if (filters.provincia) {
      searchFilters.provincia_id = parseInt(filters.provincia)
    }
    
    if (filters.regiao) {
      searchFilters.regiao_id = parseInt(filters.regiao)
    }
    
    // Filtros por parte usada
    if (filters.parteId) {
      searchFilters.parte_id = parseInt(filters.parteId)
    } else if (filters.parteUsada) {
      searchFilters.parte_usada = filters.parteUsada
    }
    
    // Filtros de texto para nomes
    if (filters.popularName && filters.popularName.trim()) {
      searchFilters.search_popular = filters.popularName.trim()
    }
    
    if (filters.scientificName && filters.scientificName.trim()) {
      searchFilters.search_cientifico = filters.scientificName.trim()
    }
    
    // Paginação
    searchFilters.page = 1
    searchFilters.per_page = 50
    
    console.log('Filtros de busca:', searchFilters)
    performSearch(searchFilters)
  }

  const handleClear = () => {
    clearSearch()
    setError(null)
    setRegioes([]) // Limpar regiões
    fetchRegioes() // Recarregar todas as regiões
  }

  const toggleRecordingPopular = () => {
    setIsRecordingPopular(!isRecordingPopular)
    if (!isRecordingPopular) {
      setTimeout(() => {
        const exemploNomes = ["Mpalhacufa", "Moringa", "Mulungu", "Nhamacua", "Xicarangoma"]
        const nomeAleatorio = exemploNomes[Math.floor(Math.random() * exemploNomes.length)]
        setFilters((prev) => ({ ...prev, popularName: nomeAleatorio }))
        setIsRecordingPopular(false)
      }, 2000)
    }
  }

  const toggleRecordingScientific = () => {
    setIsRecordingScientific(!isRecordingScientific)
    if (!isRecordingScientific) {
      setTimeout(() => {
        const exemplosCientificos = ["Baccharis", "Moringa oleifera", "Strychnos", "Phyllanthus", "Combretum"]
        const nomeAleatorio = exemplosCientificos[Math.floor(Math.random() * exemplosCientificos.length)]
        setFilters((prev) => ({ ...prev, scientificName: nomeAleatorio }))
        setIsRecordingScientific(false)
      }, 2000)
    }
  }

  // Função para formatar o texto de exibição do autor
  const formatAutorDisplay = (autor: Autor) => {
    let display = autor.nome_autor || `Autor ${autor.id_autor}`
    
    if (autor.afiliacao && autor.afiliacao.trim()) {
      display += ` (${autor.afiliacao.trim()})`
    }
    
    if (autor.sigla_afiliacao && autor.sigla_afiliacao.trim()) {
      display += ` [${autor.sigla_afiliacao.trim()}]`
    }
    
    return display
  }

  // Função para formatar a parte usada
  const formatParteUsadaDisplay = (parte: ParteUsada) => {
    return parte.parte_usada || `Parte ${parte.id_uso}`
  }

  // Função para retentar carregamento
  const retryLoad = () => {
    setError(null)
    fetchFamilias()
    fetchPartesUsadas()
    fetchProvincias()
    fetchAutores()
    fetchIndicacoes()
    fetchPropriedades()
    fetchCompostos()
    fetchMetodosExtracao()
    fetchMetodosPreparacao()
    fetchRegioes()
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
                value={filters.popularName || ''}
                onChange={(e) => setFilters((prev) => ({ 
                  ...prev, 
                  popularName: e.target.value
                }))}
              />
              <button
                type="button"
                onClick={toggleRecordingPopular}
                className={`${styles.iconButton} ${isRecordingPopular ? styles.recording : ""}`}
                title="Busca por voz"
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
                value={filters.scientificName || ''}
                onChange={(e) => setFilters((prev) => ({ 
                  ...prev, 
                  scientificName: e.target.value
                }))}
              />
              <button
                type="button"
                onClick={toggleRecordingScientific}
                className={`${styles.iconButton} ${isRecordingScientific ? styles.recording : ""}`}
                title="Busca por voz"
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

          {/* Família Botânica */}
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

          {/* Parte da Planta Usada (String) - para busca geral */}
          <div className={styles.formGroup}>
            <label htmlFor="parteUsada" className={styles.formLabel}>
              Parte da Planta Usada
            </label>
            <select
              id="parteUsada"
              className={styles.formSelect}
              value={filters.parteUsada || ''}
              onChange={(e) => setFilters((prev) => ({ 
                ...prev, 
                parteUsada: e.target.value,
                parteId: '' // Limpar o ID quando selecionar por string
              }))}
              disabled={loadingPartesUsadas}
            >
              <option value="">
                {loadingPartesUsadas ? "Carregando partes usadas..." : 
                 partesUnicas.length === 0 ? "Nenhuma parte encontrada" :
                 "Escolha uma parte usada..."}
              </option>
              {partesUnicas.map((parte) => (
                <option key={parte} value={parte}>
                  {parte}
                </option>
              ))}
            </select>
            {loadingPartesUsadas && (
              <p className={styles.loadingText}>Carregando partes usadas...</p>
            )}
          </div>

          {/* Parte Específica (ID) - para busca por uso específico */}
          <div className={styles.formGroup}>
            <label htmlFor="parteEspecifica" className={styles.formLabel}>
              Parte Específica (Uso Específico)
            </label>
            <select
              id="parteEspecifica"
              className={styles.formSelect}
              value={filters.parteId || ''}
              onChange={(e) => setFilters((prev) => ({ 
                ...prev, 
                parteId: e.target.value,
                parteUsada: '' // Limpar a string quando selecionar por ID
              }))}
              disabled={loadingPartesUsadas}
            >
              <option value="">
                {loadingPartesUsadas ? "Carregando partes..." : 
                 partesUsadas.length === 0 ? "Nenhuma parte encontrada" :
                 "Escolha uma parte específica..."}
              </option>
              {partesUsadas.map((parte) => (
                <option key={parte.id_uso} value={parte.id_uso.toString()}>
                  {formatParteUsadaDisplay(parte)}
                </option>
              ))}
            </select>
            <p className={styles.helpText}>
              <small>Use esta opção para buscar plantas com usos específicos documentados.</small>
            </p>
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

          {/* Província */}
          <div className={styles.formGroup}>
            <label htmlFor="provincia" className={styles.formLabel}>
              Província
            </label>
            <select
              id="provincia"
              className={styles.formSelect}
              value={filters.provincia || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, provincia: e.target.value, regiao: '' }))}
              disabled={loadingProvincias}
            >
              <option value="">
                {loadingProvincias ? "Carregando províncias..." : 
                 provincias.length === 0 ? "Nenhuma província encontrada" :
                 "Escolha uma província..."}
              </option>
              {provincias.map((provincia) => (
                <option key={provincia.id_provincia} value={provincia.id_provincia.toString()}>
                  {provincia.nome_provincia}
                </option>
              ))}
            </select>
            {loadingProvincias && (
              <p className={styles.loadingText}>Carregando províncias...</p>
            )}
          </div>

          {/* Região (baseada na província selecionada) */}
          {filters.provincia && regioes.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="regiao" className={styles.formLabel}>
                Região
              </label>
              <select
                id="regiao"
                className={styles.formSelect}
                value={filters.regiao || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, regiao: e.target.value }))}
                disabled={loadingRegioes}
              >
                <option value="">
                  {loadingRegioes ? "Carregando regiões..." : 
                   regioes.length === 0 ? "Nenhuma região encontrada" :
                   "Escolha uma região (opcional)..."}
                </option>
                {regioes.map((regiao) => (
                  <option key={regiao.id_regiao} value={regiao.id_regiao.toString()}>
                    {regiao.nome_regiao || `Região ${regiao.id_regiao}`}
                  </option>
                ))}
              </select>
              {loadingRegioes && (
                <p className={styles.loadingText}>Carregando regiões...</p>
              )}
            </div>
          )}

          <p className={styles.helpText}>
            {translate("search.empty")} Deixe os campos vazios para ver todas as plantas.
          </p>

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