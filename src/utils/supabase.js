import { createClient } from '@supabase/supabase-js'

// Verifica que las variables de entorno estén disponibles
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validación explícita
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Variables de entorno de Supabase no encontradas')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'No definida')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'No definida')
  console.error('Por favor, verifica tu archivo .env')
  
  // Para desarrollo, puedes mostrar un mensaje más claro
  if (import.meta.env.DEV) {
    alert('Error: Variables de Supabase no configuradas. Verifica tu archivo .env')
  }
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-servimotomolina-auth',
    },
  }
)


// Tablas de la base de datos
export const TABLES = {
  INVENTARIO: 'inventario',
  ORDENES: 'ordenes',
  ORDENES_REPUESTOS: 'ordenes_repuestos'
}

// Función para verificar conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('inventario').select('count')
    if (error) throw error
    console.log('✅ Conexión a Supabase establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message)
    return false
  }
}