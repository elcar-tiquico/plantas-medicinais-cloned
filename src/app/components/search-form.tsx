"use client"

import type React from "react"
import { useState } from "react"
import { useSearch } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import styles from "./search-form.module.css"

export function SearchForm() {
  const { filters, setFilters, performSearch, clearSearch, isLoading } = useSearch()
  const { translate } = useLanguage()
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)

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
          setFilters((prev) => ({ ...prev, popularName: "Carqueja" }))
        } else {
          setFilters((prev) => ({ ...prev, popularName: "Aroeira" }))
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

  return (
    <div className={styles.searchForm}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>{translate("search.title")}</h2>
      </div>
      <div className={styles.searchBody}>
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
            <label htmlFor="usoTradicional" className={styles.formLabel}>
              {translate("search.traditionalUse")}
            </label>
            <select
              id="usoTradicional"
              className={styles.formSelect}
              value={filters.traditionalUse}
              onChange={(e) => setFilters((prev) => ({ ...prev, traditionalUse: e.target.value }))}
            >
              <option value="">Escolha ou busque um uso na lista...</option>
              <option value="digestivos">Problemas digestivos</option>
              <option value="inflamatório">Anti-inflamatório</option>
              <option value="renais">Problemas renais</option>
              <option value="febre">Febre</option>
              <option value="diabetes">Diabetes</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="autor" className={styles.formLabel}>
              {translate("search.author")}
            </label>
            <input
              type="text"
              id="autor"
              className={styles.formInput}
              placeholder={translate("search.placeholder.author")}
              value={filters.author}
              onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))}
            />
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
            >
              <option value="">Escolha ou busque um local na lista...</option>
              <option value="Amazônia">Amazônia</option>
              <option value="Cerrado">Cerrado</option>
              <option value="Caatinga">Caatinga</option>
              <option value="Mata Atlântica">Mata Atlântica</option>
              <option value="Pampa">Pampa</option>
              <option value="Pantanal">Pantanal</option>
            </select>
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
