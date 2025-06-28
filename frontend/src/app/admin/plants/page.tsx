"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./plants.module.css"
import modalStyles from "./modal.module.css" // ✅ IMPORTAR CSS DOS MODALS

// ✅ TIPOS DEFINIDOS PARA TYPESCRIPT
interface Planta {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  data_adicao: string
  familia: string
  nomes_comuns: string[]
  provincias: string[]
}

interface PlantaDetalhada {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  data_adicao: string
  familia: {
    id_familia: number
    nome_familia: string
  }
  nomes_comuns: Array<{
    id_nome: number
    nome_comum: string
  }>
  provincias: Array<{
    id_provincia: number
    nome_provincia: string
  }>
  usos_medicinais: Array<{
    id_uso: number
    parte_usada: string
    observacoes?: string
  }>
  autores: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
  }>
  referencias: Array<{
    id_referencia: number
    titulo?: string
    tipo?: string
    ano?: string
    link?: string
  }>
}

interface Familia {
  id_familia: number
  nome_familia: string
  total_plantas: number
}

interface Provincia {
  id_provincia: number
  nome_provincia: string
  total_plantas: number
}

interface PaginatedResponse<T> {
  plantas?: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  erro?: string
  fallback?: boolean
  message?: string
}

interface FamiliasResponse {
  familias: Familia[]
  total: number
}

interface ProvinciasResponse {
  provincias: Provincia[]
  total: number
}

type SearchType = "geral" | "autor" | "parte_usada" | "indicacao" | "composto" | "propriedade"
type SortField = "nome_cientifico" | "familia" | "data_adicao" | "nomes_comuns"
type SortOrder = "asc" | "desc"

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function PlantsPage() {
  // Estados para os dados reais da API
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedFamily, setSelectedFamily] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [searchType, setSearchType] = useState<SearchType>("geral")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)
  
  // ✅ Estado para debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  
  // Estados para opções de filtro
  const [familias, setFamilias] = useState<Familia[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalPlantas, setTotalPlantas] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<SortField>('nome_cientifico')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // ✅ NOVOS ESTADOS PARA MODALS
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [selectedPlanta, setSelectedPlanta] = useState<PlantaDetalhada | null>(null)
  const [loadingModal, setLoadingModal] = useState<boolean>(false)
  const [editFormData, setEditFormData] = useState<PlantaDetalhada | null>(null)

  // ✅ Hook para debounce do termo de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // ✅ useEffect que carrega plantas - agora usa debouncedSearchTerm
  useEffect(() => {
    carregarPlantas()
  }, [currentPage, itemsPerPage, debouncedSearchTerm, selectedFamily, selectedLocation, searchType, sortBy, sortOrder])

  // ✅ useEffect separado para mudanças imediatas
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFamily, selectedLocation, searchType, debouncedSearchTerm])

  // Carregar opções de filtro apenas uma vez
  useEffect(() => {
    carregarFiltros()
  }, [])

  // ✅ EFFECT: Prevenir scroll quando modal aberto
  useEffect(() => {
    if (showViewModal || showEditModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup quando componente desmonta
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showViewModal, showEditModal])

  const carregarPlantas = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      let endpoint = `${API_BASE_URL}/api/admin/plantas`
      
      if (debouncedSearchTerm) {
        if (searchType === 'geral') {
          params.append('search', debouncedSearchTerm)
        } else {
          endpoint = `${API_BASE_URL}/api/admin/plantas/busca-avancada`
          params.append(searchType, debouncedSearchTerm)
        }
      }
      
      if (selectedFamily) params.append('familia', selectedFamily)
      if (selectedLocation) params.append('provincia', selectedLocation)
      
      console.log(`🔄 Carregando plantas: ${endpoint}?${params}`)
      
      const response = await fetch(`${endpoint}?${params}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: PaginatedResponse<Planta> = await response.json()
      
      console.log('✅ Dados recebidos:', data)
      
      if (data.erro && (searchType === 'composto' || searchType === 'propriedade')) {
        setError(`Pesquisa por ${searchType === 'composto' ? 'composto químico' : 'propriedade farmacológica'} não está disponível. ${data.erro}`)
        setPlantas([])
        setTotalPlantas(0)
        setTotalPages(0)
        return
      }
      
      let plantasOrdenadas = data.plantas || []
      if (sortBy && plantasOrdenadas.length > 0) {
        plantasOrdenadas = [...plantasOrdenadas].sort((a, b) => {
          let aValue: string = ''
          let bValue: string = ''
          
          switch (sortBy) {
            case 'nome_cientifico':
              aValue = a.nome_cientifico || ''
              bValue = b.nome_cientifico || ''
              break
            case 'familia':
              aValue = (a.familia || '').toUpperCase()
              bValue = (b.familia || '').toUpperCase()
              break
            case 'data_adicao':
              aValue = a.data_adicao || ''
              bValue = b.data_adicao || ''
              break
            case 'nomes_comuns':
              aValue = Array.isArray(a.nomes_comuns) ? a.nomes_comuns.join(', ') : ''
              bValue = Array.isArray(b.nomes_comuns) ? b.nomes_comuns.join(', ') : ''
              break
            default:
              aValue = ''
              bValue = ''
          }
          
          if (sortOrder === 'asc') {
            return aValue.localeCompare(bValue, 'pt', { numeric: true })
          } else {
            return bValue.localeCompare(aValue, 'pt', { numeric: true })
          }
        })
      }
      
      setPlantas(plantasOrdenadas)
      setTotalPlantas(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      
      if (data.fallback) {
        console.log('ℹ️ Usando busca fallback:', data.message)
      }
      
    } catch (err) {
      console.error('❌ Erro ao carregar plantas:', err)
      
      if (debouncedSearchTerm && searchType !== 'geral') {
        console.log('🔄 Tentando busca fallback...')
        try {const fallbackParams = new URLSearchParams({
            search: debouncedSearchTerm,
            page: currentPage.toString(),
            limit: itemsPerPage.toString()
          })
          
          if (selectedFamily) fallbackParams.append('familia', selectedFamily)
          if (selectedLocation) fallbackParams.append('provincia', selectedLocation)
          
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/admin/plantas/busca-fallback?${fallbackParams}`)
          
          if (fallbackResponse.ok) {
            const fallbackData: PaginatedResponse<Planta> = await fallbackResponse.json()
            setPlantas(fallbackData.plantas || [])
            setTotalPlantas(fallbackData.total || 0)
            setTotalPages(Math.ceil((fallbackData.total || 0) / itemsPerPage))
            setError(`Busca específica por ${searchType.replace('_', ' ')} não disponível. Mostrando resultados de busca geral.`)
            return
          }
        } catch (fallbackErr) {
          console.error('❌ Erro na busca fallback:', fallbackErr)
        }
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar plantas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const carregarFiltros = async (): Promise<void> => {
    try {
      console.log('🔄 Carregando filtros...')
      
      const familiasResponse = await fetch(`${API_BASE_URL}/api/admin/familias`)
      if (familiasResponse.ok) {
        const familiasData: FamiliasResponse = await familiasResponse.json()
        setFamilias(familiasData.familias || [])
        console.log('✅ Famílias carregadas:', familiasData.familias?.length)
      }
      
      const provinciasResponse = await fetch(`${API_BASE_URL}/api/admin/provincias`)
      if (provinciasResponse.ok) {
        const provinciasData: ProvinciasResponse = await provinciasResponse.json()
        setProvincias(provinciasData.provincias || [])
        console.log('✅ Províncias carregadas:', provinciasData.provincias?.length)
      }
    } catch (err) {
      console.error('❌ Erro ao carregar filtros:', err)
    }
  }

  // ✅ NOVA FUNÇÃO: Carregar detalhes da planta
  const carregarDetalhesPlanta = async (id: number): Promise<PlantaDetalhada | null> => {
    try {
      setLoadingModal(true)
      console.log(`🔄 Carregando detalhes da planta ${id}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: PlantaDetalhada = await response.json()
      console.log('✅ Detalhes carregados:', data)
      
      return data
    } catch (err) {
      console.error('❌ Erro ao carregar detalhes:', err)
      alert('Erro ao carregar detalhes da planta')
      return null
    } finally {
      setLoadingModal(false)
    }
  }

  // ✅ NOVA FUNÇÃO: Abrir modal de visualização
  const handleViewPlanta = async (id: number): Promise<void> => {
    const detalhes = await carregarDetalhesPlanta(id)
    if (detalhes) {
      setSelectedPlanta(detalhes)
      setShowViewModal(true)
    }
  }

  // ✅ NOVA FUNÇÃO: Abrir modal de edição
  const handleEditPlanta = async (id: number): Promise<void> => {
    const detalhes = await carregarDetalhesPlanta(id)
    if (detalhes) {
      setSelectedPlanta(detalhes)
      setEditFormData({ ...detalhes }) // Cópia para edição
      setShowEditModal(true)
    }
  }

  // ✅ NOVA FUNÇÃO: Fechar modals
  const fecharModals = (): void => {
    setShowViewModal(false)
    setShowEditModal(false)
    setSelectedPlanta(null)
    setEditFormData(null)
  }

  // ✅ NOVA FUNÇÃO: Salvar edições
  const salvarEdicoes = async (): Promise<void> => {
    if (!editFormData) return

    try {
      setLoadingModal(true)
      console.log(`💾 Salvando edições da planta ${editFormData.id_planta}`)

      const dataToSend = {
        nome_cientifico: editFormData.nome_cientifico,
        id_familia: editFormData.familia.id_familia,
        numero_exsicata: editFormData.numero_exsicata,
        nomes_comuns: editFormData.nomes_comuns.map(nome => nome.nome_comum),
        provincias: editFormData.provincias.map(prov => prov.id_provincia)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${editFormData.id_planta}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar alterações')
      }

      console.log('✅ Planta atualizada com sucesso')
      alert('Planta atualizada com sucesso!')
      
      // Fechar modal e recarregar lista
      fecharModals()
      await carregarPlantas()

    } catch (err) {
      console.error('❌ Erro ao salvar:', err)
      alert('Erro ao salvar alterações. Tente novamente.')
    } finally {
      setLoadingModal(false)
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm("Tem certeza que deseja excluir esta planta?")) {
      return
    }
    
    try {
      console.log(`🗑️ Excluindo planta ${id}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir planta')
      }
      
      console.log('✅ Planta excluída com sucesso')
      await carregarPlantas()
      
    } catch (err) {
      console.error('❌ Erro ao excluir planta:', err)
      alert('Erro ao excluir planta. Tente novamente.')
    }
  }

  const limparFiltros = (): void => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedFamily("")
    setSelectedLocation("")
    setSearchType("geral")
    setCurrentPage(1)
    setSortBy('nome_cientifico')
    setSortOrder('asc')
  }

  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPage(1)
  }

  const isSearching: boolean = searchTerm !== debouncedSearchTerm && searchTerm.length > 0

  const formatarData = (dataString: string | null | undefined): string => {
    if (!dataString) return 'Data não informada'
    try {
      const data = new Date(dataString)
      return data.toLocaleDateString('pt-BR')
    } catch {
      return dataString
    }
  }

  const formatarNomesComuns = (nomesComuns: string[] | null | undefined): string => {
    if (!nomesComuns || nomesComuns.length === 0) {
      return 'Sem nome comum'
    }
    if (Array.isArray(nomesComuns)) {
      return nomesComuns.join(', ')
    }
    return String(nomesComuns)
  }

  const formatarProvincias = (provincias: string[] | null | undefined): string => {
    if (!provincias || provincias.length === 0) {
      return 'Não informado'
    }
    if (Array.isArray(provincias)) {
      return provincias.join(', ')
    }
    return String(provincias)
  }

  const formatarFamilia = (familia: string | null | undefined): string => {
    return familia ? familia.toUpperCase() : 'NÃO INFORMADA'
  }

  const renderPaginationNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={styles.paginationNavButton}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className={styles.paginationEllipsis}>...</span>)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={i === currentPage ? styles.paginationNavButtonCurrent : styles.paginationNavButton}
        >
          {i}
        </button>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className={styles.paginationEllipsis}>...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={styles.paginationNavButton}
        >
          {totalPages}
        </button>
      )
    }

    return pages
  }

  // ✅ COMPONENTE: Modal de Visualização
// ✅ MODAL DE VISUALIZAÇÃO COMPLETO - COM TODAS AS INFORMAÇÕES
// ✅ MODAL DE VISUALIZAÇÃO COMPLETO - COM TODAS AS INFORMAÇÕES
const ModalVisualizacao = () => {
  if (!showViewModal || !selectedPlanta) return null

  return (
    <div className={modalStyles.modalOverlay} onClick={fecharModals}>
      <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>
            <em>{selectedPlanta.nome_cientifico}</em>
          </h2>
          <button 
            className={modalStyles.modalCloseButton}
            onClick={fecharModals}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {loadingModal ? (
          <div className={modalStyles.modalLoading}>
            <div className={modalStyles.loadingSpinner}></div>
            <p>Carregando detalhes...</p>
          </div>
        ) : (
          <div className={modalStyles.modalBody}>
            {/* ===== INFORMAÇÕES BÁSICAS ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Informações Básicas</h3>
              <div className={modalStyles.infoGrid}>
                <div className={modalStyles.infoItem}>
                  <label>Nome Científico:</label>
                  <span><em>{selectedPlanta.nome_cientifico}</em></span>
                </div>
                <div className={modalStyles.infoItem}>
                  <label>Família:</label>
                  <span><strong>{selectedPlanta.familia.nome_familia.toUpperCase()}</strong></span>
                </div>
                {selectedPlanta.numero_exsicata && (
                  <div className={modalStyles.infoItem}>
                    <label>Número de Exsicata:</label>
                    <span>{selectedPlanta.numero_exsicata}</span>
                  </div>
                )}
                <div className={modalStyles.infoItem}>
                  <label>Data de Adição:</label>
                  <span>{formatarData(selectedPlanta.data_adicao)}</span>
                </div>
              </div>
            </section>

            {/* ===== NOMES COMUNS ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Nomes Comuns</h3>
              <div className={modalStyles.badgesContainer}>
                {selectedPlanta.nomes_comuns.length > 0 ? (
                  selectedPlanta.nomes_comuns.map((nome) => (
                    <span key={nome.id_nome} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                      {nome.nome_comum}
                    </span>
                  ))
                ) : (
                  <span className={modalStyles.noData}>Nenhum nome comum registrado</span>
                )}
              </div>
            </section>

            {/* ===== DISTRIBUIÇÃO GEOGRÁFICA ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Distribuição Geográfica</h3>
              <div className={modalStyles.badgesContainer}>
                {selectedPlanta.provincias.length > 0 ? (
                  selectedPlanta.provincias.map((provincia) => (
                    <span key={provincia.id_provincia} className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                      {provincia.nome_provincia}
                    </span>
                  ))
                ) : (
                  <span className={modalStyles.noData}>Distribuição não informada</span>
                )}
              </div>
            </section>

            {/* ===== USOS MEDICINAIS ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Usos Medicinais</h3>
              {selectedPlanta.usos_medicinais.length > 0 ? (
                <div className={modalStyles.usosList}>
                  {selectedPlanta.usos_medicinais.map((uso) => (
                    <div key={uso.id_uso} className={modalStyles.usoItem}>
                      <div className={modalStyles.usoParte}>
                        <strong>Parte usada:</strong> {uso.parte_usada}
                      </div>
                      {uso.observacoes && (
                        <div className={modalStyles.usoObservacoes}>
                          <strong>Observações:</strong> {uso.observacoes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className={modalStyles.noData}>Nenhum uso medicinal registrado</span>
              )}
            </section>

            {/* ===== ✨ NOVA SEÇÃO: COMPOSIÇÃO QUÍMICA ===== */}
            {selectedPlanta.compostos && selectedPlanta.compostos.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Composição Química</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.compostos.map((composto) => (
                    <span key={composto.id_composto} className={`${modalStyles.badge} ${modalStyles.badgePurple}`}>
                      {composto.nome_composto}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ===== ✨ PROPRIEDADES FARMACOLÓGICAS COMO BADGES ===== */}
            {selectedPlanta.propriedades && selectedPlanta.propriedades.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Propriedades Farmacológicas</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.propriedades.map((propriedade) => (
                    <span key={propriedade.id_propriedade} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                      {propriedade.descricao}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ===== ✨ INDICAÇÕES MEDICINAIS COMO BADGES ===== */}
            {selectedPlanta.indicacoes && selectedPlanta.indicacoes.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Indicações Medicinais</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.indicacoes.map((indicacao) => (
                    <span key={indicacao.id_indicacao} className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                      {indicacao.descricao}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ===== ✨ MÉTODOS DE EXTRAÇÃO COMO BADGES ===== */}
            {selectedPlanta.metodos_extracao && selectedPlanta.metodos_extracao.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Métodos de Extração</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.metodos_extracao.map((metodo, index) => (
                    <span key={metodo.id_extraccao || index} className={`${modalStyles.badge} ${modalStyles.badgePurple}`}>
                      {metodo.descricao}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ===== ✨ MÉTODOS DE PREPARAÇÃO TRADICIONAL COMO BADGES ===== */}
            {selectedPlanta.metodos_preparacao && selectedPlanta.metodos_preparacao.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Métodos de Preparação Tradicional</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.metodos_preparacao.map((metodo, index) => (
                    <span key={metodo.id_preparacao || index} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                      {metodo.descricao}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ===== AUTORES E PESQUISADORES ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Autores e Pesquisadores</h3>
              {selectedPlanta.autores.length > 0 ? (
                <div className={modalStyles.autoresList}>
                  {selectedPlanta.autores.map((autor) => (
                    <div key={autor.id_autor} className={modalStyles.autorItem}>
                      <div className={modalStyles.autorNome}>
                        <strong>{autor.nome_autor}</strong>
                      </div>
                      {autor.afiliacao && (
                        <div className={modalStyles.autorAfiliacao}>
                          {autor.afiliacao}
                        </div>
                      )}
                      {autor.sigla_afiliacao && (
                        <div className={modalStyles.autorAfiliacao}>
                          <small>({autor.sigla_afiliacao})</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className={modalStyles.noData}>Nenhum autor registrado</span>
              )}
            </section>

            {/* ===== REFERÊNCIAS BIBLIOGRÁFICAS ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Referências Bibliográficas</h3>
              {selectedPlanta.referencias.length > 0 ? (
                <div className={modalStyles.referenciasList}>
                  {selectedPlanta.referencias.map((ref) => (
                    <div key={ref.id_referencia} className={modalStyles.referenciaItem}>
                      <div className={modalStyles.refTitulo}>
                        <strong>{ref.titulo || 'Título não informado'}</strong>
                      </div>
                      <div className={modalStyles.refDetails}>
                        {ref.tipo && <span className={modalStyles.refTipo}>{ref.tipo}</span>}
                        {ref.ano && <span className={modalStyles.refAno}>({ref.ano})</span>}
                      </div>
                      {ref.link && (
                        <div className={modalStyles.refLink}>
                          <a href={ref.link} target="_blank" rel="noopener noreferrer">
                            Ver referência completa
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className={modalStyles.noData}>Nenhuma referência registrada</span>
              )}
            </section>

            {/* ===== ✨ NOVA SEÇÃO: ESTATÍSTICAS DA PLANTA ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Estatísticas da Planta</h3>
              <div className={modalStyles.readonlyStats}>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>{selectedPlanta.nomes_comuns.length}</span>
                  <span className={modalStyles.statLabel}>Nomes Comuns</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>{selectedPlanta.provincias.length}</span>
                  <span className={modalStyles.statLabel}>Províncias</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>{selectedPlanta.usos_medicinais.length}</span>
                  <span className={modalStyles.statLabel}>Usos Medicinais</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>{selectedPlanta.autores.length}</span>
                  <span className={modalStyles.statLabel}>Autores</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>{selectedPlanta.referencias.length}</span>
                  <span className={modalStyles.statLabel}>Referências</span>
                </div>
                {selectedPlanta.compostos && selectedPlanta.compostos.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.compostos.length}</span>
                    <span className={modalStyles.statLabel}>Compostos</span>
                  </div>
                )}
                {selectedPlanta.propriedades && selectedPlanta.propriedades.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.propriedades.length}</span>
                    <span className={modalStyles.statLabel}>Propriedades</span>
                  </div>
                )}
                {selectedPlanta.indicacoes && selectedPlanta.indicacoes.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.indicacoes.length}</span>
                    <span className={modalStyles.statLabel}>Indicações</span>
                  </div>
                )}
                {selectedPlanta.metodos_extracao && selectedPlanta.metodos_extracao.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.metodos_extracao.length}</span>
                    <span className={modalStyles.statLabel}>Métodos Extração</span>
                  </div>
                )}
                {selectedPlanta.metodos_preparacao && selectedPlanta.metodos_preparacao.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.metodos_preparacao.length}</span>
                    <span className={modalStyles.statLabel}>Métodos Preparação</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        <div className={modalStyles.modalFooter}>
          <button 
            className={modalStyles.btnSecondary}
            onClick={fecharModals}
          >
            Fechar
          </button>
          <button 
            className={modalStyles.btnPrimary}
            onClick={() => {
              fecharModals()
              handleEditPlanta(selectedPlanta.id_planta)
            }}
          >
            Editar Planta
          </button>
        </div>
      </div>
    </div>
  )
}

  // ✅ COMPONENTE: Modal de Edição
  const ModalEdicao = () => {
    if (!showEditModal || !editFormData) return null

    const adicionarNomeComum = () => {
      if (!editFormData) return
      setEditFormData({
        ...editFormData,
        nomes_comuns: [
          ...editFormData.nomes_comuns,
          { id_nome: Date.now(), nome_comum: '' }
        ]
      })
    }

    const removerNomeComum = (index: number) => {
      if (!editFormData) return
      const novosNomes = editFormData.nomes_comuns.filter((_, i) => i !== index)
      setEditFormData({
        ...editFormData,
        nomes_comuns: novosNomes
      })
    }

    const atualizarNomeComum = (index: number, valor: string) => {
      if (!editFormData) return
      const novosNomes = [...editFormData.nomes_comuns]
      novosNomes[index] = { ...novosNomes[index], nome_comum: valor }
      setEditFormData({
        ...editFormData,
        nomes_comuns: novosNomes
      })
    }

    return (
      <div className={modalStyles.modalOverlay} onClick={fecharModals}>
        <div className={`${modalStyles.modalContent} ${modalStyles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
          <div className={modalStyles.modalHeader}>
            <h2 className={modalStyles.modalTitle}>
              Editar: <em>{editFormData.nome_cientifico}</em>
            </h2>
            <button 
              className={modalStyles.modalCloseButton}
              onClick={fecharModals}
              aria-label="Fechar modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {loadingModal ? (
            <div className={modalStyles.modalLoading}>
              <div className={modalStyles.loadingSpinner}></div>
              <p>Salvando alterações...</p>
            </div>
          ) : (
            <div className={modalStyles.modalBody}>
              {/* Informações Básicas */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Informações Básicas</h3>
                <div className={modalStyles.formGrid}>
                  <div className={modalStyles.formGroup}>
                    <label htmlFor="nome_cientifico">Nome Científico *</label>
                    <input
                      type="text"
                      id="nome_cientifico"
                      value={editFormData.nome_cientifico}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        nome_cientifico: e.target.value
                      })}
                      className={modalStyles.formInput}
                      required
                    />
                  </div>

                  <div className={modalStyles.formGroup}>
                    <label htmlFor="familia">Família *</label>
                    <select
                      id="familia"
                      value={editFormData.familia.id_familia}
                      onChange={(e) => {
                        const familiaId = parseInt(e.target.value)
                        const familiaSelecionada = familias.find(f => f.id_familia === familiaId)
                        if (familiaSelecionada) {
                          setEditFormData({
                            ...editFormData,
                            familia: {
                              id_familia: familiaId,
                              nome_familia: familiaSelecionada.nome_familia
                            }
                          })
                        }
                      }}
                      className={modalStyles.formSelect}
                      required
                    >
                      {familias.map((familia) => (
                        <option key={familia.id_familia} value={familia.id_familia}>
                          {familia.nome_familia.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={modalStyles.formGroup}>
                    <label htmlFor="numero_exsicata">Número de Exsicata</label>
                    <input
                      type="text"
                      id="numero_exsicata"
                      value={editFormData.numero_exsicata || ''}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        numero_exsicata: e.target.value
                      })}
                      className={modalStyles.formInput}
                    />
                  </div>
                </div>
              </section>

              {/* Nomes Comuns */}
              <section className={modalStyles.modalSection}>
                <div className={modalStyles.sectionHeader}>
                  <h3 className={modalStyles.sectionTitle}>Nomes Comuns</h3>
                  <button
                    type="button"
                    onClick={adicionarNomeComum}
                    className={modalStyles.btnAddSmall}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Adicionar
                  </button>
                </div>
                <div className={modalStyles.nomesComumsList}>
                  {editFormData.nomes_comuns.map((nome, index) => (
                    <div key={nome.id_nome || index} className={modalStyles.nomeComumItem}>
                      <input
                        type="text"
                        value={nome.nome_comum}
                        onChange={(e) => atualizarNomeComum(index, e.target.value)}
                        placeholder="Nome comum da planta"
                        className={modalStyles.formInput}
                      />
                      <button
                        type="button"
                        onClick={() => removerNomeComum(index)}
                        className={modalStyles.btnRemoveSmall}
                        aria-label="Remover nome comum"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {editFormData.nomes_comuns.length === 0 && (
                    <p className={modalStyles.noData}>Nenhum nome comum adicionado</p>
                  )}
                </div>
              </section>

              {/* Distribuição Geográfica */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Distribuição Geográfica</h3>
                <div className={modalStyles.provinciasGrid}>
                  {provincias.map((provincia) => (
                    <label key={provincia.id_provincia} className={modalStyles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={editFormData.provincias.some(p => p.id_provincia === provincia.id_provincia)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditFormData({
                              ...editFormData,
                              provincias: [...editFormData.provincias, {
                                id_provincia: provincia.id_provincia,
                                nome_provincia: provincia.nome_provincia
                              }]
                            })
                          } else {
                            setEditFormData({
                              ...editFormData,
                              provincias: editFormData.provincias.filter(p => p.id_provincia !== provincia.id_provincia)
                            })
                          }
                        }}
                        className={modalStyles.checkboxInput}
                      />
                      <span className={modalStyles.checkboxLabel}>{provincia.nome_provincia}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Informações Somente Leitura */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Outras Informações</h3>
                <div className={modalStyles.readonlyInfo}>
                  <p className={modalStyles.infoNote}>
                    <strong>Nota:</strong> As informações sobre usos medicinais, autores e referências 
                    devem ser editadas através de formulários específicos ou contacte o administrador do sistema.
                  </p>
                  
                  <div className={modalStyles.readonlyStats}>
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{editFormData.usos_medicinais.length}</span>
                      <span className={modalStyles.statLabel}>Usos Medicinais</span>
                    </div>
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{editFormData.autores.length}</span>
                      <span className={modalStyles.statLabel}>Autores</span>
                    </div>
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{editFormData.referencias.length}</span>
                      <span className={modalStyles.statLabel}>Referências</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className={modalStyles.modalFooter}>
            <button 
              className={modalStyles.btnSecondary}
              onClick={fecharModals}
              disabled={loadingModal}
            >
              Cancelar
            </button>
            <button 
              className={modalStyles.btnPrimary}
              onClick={salvarEdicoes}
              disabled={loadingModal || !editFormData?.nome_cientifico.trim()}
            >
              {loadingModal ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estados de carregamento e erro
  if (loading && plantas.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerenciar Plantas</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '3rem',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280' }}>Carregando plantas da base de dados...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerenciar Plantas</h1>
        </div>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: '#dc2626'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Erro ao conectar com a API</h3>
          <p style={{ margin: '0 0 1rem 0' }}>{error}</p>
          <button 
            onClick={carregarPlantas}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
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
          {/* Tipo de pesquisa */}
          <div className={styles.filterItem}>
            <label htmlFor="searchType" className={styles.filterLabel}>
              Tipo de Pesquisa
            </label>
            <select
              id="searchType"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value as SearchType)
                setSearchTerm("")
                setDebouncedSearchTerm("")
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="geral">Pesquisa Geral</option>
              <option value="autor">Por Autor</option>
              <option value="parte_usada">Por Parte Usada</option>
              <option value="indicacao">Por Indicação</option>
              <option value="composto">Por Composto Químico</option>
              <option value="propriedade">Por Propriedade Farmacológica</option>
            </select>
          </div>

          {/* Campo de pesquisa */}
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              {searchType === 'geral' && 'Pesquisar'}
              {searchType === 'autor' && 'Nome do Autor'}
              {searchType === 'parte_usada' && 'Parte da Planta'}
              {searchType === 'indicacao' && 'Uso Medicinal'}
              {searchType === 'composto' && 'Composto Químico'}
              {searchType === 'propriedade' && 'Propriedade Farmacológica'}
              {isSearching && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#059669',
                  fontWeight: 'normal',
                  marginLeft: '0.5rem'
                }}>
                  (a pesquisar...)
                </span>
              )}
            </label>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
                placeholder={
                  searchType === 'geral' ? 'Nome comum, científico ou família' :
                  searchType === 'autor' ? 'Ex: Silva, João' :
                  searchType === 'parte_usada' ? 'Ex: folha, raiz, casca' :
                  searchType === 'indicacao' ? 'Ex: diabetes, hipertensão' :
                  searchType === 'composto' ? 'Ex: flavonoides, alcaloides' :
                  searchType === 'propriedade' ? 'Ex: anti-inflamatório, antimicrobiano' : ''
                }
                style={isSearching ? { 
                  borderColor: '#059669',
                  boxShadow: '0 0 0 1px #059669'
                } : {}}
              />
              <div className={styles.searchIcon}>
                {isSearching ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #059669',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
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
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                )}
              </div>
            </div>
            {searchTerm.length > 0 && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                fontStyle: 'italic'
              }}>
                💡 A pesquisa será executada automaticamente após parar de digitar
              </div>
            )}
          </div>

          {/* Outros filtros */}
          <div className={styles.filterItem}>
            <label htmlFor="family" className={styles.filterLabel}>Família</label>
            <select
              id="family"
              value={selectedFamily}
              onChange={(e) => {
                setSelectedFamily(e.target.value)
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="">Todas as famílias</option>
              {familias.map((familia) => (
                <option key={familia.id_familia} value={familia.nome_familia}>
                  {formatarFamilia(familia.nome_familia)} ({familia.total_plantas} plantas)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="location" className={styles.filterLabel}>Província</label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value)
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="">Todas as províncias</option>
              {provincias.map((provincia) => (
                <option key={provincia.id_provincia} value={provincia.nome_provincia}>
                  {provincia.nome_provincia} ({provincia.total_plantas} plantas)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="pageSize" className={styles.filterLabel}>Itens por página</label>
            <select
              id="pageSize"
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={styles.clearButton}
            style={{ marginRight: '0.5rem' }}
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {showAdvancedFilters ? 'Ocultar Filtros' : 'Mais Filtros'}
          </button>
          
          <button type="button" onClick={limparFiltros} className={styles.clearButton}>
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

        {showAdvancedFilters && (
          <div style={{ 
            marginTop: '1rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid #e5e7eb' 
          }}>
            <div className={styles.filterGrid}>
              <div className={styles.filterItem}>
                <label className={styles.filterLabel}>Informações Adicionais</label>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem'
                }}>
                  <strong>Tipos de pesquisa disponíveis:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                    <li><strong>Geral:</strong> Nome comum, científico, família</li>
                    <li><strong>Autor:</strong> Pesquisador ou cientista</li>
                    <li><strong>Parte Usada:</strong> Folha, raiz, casca, etc.</li>
                    <li><strong>Indicação:</strong> Uso medicinal tradicional</li>
                    <li><strong>Composto:</strong> Substância química presente</li>
                    <li><strong>Propriedade:</strong> Ação farmacológica (anti-inflamatório, etc.)</li>
                  </ul>
                  <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                    💡 Dica: Combine diferentes tipos de pesquisa com os filtros de família e província para resultados mais precisos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações de resultados */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 0',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <span>
          {totalPlantas > 0 ? (
            <>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalPlantas)} de {totalPlantas} plantas
              {(debouncedSearchTerm || selectedFamily || selectedLocation) && ` (${searchType === 'geral' ? 'filtradas' : `pesquisa por ${searchType.replace('_', ' ')}`})`}
              {isSearching && (
                <span style={{ color: '#059669', fontWeight: '500', marginLeft: '0.5rem' }}>
                  - actualizando...
                </span>
              )}
            </>
          ) : (
            "Nenhuma planta encontrada"
          )}
        </span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* Lista de plantas */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nomes_comuns')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome Popular {sortBy === 'nomes_comuns' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nome_cientifico')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome Científico {sortBy === 'nome_cientifico' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('familia')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Família {sortBy === 'familia' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>Províncias</th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('data_adicao')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Data de Adição {sortBy === 'data_adicao' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #9333ea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : plantas.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {(debouncedSearchTerm || selectedFamily || selectedLocation) 
                      ? "Nenhuma planta encontrada com os filtros selecionados." 
                      : "Nenhuma planta encontrada na base de dados."
                    }
                  </td>
                </tr>
              ) : (
                plantas.map((planta) => (
                  <tr key={planta.id_planta} className={styles.tableRow}>
                    <td className={styles.tableCellName}>
                      {formatarNomesComuns(planta.nomes_comuns)}
                    </td>
                    <td className={styles.tableCell}>
                      <em>{planta.nome_cientifico}</em>
                      {planta.numero_exsicata && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          Exsicata: {planta.numero_exsicata}
                        </div>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      <strong>{formatarFamilia(planta.familia)}</strong>
                    </td>
                    <td className={styles.tableCell}>
                      {formatarProvincias(planta.provincias)}
                    </td>
                    <td className={styles.tableCell}>
                      {formatarData(planta.data_adicao)}
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        {/* ✅ BOTÃO VER - AGORA ABRE MODAL */}
                        <button 
                          onClick={() => handleViewPlanta(planta.id_planta)}
                          className={styles.viewButton}
                          title="Ver detalhes completos"
                        >
                          Ver
                        </button>
                        {/* ✅ BOTÃO EDITAR - AGORA ABRE MODAL */}
                        <button 
                          onClick={() => handleEditPlanta(planta.id_planta)}
                          className={styles.editButton}
                          title="Editar planta"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(planta.id_planta)} 
                          className={styles.deleteButton}
                          title="Excluir planta"
                        >
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
      {!loading && plantas.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationMobile}>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </button>
          </div>
          <div className={styles.paginationDesktop}>
            <div>
              <p className={styles.paginationText}>
                Mostrando <span className={styles.paginationBold}>{((currentPage - 1) * itemsPerPage) + 1}</span> a{" "}
                <span className={styles.paginationBold}>{Math.min(currentPage * itemsPerPage, totalPlantas)}</span> de{" "}
                <span className={styles.paginationBold}>{totalPlantas}</span> resultados
              </p>
            </div>
            <div>
              <nav className={styles.paginationNav} aria-label="Pagination">
                <button 
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonLeft}`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Página anterior"
                >
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
                
                {renderPaginationNumbers()}
                
                <button 
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonRight}`}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  title="Próxima página"
                >
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
      )}

      {/* ✅ MODALS - RENDERIZADOS CONDICIONALMENTE */}
      <ModalVisualizacao />
      <ModalEdicao />
    </div>
  )
}