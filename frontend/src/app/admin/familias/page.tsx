"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./familias.module.css"
import modalStyles from "./modal.module.css"

// Tipos existentes mantidos...
interface Familia {
  id_familia: number
  nome_familia: string
  total_plantas?: number
}

interface PaginatedResponse<T> {
  familias?: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  erro?: string
  message?: string
  search_applied?: string  // ✅ ADICIONAR: Para debug
}

interface FamiliasResponse {
  familias: Familia[]
  total: number
  search_applied?: string  // ✅ ADICIONAR: Para debug
}

type SortField = "nome_familia" | "total_plantas"
type SortOrder = "asc" | "desc"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function FamiliesPage() {
  // Estados existentes mantidos...
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalFamilias, setTotalFamilias] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<SortField>('nome_familia')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Estados para modal (mantidos...)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)

  // Estados para formulário
  const [formData, setFormData] = useState({
    nome_familia: ""
  })

  // Estados para modal de confirmação (mantidos...)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'delete' | 'warning'
    title: string
    message: string
    familiaId?: number
    familiaName?: string
    totalPlantas?: number
  } | null>(null)

  // ✅ Hook para debounce do termo de pesquisa (mantido)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // ✅ CORREÇÃO PRINCIPAL: useEffect que carrega famílias COM FILTRO
  useEffect(() => {
    carregarFamilias()
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder])

  // ✅ useEffect para resetar página quando pesquisa muda
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1)  // ✅ Reset para página 1 quando busca muda
    }
  }, [debouncedSearchTerm])

  // ✅ EFFECT: Prevenir scroll quando modal aberto (mantido)
  useEffect(() => {
    if (showModal || showConfirmModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal, showConfirmModal])

  // ✅ CORREÇÃO PRINCIPAL: Função carregarFamilias COM BUSCA
  const carregarFamilias = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      // ✅ CORREÇÃO: Aplicar filtro de busca corretamente na API
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
        console.log(`🔍 Aplicando busca: "${debouncedSearchTerm}"`)
      }
      
      console.log(`🔄 Carregando famílias: ${API_BASE_URL}/api/admin/familias?${params}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/familias?${params}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: FamiliasResponse = await response.json()
      
      console.log('✅ Dados recebidos:', data)
      console.log(`🔍 Busca aplicada na API: "${data.search_applied || 'nenhuma'}"`)
      
      // ✅ CORREÇÃO: Usar dados da API diretamente (já filtrados)
      let familiasOrdenadas = data.familias || []
      
      // ✅ CORREÇÃO: Aplicar ordenação apenas no frontend (dados já filtrados pela API)
      if (sortBy && familiasOrdenadas.length > 0) {
        familiasOrdenadas = [...familiasOrdenadas].sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''
          
          switch (sortBy) {
            case 'nome_familia':
              aValue = a.nome_familia || ''
              bValue = b.nome_familia || ''
              break
            case 'total_plantas':
              aValue = a.total_plantas || 0
              bValue = b.total_plantas || 0
              break
            default:
              aValue = ''
              bValue = ''
          }
          
          if (sortOrder === 'asc') {
            if (typeof aValue === 'string') {
              return aValue.localeCompare(bValue as string, 'pt', { numeric: true })
            }
            return (aValue as number) - (bValue as number)
          } else {
            if (typeof aValue === 'string') {
              return (bValue as string).localeCompare(aValue, 'pt', { numeric: true })
            }
            return (bValue as number) - (aValue as number)
          }
        })
      }
      
      setFamilias(familiasOrdenadas)
      setTotalFamilias(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      
      console.log(`✅ Famílias carregadas: ${familiasOrdenadas.length} de ${data.total} total`)
      
    } catch (err) {
      console.error('❌ Erro ao carregar famílias:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar famílias: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ CORREÇÃO: Função handleSort resetar página
  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)  // ✅ Reset para página 1 quando ordenação muda
  }

  // ✅ CORREÇÃO: Função handlePageSizeChange resetar página
  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPage(1)  // ✅ Reset para página 1 quando itens por página muda
  }

  // ✅ CORREÇÃO: Função limparFiltros mais robusta
  const limparFiltros = (): void => {
    console.log('🧹 Limpando todos os filtros')
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setCurrentPage(1)
    setSortBy('nome_familia')
    setSortOrder('asc')
    // ✅ A função carregarFamilias será chamada automaticamente pelo useEffect
  }

  // Funções do modal mantidas exatamente iguais...
  const abrirModal = (mode: 'add' | 'edit' | 'view', familia?: Familia): void => {
    setModalMode(mode)
    setSelectedFamilia(familia || null)
    
    if (mode === 'add') {
      setFormData({ nome_familia: "" })
    } else if (mode === 'edit' && familia) {
      setFormData({ nome_familia: familia.nome_familia })
    }
    
    setShowModal(true)
  }

  const fecharModal = (): void => {
    setShowModal(false)
    setSelectedFamilia(null)
    setFormData({ nome_familia: "" })
    setModalLoading(false)
  }

  // ✅ FUNÇÕES DE CRUD mantidas iguais...
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!formData.nome_familia.trim()) {
      alert('Nome da família é obrigatório')
      return
    }

    try {
      setModalLoading(true)
      
      const url = modalMode === 'edit' && selectedFamilia 
        ? `${API_BASE_URL}/api/admin/familias/${selectedFamilia.id_familia}`
        : `${API_BASE_URL}/api/admin/familias`
      
      const method = modalMode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar família')
      }
      
      console.log(`✅ Família ${modalMode === 'edit' ? 'atualizada' : 'criada'} com sucesso`)
      
      fecharModal()
      // ✅ IMPORTANTE: Recarregar dados após sucesso
      await carregarFamilias()
      
    } catch (err) {
      console.error('❌ Erro ao salvar família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao salvar família')
    } finally {
      setModalLoading(false)
    }
  }

  // Função handleDelete mantida igual...
  const handleDelete = async (id: number): Promise<void> => {
    try {
      console.log(`🔍 Verificando família ${id} antes de excluir`)
      
      const checkResponse = await fetch(`${API_BASE_URL}/api/admin/familias/${id}`)
      
      if (!checkResponse.ok) {
        throw new Error('Erro ao verificar família')
      }
      
      const familiaData = await checkResponse.json()
      
      if (familiaData.total_plantas && familiaData.total_plantas > 0) {
        setConfirmModalData({
          type: 'warning',
          title: 'Não é possível excluir esta família',
          message: `A família "${familiaData.nome_familia}" tem ${familiaData.total_plantas} plantas associadas.`,
          familiaName: familiaData.nome_familia,
          totalPlantas: familiaData.total_plantas
        })
        setShowConfirmModal(true)
        return
      }
      
      setConfirmModalData({
        type: 'delete',
        title: 'Confirmar exclusão',
        message: `Tem certeza que deseja excluir a família "${familiaData.nome_familia}"?`,
        familiaId: id,
        familiaName: familiaData.nome_familia
      })
      setShowConfirmModal(true)
      
    } catch (err) {
      console.error('❌ Erro ao verificar família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao verificar família')
    }
  }

  const confirmarExclusao = async (): Promise<void> => {
    if (!confirmModalData?.familiaId) return
    
    try {
      console.log(`🗑️ Excluindo família ${confirmModalData.familiaId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/familias/${confirmModalData.familiaId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir família')
      }
      
      console.log('✅ Família excluída com sucesso')
      setShowConfirmModal(false)
      setConfirmModalData(null)
      await carregarFamilias()  // ✅ Recarregar dados
      
    } catch (err) {
      console.error('❌ Erro ao excluir família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir família')
    }
  }

  const fecharConfirmModal = (): void => {
    setShowConfirmModal(false)
    setConfirmModalData(null)
  }

  // ✅ CORREÇÃO: Indicador de busca mais preciso
  const isSearching: boolean = searchTerm !== debouncedSearchTerm && searchTerm.length > 0

  // Funções de paginação mantidas iguais...
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

  // Componentes de modal mantidos iguais...
  const ModalConfirmacao = () => {
    if (!showConfirmModal || !confirmModalData) return null

    return (
      <div className={modalStyles.modalOverlay} onClick={fecharConfirmModal}>
        <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={modalStyles.modalHeader}>
            <h2 className={modalStyles.modalTitle}>
              {confirmModalData.title}
            </h2>
            <button 
              className={modalStyles.modalCloseButton}
              onClick={fecharConfirmModal}
              aria-label="Fechar modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={modalStyles.modalBody}>
            {confirmModalData.type === 'warning' ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  color: '#dc2626', 
                  marginBottom: '1rem' 
                }}>
                  ⚠️
                </div>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#111827', 
                  marginBottom: '1.5rem',
                  lineHeight: '1.5'
                }}>
                  {confirmModalData.message}
                </p>
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem',
                    margin: '0 0 0.5rem 0',
                    fontWeight: '500'
                  }}>
                    Para excluir esta família, primeiro precisa:
                  </p>
                  <ul style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem',
                    margin: '0',
                    paddingLeft: '1.5rem'
                  }}>
                    <li>Mover as {confirmModalData.totalPlantas} plantas para outra família, OU</li>
                    <li>Excluir todas as plantas desta família</li>
                  </ul>
                </div>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  Esta validação protege a integridade dos dados.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  color: '#dc2626', 
                  marginBottom: '1rem' 
                }}>
                  🗑️
                </div>
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#111827', 
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {confirmModalData.message}
                </p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  Esta família não tem plantas associadas.
                  <br />
                  Esta acção não pode ser desfeita.
                </p>
              </div>
            )}
          </div>

          <div className={modalStyles.modalFooter}>
            <button 
              className={modalStyles.btnSecondary}
              onClick={fecharConfirmModal}
            >
              {confirmModalData.type === 'warning' ? 'Entendi' : 'Cancelar'}
            </button>
            
            {confirmModalData.type === 'delete' && (
              <button 
                className={modalStyles.btnDanger}
                onClick={confirmarExclusao}
              >
                Sim, Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ModalGestao = () => {
    if (!showModal) return null

    return (
      <div className={modalStyles.modalOverlay} onClick={fecharModal}>
        <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={modalStyles.modalHeader}>
            <h2 className={modalStyles.modalTitle}>
              {modalMode === 'add' && 'Adicionar Nova Família'}
              {modalMode === 'edit' && 'Editar Família'}
              {modalMode === 'view' && 'Detalhes da Família'}
            </h2>
            <button 
              className={modalStyles.modalCloseButton}
              onClick={fecharModal}
              aria-label="Fechar modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {modalLoading ? (
            <div className={modalStyles.modalLoading}>
              <div className={modalStyles.loadingSpinner}></div>
              <p>Processando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={modalStyles.modalBody}>
                {modalMode === 'view' && selectedFamilia ? (
                  <div className={modalStyles.viewContent}>
                    <div className={modalStyles.infoGrid}>
                      <div className={modalStyles.infoItem}>
                        <label>ID:</label>
                        <span>{selectedFamilia.id_familia}</span>
                      </div>
                      <div className={modalStyles.infoItem}>
                        <label>Nome da Família:</label>
                        <span><strong>{selectedFamilia.nome_familia.toUpperCase()}</strong></span>
                      </div>
                      <div className={modalStyles.infoItem}>
                        <label>Total de Plantas:</label>
                        <span>{selectedFamilia.total_plantas || 0} plantas</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={modalStyles.formGrid}>
                    <div className={modalStyles.formItem}>
                      <label htmlFor="nome_familia" className={modalStyles.formLabel}>
                        Nome da Família *
                      </label>
                      <input
                        type="text"
                        id="nome_familia"
                        name="nome_familia"
                        value={formData.nome_familia}
                        onChange={(e) => setFormData({ nome_familia: e.target.value })}
                        className={modalStyles.formInput}
                        placeholder="Ex: Asteraceae, Fabaceae..."
                        required
                        maxLength={100}
                        disabled={modalLoading}
                      />
                      <div className={modalStyles.formHint}>
                        Nome científico da família botânica (máximo 100 caracteres)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={modalStyles.modalFooter}>
                <button 
                  type="button"
                  className={modalStyles.btnSecondary}
                  onClick={fecharModal}
                  disabled={modalLoading}
                >
                  {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                
                {modalMode !== 'view' && (
                  <button 
                    type="submit"
                    className={modalStyles.btnPrimary}
                    disabled={modalLoading || !formData.nome_familia.trim()}
                  >
                    {modalLoading ? 'Processando...' : modalMode === 'edit' ? 'Atualizar' : 'Criar'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Estados de carregamento e erro
  if (loading && familias.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerenciar Famílias</h1>
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
          <p style={{ color: '#6b7280' }}>Carregando famílias da base de dados...</p>
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
          <h1 className={styles.title}>Gerenciar Famílias</h1>
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
            onClick={carregarFamilias}
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
        <h1 className={styles.title}>Gerenciar Famílias</h1>
        <button 
          onClick={() => abrirModal('add')}
          className={styles.addButton}
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
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar Nova Família
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              Pesquisar Família
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
                placeholder="Nome da família botânica..."
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
      </div>

      {/* ✅ CORREÇÃO: Informações de resultados mais precisas */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 0',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <span>
          {totalFamilias > 0 ? (
            <>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalFamilias)} de {totalFamilias} famílias
              {debouncedSearchTerm && ` (filtradas por "${debouncedSearchTerm}")`}
              {isSearching && (
                <span style={{ color: '#059669', fontWeight: '500', marginLeft: '0.5rem' }}>
                  - actualizando...
                </span>
              )}
            </>
          ) : debouncedSearchTerm ? (
            `Nenhuma família encontrada para "${debouncedSearchTerm}"`
          ) : (
            "Nenhuma família encontrada"
          )}
        </span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* Lista de famílias */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nome_familia')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome da Família {sortBy === 'nome_familia' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('total_plantas')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Total de Plantas {sortBy === 'total_plantas' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>
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
              ) : familias.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>
                    {debouncedSearchTerm 
                      ? `Nenhuma família encontrada para "${debouncedSearchTerm}". Tente outro termo de busca.`
                      : "Nenhuma família encontrada na base de dados."
                    }
                  </td>
                </tr>
              ) : (
                familias.map((familia) => (
                  <tr key={familia.id_familia} className={styles.tableRow}>
                    <td className={styles.tableCellName}>
                      <strong>{familia.nome_familia.toUpperCase()}</strong>
                    </td>
                    <td className={styles.tableCell}>
                      {familia.total_plantas || 0} plantas
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => abrirModal('view', familia)}
                          className={styles.viewButton}
                          title="Ver detalhes"
                        >
                          Ver
                        </button>
                        <button 
                          onClick={() => abrirModal('edit', familia)}
                          className={styles.editButton}
                          title="Editar família"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(familia.id_familia)} 
                          className={styles.deleteButton}
                          title="Excluir família"
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
      {!loading && familias.length > 0 && totalPages > 1 && (
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
                <span className={styles.paginationBold}>{Math.min(currentPage * itemsPerPage, totalFamilias)}</span> de{" "}
                <span className={styles.paginationBold}>{totalFamilias}</span> resultados
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

      {/* ✅ MODAIS */}
      <ModalGestao />
      <ModalConfirmacao />

      {/* ✅ DEBUG INFO (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          Debug: Busca="{debouncedSearchTerm}" | Página={currentPage} | Total={totalFamilias}
        </div>
      )}
    </div>
  )
}