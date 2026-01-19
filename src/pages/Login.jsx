import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { 
  LockClosedIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAppContext()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen-safe flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900 py-4 sm:py-8 px-4 safe-area-padding">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid opacity-20"></div>
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-48 h-48 sm:w-72 sm:h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative w-full max-w-md space-y-8 backdrop-blur-sm bg-white/10 dark:bg-gray-900/50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl mb-4 sm:mb-6">
            <WrenchScrewdriverIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            System-Pro
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base md:text-lg text-gray-300">
            Sistema de gestión de Inventario
          </p>
          <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-2 text-blue-300">
            <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Acceso seguro para administradores</span>
          </div>
        </div>
        
        <form className="mt-4 sm:mt-6 md:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error animate-slide-in">
              <div className="flex items-center">
                <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {error}
              </div>
            </div>
          )}
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="email" className="input-label text-gray-300">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base"
                  placeholder="admin@servimoto.com"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="input-label text-gray-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-sm sm:text-base pr-10 sm:pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 sm:py-4 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Acceder al sistema</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              Solo personal autorizado puede acceder
            </p>
            <p className="text-xs text-gray-500 mt-1 sm:mt-2">
              Si tienes problemas para acceder, contacta al administrador
            </p>
          </div>
        </form>
        
        <div className="text-center pt-4 sm:pt-6 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2 text-gray-400 mb-2">
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span className="text-xs">Servicios de Gestion</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} System-Pro. Sistema de gestión.
          </p>
        </div>
      </div>

      {/* Estilos para animaciones */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(20px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-15px, 15px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default Login