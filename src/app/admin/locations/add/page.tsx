"use client"

import { useEffect } from "react"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./add-location.module.css"

export default function AddLocationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const mapRef = useRef<HTMLDivElement>(null)

  // Estado para os dados do local
  const [locationData, setLocationData] = useState({
    nome: "",
    descricao: "",
    pais: "Moçambique",
    regiao: "",
    latitude: "",
    longitude: "",
    tipo: "natural",
    ativo: true,
  })

  // Lista de países para o select
  const paises = [
    "Moçambique",
    "Brasil",
    "Angola",
    "Portugal",
    "Cabo Verde",
    "Guiné-Bissau",
    "São Tomé e Príncipe",
    "Timor-Leste",
  ]

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    setLocationData((prev) => ({ ...prev, [name]: newValue }))
  }

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulação de envio para API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulação de sucesso
      setSuccessMessage(`Local "${locationData.nome}" adicionado com sucesso!`)

      // Limpar formulário após 2 segundos
      setTimeout(() => {
        setLocationData({
          nome: "",
          descricao: "",
          pais: "Moçambique",
          regiao: "",
          latitude: "",
          longitude: "",
          tipo: "natural",
          ativo: true,
        })
        setSuccessMessage("")
        router.push("/admin/locations")
      }, 2000)
    } catch (error) {
      console.error("Erro ao adicionar local:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simular inicialização do mapa
  useEffect(() => {
    if (mapRef.current) {
      // Aqui seria a inicialização real do mapa com uma biblioteca como Leaflet ou Google Maps
      const mapElement = mapRef.current
      mapElement.innerHTML = '<div class="' + styles.mapPlaceholder + '">Mapa interativo seria carregado aqui</div>'
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Adicionar Novo Local</h1>
          <p className={styles.subtitle}>
            Preencha o formulário abaixo para adicionar um novo local de colheita ou observação de plantas.
          </p>
        </div>
        <Link href="/admin/locations" className={styles.backButton}>
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
            className={styles.backIcon}
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </Link>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <div className={styles.successContent}>
            <div className={styles.successIconContainer}>
              <svg
                className={styles.successIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className={styles.successText}>
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Informações Básicas */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informações Básicas</h2>
            </div>

            {/* Nome do Local */}
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>
                Nome do Local *
              </label>
              <div>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  value={locationData.nome}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Parque Nacional da Gorongosa, Reserva Florestal de Mecuburi..."
                />
              </div>
            </div>

            {/* País */}
            <div className={styles.formGroup}>
              <label htmlFor="pais" className={styles.label}>
                País *
              </label>
              <div>
                <select
                  id="pais"
                  name="pais"
                  required
                  value={locationData.pais}
                  onChange={handleChange}
                  className={styles.select}
                >
                  {paises.map((pais) => (
                    <option key={pais} value={pais}>
                      {pais}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Região */}
            <div className={styles.formGroup}>
              <label htmlFor="regiao" className={styles.label}>
                Região/Província *
              </label>
              <div>
                <input
                  type="text"
                  name="regiao"
                  id="regiao"
                  required
                  value={locationData.regiao}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Sofala, Nampula, Maputo..."
                />
              </div>
            </div>

            {/* Tipo de Local */}
            <div className={styles.formGroup}>
              <label htmlFor="tipo" className={styles.label}>
                Tipo de Local *
              </label>
              <div>
                <select
                  id="tipo"
                  name="tipo"
                  required
                  value={locationData.tipo}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="natural">Área Natural</option>
                  <option value="protegida">Área Protegida</option>
                  <option value="urbana">Área Urbana</option>
                  <option value="rural">Área Rural</option>
                  <option value="jardim">Jardim Botânico</option>
                  <option value="pesquisa">Centro de Pesquisa</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className={styles.formGroupFull}>
              <label htmlFor="descricao" className={styles.label}>
                Descrição
              </label>
              <div>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  value={locationData.descricao}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Descreva brevemente o local, suas características, biodiversidade, etc."
                />
              </div>
            </div>

            {/* Localização no Mapa */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Localização no Mapa</h2>
              <p className={styles.sectionSubtitle}>
                Selecione a localização no mapa ou insira as coordenadas manualmente.
              </p>
            </div>

            {/* Mapa */}
            <div className={styles.formGroupFull}>
              <div ref={mapRef} className={styles.mapContainer}></div>
            </div>

            {/* Coordenadas */}
            <div className={styles.formGroup}>
              <label htmlFor="latitude" className={styles.label}>
                Latitude *
              </label>
              <div>
                <input
                  type="text"
                  name="latitude"
                  id="latitude"
                  required
                  value={locationData.latitude}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: -19.8325"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="longitude" className={styles.label}>
                Longitude *
              </label>
              <div>
                <input
                  type="text"
                  name="longitude"
                  id="longitude"
                  required
                  value={locationData.longitude}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: 34.8833"
                />
              </div>
            </div>

            {/* Status */}
            <div className={styles.formGroupFull}>
              <div className={styles.checkboxItem}>
                <input
                  id="ativo"
                  name="ativo"
                  type="checkbox"
                  checked={locationData.ativo}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <label htmlFor="ativo" className={styles.checkboxLabel}>
                  Local ativo
                </label>
              </div>
              <p className={styles.hint}>
                Se desativado, este local não será exibido nas pesquisas e filtros do sistema.
              </p>
            </div>
          </div>

          <div className={styles.formActions}>
            <div className={styles.actionButtons}>
              <Link href="/admin/locations" className={styles.cancelButton}>
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ""}`}
              >
                {isSubmitting ? (
                  <>
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
                    Salvando...
                  </>
                ) : (
                  "Adicionar Local"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
