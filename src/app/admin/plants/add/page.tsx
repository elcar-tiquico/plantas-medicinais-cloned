"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./add-plant.module.css"

export default function AddPlantPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // Estado para os dados da planta
  const [plantData, setPlantData] = useState({
    nome: "",
    nomeCientifico: "",
    familia: "",
    localColheita: "",
    numeroExcicata: "",
    parteUsada: "",
    metodoPreparacao: "",
    usos: "",
    metodoExtracao: "",
    composicaoQuimica: "",
    propriedadesFarmacologicas: "",
    afiliacao: "",
    referencia: "",
    idiomas: ["pt"], // Idiomas disponíveis para esta planta
    artigo: "", // Conteúdo do artigo para leitura online
    pdfFileName: "", // Nome do arquivo PDF para download
  })

  // Lista de famílias botânicas para o select
  const familias = [
    "ASTERACEAE",
    "FABACEAE",
    "LAMIACEAE",
    "RUBIACEAE",
    "EUPHORBIACEAE",
    "ANACARDIACEAE",
    "MYRTACEAE",
    "SOLANACEAE",
    "MALVACEAE",
    "APOCYNACEAE",
  ]

  // Lista de locais de colheita para o select
  const locaisColheita = [
    "Amazônia",
    "Cerrado",
    "Caatinga",
    "Mata Atlântica",
    "Pampa",
    "Pantanal",
    "Maputo",
    "Gaza",
    "Inhambane",
    "Sofala",
    "Manica",
    "Tete",
    "Zambézia",
    "Nampula",
    "Cabo Delgado",
    "Niassa",
  ]

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPlantData((prev) => ({ ...prev, [name]: value }))
  }

  // Função para lidar com a seleção de idiomas
  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setPlantData((prev) => ({
      ...prev,
      idiomas: checked ? [...prev.idiomas, value] : prev.idiomas.filter((lang) => lang !== value),
    }))
  }

  // Função para lidar com o upload de PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPlantData((prev) => ({
        ...prev,
        pdfFileName: file.name,
      }))
    }
  }

  // Função para iniciar/parar a gravação de áudio para o nome popular
  const toggleRecordingPopular = () => {
    setIsRecordingPopular(!isRecordingPopular)
    if (!isRecordingPopular) {
      // Simulação de reconhecimento de voz
      setTimeout(() => {
        const plantNames = ["Carqueja", "Aroeira", "Quebra-pedra", "Guaco", "Espinheira-santa"]
        const randomName = plantNames[Math.floor(Math.random() * plantNames.length)]
        setPlantData((prev) => ({ ...prev, nome: randomName }))
        setIsRecordingPopular(false)
      }, 2000)
    }
  }

  // Função para iniciar/parar a gravação de áudio para o nome científico
  const toggleRecordingScientific = () => {
    setIsRecordingScientific(!isRecordingScientific)
    if (!isRecordingScientific) {
      // Simulação de reconhecimento de voz
      setTimeout(() => {
        const scientificNames = [
          "Baccharis trimera",
          "Schinus terebinthifolia",
          "Phyllanthus niruri",
          "Mikania glomerata",
          "Maytenus ilicifolia",
        ]
        const randomName = scientificNames[Math.floor(Math.random() * scientificNames.length)]
        setPlantData((prev) => ({ ...prev, nomeCientifico: randomName }))
        setIsRecordingScientific(false)
      }, 2000)
    }
  }

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulação de envio para API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulação de sucesso
      setSuccessMessage(`Planta "${plantData.nome}" adicionada com sucesso!`)

      // Limpar formulário após 2 segundos
      setTimeout(() => {
        setPlantData({
          nome: "",
          nomeCientifico: "",
          familia: "",
          localColheita: "",
          numeroExcicata: "",
          parteUsada: "",
          metodoPreparacao: "",
          usos: "",
          metodoExtracao: "",
          composicaoQuimica: "",
          propriedadesFarmacologicas: "",
          afiliacao: "",
          referencia: "",
          idiomas: ["pt"],
          artigo: "",
          pdfFileName: "",
        })
        setSuccessMessage("")
        router.push("/admin/plants")
      }, 2000)
    } catch (error) {
      console.error("Erro ao adicionar planta:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Adicionar Nova Planta</h1>
          <p className={styles.subtitle}>
            Preencha o formulário abaixo para adicionar uma nova planta ao banco de dados.
          </p>
        </div>
        <Link href="/admin/plants" className={styles.backButton}>
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

            {/* Nome Popular */}
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>
                Nome Popular *
              </label>
              <div className={styles.inputWithIcon}>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  value={plantData.nome}
                  onChange={handleChange}
                  className={styles.input}
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
                  Gravando... Fale o nome popular da planta
                </p>
              )}
            </div>

            {/* Nome Científico */}
            <div className={styles.formGroup}>
              <label htmlFor="nomeCientifico" className={styles.label}>
                Nome Científico *
              </label>
              <div className={styles.inputWithIcon}>
                <input
                  type="text"
                  name="nomeCientifico"
                  id="nomeCientifico"
                  required
                  value={plantData.nomeCientifico}
                  onChange={handleChange}
                  className={styles.input}
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
                  Gravando... Fale o nome científico da planta
                </p>
              )}
            </div>

            {/* Família */}
            <div className={styles.formGroup}>
              <label htmlFor="familia" className={styles.label}>
                Família *
              </label>
              <div>
                <select
                  id="familia"
                  name="familia"
                  required
                  value={plantData.familia}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Selecione uma família</option>
                  {familias.map((familia) => (
                    <option key={familia} value={familia}>
                      {familia}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Local de Colheita */}
            <div className={styles.formGroup}>
              <label htmlFor="localColheita" className={styles.label}>
                Local de Colheita *
              </label>
              <div>
                <select
                  id="localColheita"
                  name="localColheita"
                  required
                  value={plantData.localColheita}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Selecione um local</option>
                  {locaisColheita.map((local) => (
                    <option key={local} value={local}>
                      {local}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Número da Excicata */}
            <div className={styles.formGroup}>
              <label htmlFor="numeroExcicata" className={styles.label}>
                Número da Excicata
              </label>
              <div>
                <input
                  type="text"
                  name="numeroExcicata"
                  id="numeroExcicata"
                  value={plantData.numeroExcicata}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Imagem da Planta */}
            <div className={styles.formGroup}>
              <label htmlFor="imagem" className={styles.label}>
                Imagem da Planta
              </label>
              <div className={styles.fileUpload}>
                <input
                  type="file"
                  id="imagem"
                  name="imagem"
                  ref={fileInputRef}
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={() => {}}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.fileButton}>
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
                    className={styles.fileIcon}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Selecionar Imagem
                </button>
                <span className={styles.fileHint}>JPG, PNG ou GIF até 5MB</span>
              </div>
            </div>

            {/* Informações de Uso */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informações de Uso</h2>
            </div>

            {/* Parte da Planta Usada */}
            <div className={styles.formGroup}>
              <label htmlFor="parteUsada" className={styles.label}>
                Parte da Planta Usada *
              </label>
              <div>
                <input
                  type="text"
                  name="parteUsada"
                  id="parteUsada"
                  required
                  value={plantData.parteUsada}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Folhas, Raízes, Cascas..."
                />
              </div>
            </div>

            {/* Método de Preparação */}
            <div className={styles.formGroup}>
              <label htmlFor="metodoPreparacao" className={styles.label}>
                Método de Preparação (tradicional) *
              </label>
              <div>
                <input
                  type="text"
                  name="metodoPreparacao"
                  id="metodoPreparacao"
                  required
                  value={plantData.metodoPreparacao}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Infusão, Decocção..."
                />
              </div>
            </div>

            {/* Usos/Indicações */}
            <div className={styles.formGroupFull}>
              <label htmlFor="usos" className={styles.label}>
                Usos/Indicações *
              </label>
              <div>
                <textarea
                  id="usos"
                  name="usos"
                  rows={3}
                  required
                  value={plantData.usos}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Ex: Problemas digestivos, Anti-inflamatório..."
                />
              </div>
            </div>

            {/* Informações Científicas */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informações Científicas</h2>
            </div>

            {/* Método de Extração */}
            <div className={styles.formGroup}>
              <label htmlFor="metodoExtracao" className={styles.label}>
                Método de Extração
              </label>
              <div>
                <input
                  type="text"
                  name="metodoExtracao"
                  id="metodoExtracao"
                  value={plantData.metodoExtracao}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Extração aquosa, Extração hidroalcoólica..."
                />
              </div>
            </div>

            {/* Composição Química */}
            <div className={styles.formGroup}>
              <label htmlFor="composicaoQuimica" className={styles.label}>
                Composição Química
              </label>
              <div>
                <input
                  type="text"
                  name="composicaoQuimica"
                  id="composicaoQuimica"
                  value={plantData.composicaoQuimica}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Flavonóides, Taninos, Saponinas..."
                />
              </div>
            </div>

            {/* Propriedades Farmacológicas */}
            <div className={styles.formGroupFull}>
              <label htmlFor="propriedadesFarmacologicas" className={styles.label}>
                Propriedades Farmacológicas
              </label>
              <div>
                <textarea
                  id="propriedadesFarmacologicas"
                  name="propriedadesFarmacologicas"
                  rows={3}
                  value={plantData.propriedadesFarmacologicas}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Ex: Anti-inflamatória, Antioxidante, Hipoglicemiante..."
                />
              </div>
            </div>

            {/* Artigo Científico */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Artigo Científico</h2>
            </div>

            {/* PDF para Download */}
            <div className={styles.formGroupFull}>
              <label htmlFor="pdfArtigo" className={styles.label}>
                PDF do Artigo para Download
              </label>
              <div className={styles.fileUpload}>
                <input
                  type="file"
                  id="pdfArtigo"
                  name="pdfArtigo"
                  ref={pdfInputRef}
                  accept=".pdf"
                  className={styles.fileInput}
                  onChange={handlePdfUpload}
                />
                <button type="button" onClick={() => pdfInputRef.current?.click()} className={styles.fileButton}>
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
                    className={styles.fileIcon}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Selecionar PDF
                </button>
                <span className={styles.fileHint}>
                  {plantData.pdfFileName ? plantData.pdfFileName : "Arquivo PDF até 10MB"}
                </span>
              </div>
              <p className={styles.hint}>Este arquivo estará disponível para download pelos usuários.</p>
            </div>

            {/* Conteúdo do Artigo para Leitura */}
            <div className={styles.formGroupFull}>
              <label htmlFor="artigo" className={styles.label}>
                Conteúdo do Artigo para Leitura Online
              </label>
              <div>
                <textarea
                  id="artigo"
                  name="artigo"
                  rows={10}
                  value={plantData.artigo}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Insira o conteúdo do artigo que será exibido para leitura online..."
                />
              </div>
              <p className={styles.hint}>
                Este conteúdo será exibido para leitura online. Você pode usar formatação básica como negrito, itálico e
                listas.
              </p>
            </div>

            {/* Informações Bibliográficas */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informações Bibliográficas</h2>
            </div>

            {/* Afiliação dos Autores */}
            <div className={styles.formGroup}>
              <label htmlFor="afiliacao" className={styles.label}>
                Afiliação dos Autores
              </label>
              <div>
                <input
                  type="text"
                  name="afiliacao"
                  id="afiliacao"
                  value={plantData.afiliacao}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Universidade Federal de Minas Gerais"
                />
              </div>
            </div>

            {/* Referência */}
            <div className={styles.formGroup}>
              <label htmlFor="referencia" className={styles.label}>
                Referência
              </label>
              <div>
                <input
                  type="text"
                  name="referencia"
                  id="referencia"
                  value={plantData.referencia}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Silva et al. (2020). Journal of Ethnopharmacology, 255, 112743."
                />
              </div>
            </div>

            {/* Idiomas Disponíveis */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Idiomas Disponíveis</h2>
              <p className={styles.sectionSubtitle}>
                Selecione os idiomas em que as informações desta planta estarão disponíveis.
              </p>
            </div>

            <div className={styles.formGroupFull}>
              <div className={styles.checkboxGroup}>
                <div className={styles.checkboxItem}>
                  <input
                    id="lang-pt"
                    name="lang-pt"
                    type="checkbox"
                    checked={plantData.idiomas.includes("pt")}
                    value="pt"
                    onChange={handleLanguageChange}
                    className={styles.checkbox}
                    disabled
                  />
                  <label htmlFor="lang-pt" className={styles.checkboxLabel}>
                    Português (padrão)
                  </label>
                </div>
                <div className={styles.checkboxItem}>
                  <input
                    id="lang-xangana"
                    name="lang-xangana"
                    type="checkbox"
                    checked={plantData.idiomas.includes("xangana")}
                    value="xangana"
                    onChange={handleLanguageChange}
                    className={styles.checkbox}
                  />
                  <label htmlFor="lang-xangana" className={styles.checkboxLabel}>
                    Xangana
                  </label>
                </div>
                <div className={styles.checkboxItem}>
                  <input
                    id="lang-xopeee"
                    name="lang-xopeee"
                    type="checkbox"
                    checked={plantData.idiomas.includes("xopeee")}
                    value="xopeee"
                    onChange={handleLanguageChange}
                    className={styles.checkbox}
                  />
                  <label htmlFor="lang-xopeee" className={styles.checkboxLabel}>
                    Xopeee
                  </label>
                </div>
              </div>
              <p className={styles.hint}>
                Nota: Para cada idioma selecionado, você precisará fornecer as traduções correspondentes na seção de
                idiomas.
              </p>
            </div>
          </div>

          <div className={styles.formActions}>
            <div className={styles.actionButtons}>
              <Link href="/admin/plants" className={styles.cancelButton}>
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
                  "Salvar Planta"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
