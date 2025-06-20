"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import styles from "./referencias.module.css"

interface Referencia {
  id_referencia: number
  link_referencia: string
  plantas_associadas?: PlantaAssociada[]
  autores_associados?: AutorAssociado[]
}

interface PlantaAssociada {
  id_planta: number
  nome_cientifico: string
  nomes_comuns: string[]
}

interface AutorAssociado {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function Referencias() {
  const [referencias, setReferencias] = useState<Referencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredReferencias, setFilteredReferencias] = useState<Referencia[]>([])
  const [filterType, setFilterType] = useState<'all' | 'autor' | 'planta'>('all')

  useEffect(() => {
    fetchReferencias()
  }, [])

  useEffect(() => {
    // Filtrar referências baseado no termo de busca e tipo de filtro
    if (searchTerm.trim()) {
      const filtered = referencias.filter(ref => {
        const searchLower = searchTerm.toLowerCase()
        
        // Buscar no link da referência
        const linkMatch = ref.link_referencia.toLowerCase().includes(searchLower)
        
        // Buscar nos autores associados
        const autorMatch = ref.autores_associados?.some(autor => 
          autor.nome_autor.toLowerCase().includes(searchLower) ||
          (autor.afiliacao && autor.afiliacao.toLowerCase().includes(searchLower)) ||
          (autor.sigla_afiliacao && autor.sigla_afiliacao.toLowerCase().includes(searchLower))
        ) || false
        
        // Buscar nas plantas associadas
        const plantaMatch = ref.plantas_associadas?.some(planta =>
          planta.nome_cientifico.toLowerCase().includes(searchLower) ||
          planta.nomes_comuns.some(nome => nome.toLowerCase().includes(searchLower))
        ) || false
        
        // Aplicar filtro baseado no tipo selecionado
        switch (filterType) {
          case 'autor':
            return autorMatch
          case 'planta':
            return plantaMatch
          case 'all':
          default:
            return linkMatch || autorMatch || plantaMatch
        }
      })
      setFilteredReferencias(filtered)
    } else {
      setFilteredReferencias(referencias)
    }
  }, [searchTerm, referencias, filterType])

  const fetchReferencias = async () => {
    try {
      setLoading(true)
      
      // Tentar usar o endpoint específico primeiro
      let response = await fetch(`${API_BASE_URL}/referencias-com-associacoes`)
      
      if (response.ok) {
        const data = await response.json()
        setReferencias(data.referencias || [])
        return
      }
      
      // Fallback para o endpoint básico se o específico não existir
      response = await fetch(`${API_BASE_URL}/referencias`)
      
      if (response.ok) {
        const data = await response.json()
        const referenciasData = Array.isArray(data) ? data : []
        
        // Para cada referência, tentar buscar associações através de endpoints individuais
        const referenciasEnriquecidas = await Promise.all(
          referenciasData.map(async (ref: any) => {
            let plantasAssociadas: PlantaAssociada[] = []
            let autoresAssociados: AutorAssociado[] = []
            
            try {
              // Tentar buscar plantas associadas
              const plantasResponse = await fetch(`${API_BASE_URL}/referencias/${ref.id_referencia}/plantas`)
              if (plantasResponse.ok) {
                const plantasData = await plantasResponse.json()
                if (plantasData.plantas) {
                  plantasAssociadas = plantasData.plantas.map((planta: any) => ({
                    id_planta: planta.id_planta,
                    nome_cientifico: planta.nome_cientifico,
                    nomes_comuns: planta.nomes_comuns || []
                  }))
                  
                  // Extrair autores únicos das plantas
                  const autoresMap = new Map()
                  plantasData.plantas.forEach((planta: any) => {
                    if (planta.autores) {
                      planta.autores.forEach((autor: any) => {
                        if (!autoresMap.has(autor.id_autor)) {
                          autoresMap.set(autor.id_autor, {
                            id_autor: autor.id_autor,
                            nome_autor: autor.nome_autor,
                            afiliacao: autor.afiliacao,
                            sigla_afiliacao: autor.sigla_afiliacao
                          })
                        }
                      })
                    }
                  })
                  autoresAssociados = Array.from(autoresMap.values())
                }
              }
            } catch (error) {
              console.warn(`Erro ao buscar associações para referência ${ref.id_referencia}:`, error)
            }
            
            return {
              ...ref,
              plantas_associadas: plantasAssociadas,
              autores_associados: autoresAssociados
            }
          })
        )
        
        setReferencias(referenciasEnriquecidas)
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Erro ao carregar referências:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const formatReference = (link: string): string => {
    // Tentar extrair título ou informação útil do link
    if (isValidUrl(link)) {
      const url = new URL(link)
      let domain = url.hostname.replace('www.', '')
      
      // Retornar domínio de forma mais amigável
      if (domain.includes('doi.org')) {
        return `DOI: ${url.pathname.substring(1)}`
      } else if (domain.includes('pubmed') || domain.includes('ncbi')) {
        return `PubMed/NCBI: ${url.pathname}`
      } else if (domain.includes('scielo')) {
        return `SciELO: ${url.pathname}`
      } else if (domain.includes('researchgate')) {
        return `ResearchGate: ${url.pathname}`
      } else {
        return domain
      }
    }
    return link
  }

  const getReferenceType = (link: string): string => {
    if (link.includes('doi.org')) return 'DOI'
    if (link.includes('pubmed') || link.includes('ncbi')) return 'PubMed'
    if (link.includes('scielo')) return 'SciELO'
    if (link.includes('researchgate')) return 'ResearchGate'
    if (link.includes('scholar.google')) return 'Google Scholar'
    if (link.includes('.pdf')) return 'PDF'
    if (isValidUrl(link)) return 'Web'
    return 'Outro'
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'DOI': return '#007acc'
      case 'PubMed': return '#326295'
      case 'SciELO': return '#d73027'
      case 'ResearchGate': return '#00ccbb'
      case 'Google Scholar': return '#4285f4'
      case 'PDF': return '#ff6b35'
      case 'Web': return '#28a745'
      default: return '#6c757d'
    }
  }

  return (
    <main>
      <Header />
      <div className="container">
        <div className={styles.referenciasContainer}>
          <div className={styles.referenciasHeader}>
            <h1 className={styles.referenciasTitle}>Referências Bibliográficas</h1>
            <p className={styles.referenciasSubtitle}>
              Fonte científica das informações sobre plantas medicinais de Moçambique
            </p>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Pesquisar por referência, autor ou planta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Todos
                </button>
                <button 
                  className={`${styles.filterButton} ${filterType === 'autor' ? styles.active : ''}`}
                  onClick={() => setFilterType('autor')}
                >
                  Por Autor
                </button>
                <button 
                  className={`${styles.filterButton} ${filterType === 'planta' ? styles.active : ''}`}
                  onClick={() => setFilterType('planta')}
                >
                  Por Planta
                </button>
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{referencias.length}</div>
              <div className={styles.statLabel}>Total de Referências</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{filteredReferencias.length}</div>
              <div className={styles.statLabel}>Resultados Filtrados</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {referencias.reduce((total, ref) => total + (ref.autores_associados?.length || 0), 0)}
              </div>
              <div className={styles.statLabel}>Autores Associados</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>
                {referencias.reduce((total, ref) => total + (ref.plantas_associadas?.length || 0), 0)}
              </div>
              <div className={styles.statLabel}>Plantas Associadas</div>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <p>⚠️ Erro ao carregar referências: {error}</p>
              <button onClick={fetchReferencias} className={styles.retryButton}>
                Tentar Novamente
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Carregando referências...</p>
            </div>
          ) : (
            <div className={styles.referenciasContent}>
              {filteredReferencias.length === 0 ? (
                <div className={styles.noResults}>
                  <svg className={styles.noResultsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className={styles.noResultsTitle}>Nenhuma referência encontrada</h3>
                  <p className={styles.noResultsText}>
                    {searchTerm ? 
                      `Não foram encontradas referências para "${searchTerm}"` : 
                      'Não há referências disponíveis no momento'
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.referenciasList}>
                  {filteredReferencias.map((referencia, index) => {
                    const type = getReferenceType(referencia.link_referencia)
                    const typeColor = getTypeColor(type)
                    const isUrl = isValidUrl(referencia.link_referencia)
                    
                    return (
                      <div key={referencia.id_referencia} className={styles.referenciaCard}>
                        <div className={styles.referenciaHeader}>
                          <span className={styles.referenciaNumber}>#{index + 1}</span>
                          <span 
                            className={styles.referenciaType}
                            style={{ backgroundColor: typeColor }}
                          >
                            {type}
                          </span>
                        </div>
                        
                        <div className={styles.referenciaContent}>
                          <div className={styles.referenciaTitle}>
                            {formatReference(referencia.link_referencia)}
                          </div>
                          
                          {/* Autores Associados */}
                          {referencia.autores_associados && referencia.autores_associados.length > 0 && (
                            <div className={styles.associacaoSection}>
                              <h4 className={styles.associacaoTitle}>
                                <svg className={styles.associacaoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Autores ({referencia.autores_associados.length})
                              </h4>
                              <div className={styles.autoresList}>
                                {referencia.autores_associados.map((autor) => (
                                  <div key={autor.id_autor} className={styles.autorItem}>
                                    <span className={styles.autorNome}>{autor.nome_autor}</span>
                                    {autor.afiliacao && (
                                      <span className={styles.autorAfiliacao}>
                                        {autor.afiliacao}
                                        {autor.sigla_afiliacao && ` (${autor.sigla_afiliacao})`}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Plantas Associadas */}
                          {referencia.plantas_associadas && referencia.plantas_associadas.length > 0 && (
                            <div className={styles.associacaoSection}>
                              <h4 className={styles.associacaoTitle}>
                                <svg className={styles.associacaoIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                Plantas ({referencia.plantas_associadas.length})
                              </h4>
                              <div className={styles.plantasList}>
                                {referencia.plantas_associadas.map((planta) => (
                                  <div key={planta.id_planta} className={styles.plantaItem}>
                                    <span className={styles.plantaCientifica}>{planta.nome_cientifico}</span>
                                    {planta.nomes_comuns.length > 0 && (
                                      <span className={styles.plantaComuns}>
                                        ({planta.nomes_comuns.slice(0, 2).join(', ')}
                                        {planta.nomes_comuns.length > 2 && '...'})
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className={styles.referenciaLink}>
                            {isUrl ? (
                              <a 
                                href={referencia.link_referencia}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkButton}
                              >
                                <svg className={styles.linkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Abrir Link
                              </a>
                            ) : (
                              <span className={styles.textReference}>
                                {referencia.link_referencia}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className={styles.infoSection}>
            <h2 className={styles.infoTitle}>Sobre as Referências</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Fontes Científicas</h3>
                <p className={styles.infoCardText}>
                  Todas as referências foram cuidadosamente selecionadas de revistas científicas indexadas, 
                  teses académicas e publicações confiáveis.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Validação</h3>
                <p className={styles.infoCardText}>
                  As informações passaram por processo de validação académica para garantir 
                  a qualidade e confiabilidade dos dados.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Actualização</h3>
                <p className={styles.infoCardText}>
                  A base de dados é constantemente actualizada com novas descobertas e 
                  publicações relevantes na área.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}