import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const signUp = async (email, password, userData) => {
  try {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
        },
      },
    })
    
    if (authError) throw authError

    // 2. Esperar a que el usuario se cree
    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    // 3. Guardar en la tabla usuarios
    const { error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        activo: true,
        rol: 'vendedor',
        socio: false,
      })

    if (dbError) {
      console.error('Error al guardar en tabla usuarios:', dbError)
      // No lanzamos error porque el usuario ya existe en Auth
    }

    return authData
  } catch (error) {
    console.error('Error en signUp:', error)
    throw error
  }
}
