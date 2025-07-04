"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'  // ✅ ADICIONADO
import styles from "./header.module.css"

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void
}

interface SearchResult {
  id: number
  tipo: 'planta' | 'familia' | 'autor'
  nome_cientifico?: string
  nome_comum?: string
  familia?: string
  nome?: string
  afiliacao?: string
  total_nomes_comuns?: number
}

interface SearchResponse {
  plantas: SearchResult[]
  familias: SearchResult[]
  autores: SearchResult[]
  total_encontrado: number
}

export function AdminHeader({ onToggleMobileMenu }: AdminHeaderProps) {
  // ✅ ADICIONADO ROUTER
  const router = useRouter()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeSearchFilter, setActiveSearchFilter] = useState("Plantas")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")

  // Refs para detectar cliques fora
  const searchRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001'

  // ✅ NOVA: Hook para detectar tamanho da tela
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Função para fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
      
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    if (isSearchOpen || isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen, isProfileOpen])

  // Função para alterar filtro de pesquisa
  const handleSearchFilterChange = (filter: string) => {
    console.log(`🔄 Mudando filtro para: ${filter}`)
    setActiveSearchFilter(filter)
    
    // Se há termo de busca, realizar nova busca com o filtro alterado
    if (searchTerm.trim()) {
      performSearchWithPages(searchTerm, filter)
    }
  }

  // Função para realizar pesquisa
  const performSearch = async (term: string, filter: string = activeSearchFilter) => {
    if (!term.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    setSearchError("")

    try {
      // Mapear filtros para tipos da API
      const filterMap: { [key: string]: string } = {
        "Plantas": "plantas",
        "Famílias": "familias", 
        "Autores": "autores"
      }

      const apiFilter = filter === "Todos" ? "todos" : filterMap[filter] || "plantas"
      
      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/busca?q=${encodeURIComponent(term)}&tipo=${apiFilter}&limit=10`
      )

      if (!response.ok) {
        throw new Error(`Erro na pesquisa: ${response.status}`)
      }

      const data: SearchResponse = await response.json()
      setSearchResults(data)

    } catch (error) {
      console.error("Erro na pesquisa:", error)
      setSearchError("Erro ao pesquisar. Tente novamente.")
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce para pesquisa em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && isSearchOpen) {
        performSearchWithPages(searchTerm)
      } else if (!searchTerm.trim()) {
        setSearchResults(null)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, activeSearchFilter, isSearchOpen])

  // ✅ ADICIONAR ESTADO PARA DEBOUNCED SEARCH
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")

  // ✅ USEEFFECT PARA DEBOUNCED TERM
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleResultClick = async (result: SearchResult) => {
    console.log('🔍 Clicando em resultado:', result)
    
    // ✅ IMPORTANTE: Limpar estado ANTES de navegar
    setIsSearchOpen(false)
    setSearchTerm("")
    setSearchResults(null)
    setSearchError("")
    setIsSearching(false)
    
    // ✅ ADICIONAR: Pequeno delay para garantir limpeza do estado
    await new Promise(resolve => setTimeout(resolve, 100))
    
    let url = ""
    
    try {
      switch (result.tipo) {
        case 'planta':
          console.log('📊 Calculando página da planta...', result.id)
          
          // ✅ USAR NOME CIENTÍFICO PARA BUSCA PRECISA
          const plantaParams = new URLSearchParams({
            limit: '10',
            search: result.nome_cientifico || '',
            search_type: 'geral'
          })
          
          console.log('📋 Parâmetros da busca:', Object.fromEntries(plantaParams))
          
          const plantaResponse = await fetch(`${API_BASE_URL}/api/admin/plantas/${result.id}/page-info?${plantaParams}`)
          
          if (plantaResponse.ok) {
            const pageInfo = await plantaResponse.json()
            console.log('✅ Página da planta calculada:', pageInfo)
            
            // ✅ CONSTRUIR URL COM TIMESTAMP para forçar recarregamento
            const timestamp = Date.now()
            url = `/admin/plants?page=${pageInfo.page}&highlight=${result.id}&search_type=geral&search_term=${encodeURIComponent(result.nome_cientifico || '')}&t=${timestamp}`
          } else {
            console.log('⚠️ Falha ao calcular página:', await plantaResponse.text())
            const timestamp = Date.now()
            url = `/admin/plants?search_type=geral&search_term=${encodeURIComponent(result.nome_cientifico || '')}&highlight=${result.id}&t=${timestamp}`
          }
          break
          
        case 'familia':
          console.log('📊 Calculando página da família...', result.id)
          
          const familiaParams = new URLSearchParams({
            limit: '10',
            search: result.nome || ''
          })
          
          const familiaResponse = await fetch(`${API_BASE_URL}/api/admin/familias/${result.id}/page-info?${familiaParams}`)
          
          if (familiaResponse.ok) {
            const pageInfo = await familiaResponse.json()
            console.log('✅ Página da família calculada:', pageInfo)
            
            const timestamp = Date.now()
            url = `/admin/familias?page=${pageInfo.page}&highlight=${result.id}&search=${encodeURIComponent(result.nome || '')}&t=${timestamp}`
          } else {
            console.log('⚠️ Falha ao calcular página da família')
            const timestamp = Date.now()
            url = `/admin/familias?search=${encodeURIComponent(result.nome || '')}&highlight=${result.id}&t=${timestamp}`
          }
          break
          
        // ✅ NOVO: Caso para autores
        case 'autor':
          console.log('📊 Calculando página do autor...', result.id)
          
          const autorParams = new URLSearchParams({
            limit: '10',
            search: result.nome || ''
          })
          
          const autorResponse = await fetch(`${API_BASE_URL}/api/admin/autores/${result.id}/page-info?${autorParams}`)
          
          if (autorResponse.ok) {
            const pageInfo = await autorResponse.json()
            console.log('✅ Página do autor calculada:', pageInfo)
            
            const timestamp = Date.now()
            url = `/admin/references?page=${pageInfo.page}&highlight=${result.id}&search=${encodeURIComponent(result.nome || '')}&type=autor&t=${timestamp}`
          } else {
            console.log('⚠️ Falha ao calcular página do autor')
            const timestamp = Date.now()
            url = `/admin/references?search=${encodeURIComponent(result.nome || '')}&highlight=${result.id}&type=autor&t=${timestamp}`
          }
          break
      }

      console.log('🚀 Navegando para:', url)

      if (url) {
        // ✅ FORÇAR NAVEGAÇÃO COMPLETA COM LIMPEZA
        window.location.href = url
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar resultado:', error)
      
      // ✅ FALLBACK com timestamp
      const timestamp = Date.now()
      switch (result.tipo) {
        case 'planta':
          window.location.href = `/admin/plants?highlight=${result.id}&t=${timestamp}`
          break
        case 'familia':
          window.location.href = `/admin/familias?highlight=${result.id}&t=${timestamp}`
          break
        // ✅ NOVO: Fallback para autor
        case 'autor':
          window.location.href = `/admin/authors-references?highlight=${result.id}&type=autor&t=${timestamp}`
          break
      }
    }
  }

  const performSearchWithPages = async (term: string, filter: string = activeSearchFilter) => {
    if (!term.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    setSearchError("")

    try {
      console.log(`🔍 Buscando "${term}" em ${filter}`)
      
      const filterMap: { [key: string]: string } = {
        "Plantas": "plantas",
        "Famílias": "familias", 
        "Autores": "autores"
      }

      const apiFilter = filter === "Todos" ? "todos" : filterMap[filter] || "plantas"
      
      // ✅ USAR SEU ENDPOINT DE BUSCA MELHORADO
      const response = await fetch(
        `${API_BASE_URL}/api/admin/dashboard/busca?q=${encodeURIComponent(term)}&tipo=${apiFilter}&limit=10`
      )

      if (!response.ok) {
        throw new Error(`Erro na pesquisa: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Resultados de busca:', data)
      
      // ✅ MAPEAR RESULTADOS PARA O FORMATO ESPERADO
      const searchResults: SearchResponse = {
        plantas: data.plantas?.map((planta: any) => ({
          ...planta,
          tipo: 'planta' as const,
          nome_cientifico: planta.nome_cientifico,
          nome_comum: planta.nome_comum,
          familia: planta.familia
        })) || [],
        familias: data.familias?.map((familia: any) => ({
          ...familia,
          tipo: 'familia' as const,
          nome: familia.nome
        })) || [],
        autores: data.autores?.map((autor: any) => ({
          ...autor,
          tipo: 'autor' as const,
          nome: autor.nome
        })) || [],
        total_encontrado: data.total_encontrado || 0
      }

      setSearchResults(searchResults)

    } catch (error) {
      console.error("❌ Erro na pesquisa:", error)
      setSearchError("Erro ao pesquisar. Tente novamente.")
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }

  // Função para lidar com Enter na pesquisa
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults && searchResults.total_encontrado > 0) {
      const firstResult = searchResults.plantas[0] || searchResults.familias[0] || searchResults.autores[0]
      if (firstResult) {
        handleResultClick(firstResult)
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  // ✅ NOVA FUNÇÃO: Formatação inteligente dos nomes comuns
  const formatarNomesComuns = (nomesComuns: string | null | undefined, maxLength: number = 45) => {
    if (!nomesComuns) return { texto: null, contador: null }

    const nomes = nomesComuns.split(', ').map(nome => nome.trim()).filter(nome => nome.length > 0)
    
    if (nomes.length === 0) return { texto: null, contador: null }
    if (nomes.length === 1) return { texto: nomes[0], contador: null }

    // Começar com o primeiro nome
    let textoExibido = nomes[0]
    let nomesIncluidos = 1

    // Adicionar nomes até atingir o limite de caracteres
    for (let i = 1; i < nomes.length; i++) {
      const proximoTexto = textoExibido + ', ' + nomes[i]
      
      // Reservar espaço para " +X nomes" (aproximadamente 8-10 caracteres)
      if (proximoTexto.length > maxLength - 10) {
        break
      }
      
      textoExibido = proximoTexto
      nomesIncluidos++
    }

    const nomesRestantes = nomes.length - nomesIncluidos

    return {
      texto: textoExibido,
      contador: nomesRestantes > 0 ? `+${nomesRestantes}` : null
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <div className={styles.titleContainer}>
            <button 
              className={styles.mobileMenuButton}
              onClick={onToggleMobileMenu}
              aria-label="Abrir menu"
            >
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
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            <h1 className={styles.title}>Painel Administrativo</h1>
          </div>

          <div className={styles.actions}>
            <div className={styles.searchContainer} ref={searchRef}>
              <button 
                className={styles.actionButton}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Pesquisar"
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
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* ✅ OVERLAY para mobile */}
              {isSearchOpen && isMobile && (
                <div 
                  className={styles.searchOverlay}
                  onClick={() => setIsSearchOpen(false)}
                />
              )}

              {isSearchOpen && (
                <div 
                  className={styles.searchDropdown}
                  style={{
                    // ✅ POSICIONAMENTO DINÂMICO: Ajustar baseado no tamanho da tela
                    ...(isMobile && {
                      position: 'fixed',
                      top: '4rem',
                      left: '0.5rem',
                      right: '0.5rem',
                      width: 'auto',
                      zIndex: 9999
                    })
                  }}
                >
                  <div className={styles.searchInputContainer}>
                    <input
                      type="text"
                      placeholder="Pesquisar plantas, famílias, autores..."
                      className={styles.searchInput}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                  </div>
                  
                  <div className={styles.searchFilters}>
                    <div className={styles.searchFilterGroup}>
                      <span className={styles.searchFilterLabel}>Buscar em:</span>
                      <div className={styles.searchFilterButtons}>
                        {['Plantas', 'Famílias', 'Autores'].map((filter) => (
                          <button 
                            key={filter}
                            className={`${styles.searchFilterButton} ${activeSearchFilter === filter ? styles.active : ''}`}
                            onClick={() => handleSearchFilterChange(filter)}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ✅ RESULTADOS - ESTILO ORIGINAL BONITO RESTAURADO */}
                  {(searchTerm.trim() || searchResults) && (
                    <div style={{ 
                      padding: '1rem', 
                      maxHeight: isMobile ? '60vh' : '20rem',  // ✅ RESPONSIVO: Altura máxima dinâmica
                      overflowY: 'auto' 
                    }}>
                      {isSearching && (
                        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                          🔍 Pesquisando...
                        </div>
                      )}

                      {searchError && (
                        <div style={{ color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
                          ⚠️ {searchError}
                        </div>
                      )}

                      {searchResults && !isSearching && searchResults.total_encontrado === 0 && (
                        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                          Nenhum resultado encontrado para "{searchTerm}"
                        </div>
                      )}

                      {searchResults && !isSearching && searchResults.total_encontrado > 0 && (
                        <div>
                          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            {searchResults.total_encontrado} resultado(s) encontrado(s)
                          </div>

                          {/* Plantas - Estilo original bonito */}
                          {searchResults.plantas && searchResults.plantas.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                🌿 Plantas ({searchResults.plantas.length})
                              </h4>
                              {searchResults.plantas.map((planta) => {
                                // ✅ FORMATAÇÃO: Aplicar formatação inteligente dos nomes comuns
                                const nomesFormatados = formatarNomesComuns(planta.nome_comum, isMobile ? 30 : 45)  // ✅ RESPONSIVO: Limite menor em mobile
                                
                                return (
                                  <div
                                    key={`planta-${planta.id}`}
                                    onClick={() => handleResultClick(planta)}
                                    style={{
                                      padding: '0.5rem',
                                      borderRadius: '0.25rem',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      marginBottom: '0.25rem',
                                      border: '1px solid #e5e7eb',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    {/* ✅ TAXONOMIA: Nome científico em itálico */}
                                    <div style={{ fontWeight: '500', color: '#111827', fontStyle: 'italic' }}>
                                      {planta.nome_cientifico}
                                    </div>
                                    
                                    {/* ✅ NOMES COMUNS: Formatação inteligente com contador */}
                                    {nomesFormatados.texto && (
                                      <div style={{ 
                                        color: '#6b7280', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        marginTop: '0.125rem'
                                      }}>
                                        <span>{nomesFormatados.texto}</span>
                                        {nomesFormatados.contador && (
                                          <span style={{ 
                                            backgroundColor: '#e0e7ff', 
                                            color: '#4338ca',
                                            fontSize: '0.625rem',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '0.75rem',
                                            fontWeight: '500'
                                          }}>
                                            {nomesFormatados.contador}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* ✅ TAXONOMIA: Família em maiúsculas */}
                                    {planta.familia && (
                                      <div style={{ 
                                        color: '#9333ea', 
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.025em',
                                        marginTop: '0.125rem'
                                      }}>
                                        {planta.familia}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Famílias - Estilo original bonito */}
                          {searchResults.familias && searchResults.familias.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                🌳 Famílias ({searchResults.familias.length})
                              </h4>
                              {searchResults.familias.map((familia) => (
                                <div
                                  key={`familia-${familia.id}`}
                                  onClick={() => handleResultClick(familia)}
                                  style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    marginBottom: '0.25rem',
                                    border: '1px solid #e5e7eb',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  {/* ✅ TAXONOMIA: Família em maiúsculas */}
                                  <div style={{ 
                                    fontWeight: '500', 
                                    color: '#111827',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em'
                                  }}>
                                    {familia.nome}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Autores - Estilo original bonito */}
                          {searchResults.autores && searchResults.autores.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                👨‍🔬 Autores ({searchResults.autores.length})
                              </h4>
                              {searchResults.autores.map((autor) => (
                                <div
                                  key={`autor-${autor.id}`}
                                  onClick={() => handleResultClick(autor)}
                                  style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    marginBottom: '0.25rem',
                                    border: '1px solid #e5e7eb',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <div style={{ fontWeight: '500', color: '#111827' }}>
                                    {autor.nome}
                                  </div>
                                  {autor.afiliacao && (
                                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                      {autor.afiliacao}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.searchShortcuts}>
                    <div className={styles.searchShortcutItem}>
                      <span className={styles.searchShortcutKey}>↵</span>
                      <span className={styles.searchShortcutText}>Selecionar primeiro resultado</span>
                    </div>
                    <div className={styles.searchShortcutItem}>
                      <span className={styles.searchShortcutKey}>Esc</span>
                      <span className={styles.searchShortcutText}>Fechar pesquisa</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ BOTÃO ATUALIZADO: Adicionar nova planta com navegação */}
            <Link href="/admin/plants/add" title="Adicionar nova planta">
              <button className={styles.actionButton}>
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
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </Link>

            <div className={styles.profileContainer} ref={profileRef}>
              <button
                className={styles.profileButton}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className={styles.avatar}>A</div>
                <span className={styles.profileName}>Admin</span>
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
                  className={styles.profileArrow}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className={styles.profileDropdown}>
                  <Link href="/admin/profile" className={styles.profileLink}>
                    Seu Perfil
                  </Link>
                  <Link href="/admin/settings" className={styles.profileLink}>
                    Configurações
                  </Link>
                  <div className={styles.profileDivider} />
                  <Link href="/" className={styles.profileLink}>
                    Sair
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}