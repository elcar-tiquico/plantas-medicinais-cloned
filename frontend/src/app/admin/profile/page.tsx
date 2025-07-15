// D:\Elcar\Projecto\frontend\src\app\profile\page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authAPI, type User } from "../../../lib/api/auth"
import styles from "./profile.module.css"

interface ProfileFormData {
  nome_completo: string
  email: string
  password: string
  confirmPassword: string
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    nome_completo: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      const authResult = await authAPI.verifyAuth()
      if (!authResult.valid) {
        router.push("/admin/login")
        return
      }
      
      const currentUser = authResult.user || authAPI.getCurrentUser()
      if (!currentUser) {
        router.push("/admin/login")
        return
      }
      
      setUser(currentUser)
      setFormData({
        nome_completo: currentUser.nome_completo,
        email: currentUser.email,
        password: "",
        confirmPassword: ""
      })
      
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpar mensagens ao editar
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSaving(true)
    setError("")
    setSuccess("")
    
    try {
      // Validações
      if (!formData.nome_completo.trim()) {
        setError("Nome completo é obrigatório")
        return
      }
      
      if (!formData.email.trim()) {
        setError("Email é obrigatório")
        return
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError("Formato de email inválido")
        return
      }
      
      // Validar senha se estiver alterando
      if (showPasswordChange) {
        if (!formData.password) {
          setError("Nova senha é obrigatória")
          return
        }
        
        if (formData.password.length < 6) {
          setError("Senha deve ter pelo menos 6 caracteres")
          return
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError("Senhas não coincidem")
          return
        }
      }
      
      // Preparar dados para atualização
      const updateData: any = {
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim().toLowerCase()
      }
      
      if (showPasswordChange && formData.password) {
        updateData.password = formData.password
      }
      
      // Atualizar perfil
      await authAPI.updateUser(user.id_usuario, updateData)
      
      // Atualizar dados locais
      const updatedUser = {
        ...user,
        nome_completo: updateData.nome_completo,
        email: updateData.email
      }
      
      setUser(updatedUser)
      localStorage.setItem('adminUser', JSON.stringify(updatedUser))
      
      setSuccess("Perfil atualizado com sucesso!")
      
      // Limpar campos de senha
      if (showPasswordChange) {
        setFormData(prev => ({
          ...prev,
          password: "",
          confirmPassword: ""
        }))
        setShowPasswordChange(false)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    authAPI.logout()
    router.push("/admin/login")
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Erro ao carregar perfil do usuário</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <h1 className={styles.userName}>{user.nome_completo}</h1>
              <p className={styles.userRole}>{user.perfil}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={styles.logoutButton}
            type="button"
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
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sair
          </button>
        </div>

        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Editar Perfil</h2>
          
          {error && (
            <div className={styles.errorAlert}>
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
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successAlert}>
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
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nome_completo" className={styles.label}>
                Nome Completo
              </label>
              <input
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.passwordSection}>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className={styles.togglePasswordButton}
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
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {showPasswordChange ? "Cancelar alteração de senha" : "Alterar senha"}
              </button>
              
              {showPasswordChange && (
                <div className={styles.passwordFields}>
                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isSaving}
                className={styles.saveButton}
              >
                {isSaving ? (
                  <>
                    <div className={styles.spinner}></div>
                    Salvando...
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
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}