// AppContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../utils/supabase";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(true);

  // NUEVO: estado global de inventario
  const [productos, setProductos] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // NUEVO: función para actualizar inventario global con la misma lógica que Inventario.jsx
  const updateInventarioGlobal = (listaProductos) => {
    setProductos(listaProductos || []);
    const bajo = (listaProductos || []).filter(
      (p) => p.stock < p.stockminimo
    ).length;
    setProductosBajoStock(bajo);
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <AppContext.Provider
      value={{
        user,
        darkMode,
        loading,
        login,
        logout,
        toggleDarkMode,
        supabase,
        // NUEVO
        productos,
        productosBajoStock,
        updateInventarioGlobal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
