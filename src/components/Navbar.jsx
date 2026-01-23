import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  ClockIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, logout, darkMode, toggleDarkMode } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // si quieres mantener órdenes activas, puedes usar este state
  const [stats, setStats] = useState({ ordenesActivas: 0 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Opcional: solo para órdenes activas (sin stock mínimo)
  /*
  useEffect(() => {
    fetchOrdenesActivas();
    const interval = setInterval(fetchOrdenesActivas, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrdenesActivas = async () => {
    try {
      const { supabase } = useAppContext();
      const { data: ordenes, error } = await supabase
        .from("ordenes")
        .select("id, estado")
        .in("estado", ["Pendiente", "En reparación"]);

      if (error) throw error;

      const ordenesActivas = ordenes?.length || 0;
      setStats({ ordenesActivas });
    } catch (error) {
      console.error("Error cargando órdenes activas:", error);
    }
  };
  */

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const formatDate = () => {
    const optionsDate = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return currentTime.toLocaleDateString("es-ES", optionsDate);
  };

  const formatTime = () => {
    const optionsTime = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return currentTime.toLocaleTimeString("es-ES", optionsTime);
  };

  const isActive = (path) => location.pathname === path;

const navItems = [
  { path: "/", label: "Dashboard", icon: HomeIcon },
  { path: "/inventario", label: "Inventario", icon: CubeIcon, badge: stats.productosBajoStock },
  { path: "/ordenes", label: "Órdenes", icon: ClipboardDocumentListIcon, badge: stats.ordenesActivas },
  { path: "/presupuestos", label: "Presupuestos", icon: ClipboardDocumentListIcon },
  { path: "/calendario", label: "Calendario", icon: CalendarIcon },
];


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      setShowSearch(false);
    }
  };

  const quickActions = [
    {
      label: "Nueva Orden",
      icon: PlusIcon,
      onClick: () => navigate("/ordenes?new=true"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "Agregar Producto",
      icon: CubeIcon,
      onClick: () => navigate("/inventario?new=true"),
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  return (
    <>
      <nav className="navbar sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          {/* Fila superior */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              {/* Menú móvil */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Menú"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-base">
                    SP
                  </span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                    System-Pro
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sistemas de Gestion de Invenatario
                  </p>
                </div>
              </Link>
            </div>

            {/* Navegación principal - Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Controles de usuario */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Buscar móvil */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Buscar"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>

                {/* Hora tablet */}
                <div className="hidden md:flex lg:hidden items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-mono">{formatTime()}</span>
                </div>

                {/* Modo oscuro */}
                <button
                  onClick={toggleDarkMode}
                  className="hidden sm:block p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={
                    darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
                  }
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <MoonIcon className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Menú usuario */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                        {user.email?.split("@")[0] || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Administrador
                      </p>
                    </div>
                    <ChevronDownIcon
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {user.email?.split("@")[0] || "Usuario"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email || "admin@servimoto.cl"}
                        </p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => navigate("/perfil")}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Mi perfil</span>
                        </button>
                        <button
                          onClick={() => navigate("/configuracion")}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          <span>Configuración</span>
                        </button>
                        <button
                          onClick={() => navigate("/ayuda")}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <QuestionMarkCircleIcon className="w-4 h-4" />
                          <span>Ayuda y soporte</span>
                        </button>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                        <button
                          onClick={toggleDarkMode}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {darkMode ? (
                            <SunIcon className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <MoonIcon className="w-4 h-4 text-gray-600" />
                          )}
                          <span>{darkMode ? "Modo claro" : "Modo oscuro"}</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Búsqueda móvil */}
          {showSearch && (
            <div className="lg:hidden mt-3">
              <form onSubmit={handleSearch} className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar órdenes, productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field pl-9 sm:pl-10 py-1.5 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Segunda fila desktop */}
          <div className="hidden lg:flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-6">
              <div className="flex-1 max-w-md">
                <form onSubmit={handleSearch} className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar órdenes, productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full input-field pl-9 sm:pl-10 py-1.5 text-sm"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </form>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-mono">{formatTime()}</span>
                </div>
              </div>
            </div>

            {/* Si quieres mostrar órdenes activas, descomenta este bloque */}
            {/*
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/ordenes")}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
              >
                <WrenchScrewdriverIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  {stats.ordenesActivas} órdenes activas
                </span>
              </button>
            </div>
            */}
          </div>
        </div>
      </nav>

      {/* Menú móvil */}
      {mobileMenuOpen && user && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute top-0 left-0 w-full sm:w-80 h-full bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">SM</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 dark:text-white">
                      System-Pro
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Menú de navegación
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {user.email?.split("@")[0] || "Usuario"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email || "admin@servimoto.cl"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <nav className="space-y-1 mb-6">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setMobileMenuOpen(false);
                      }}
                      className={`${action.color} text-white p-2 rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md`}
                    >
                      <action.icon className="w-4 h-4 mb-1" />
                      <span className="text-xs font-medium">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-xs">{formatDate()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span className="font-mono text-xs">
                        {formatTime()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleDarkMode}
                      className="flex-1 btn-secondary py-2 text-xs"
                    >
                      {darkMode ? "Modo claro" : "Modo oscuro"}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 btn-primary py-2 text-xs"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

