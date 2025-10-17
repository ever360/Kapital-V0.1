import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export function useEmpresa() {
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    obtenerEmpresa()
  }, [])

  const obtenerEmpresa = async () => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener datos del usuario incluyendo empresa
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('empresa_id, rol_sistema')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      // Si no tiene empresa, no hay nada que cargar
      if (!userData.empresa_id) {
        setEmpresa(null)
        setLoading(false)
        return
      }

      // Obtener datos de la empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresas')
        .select('*, configuracion_empresa(*)')
        .eq('id', userData.empresa_id)
        .single()

      if (empresaError) throw empresaError

      // Contar sucursales activas
      const { count: sucursalesActivas } = await supabase
        .from('sucursales')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', userData.empresa_id)
        .eq('estado', 'activa')

      setEmpresa({
        ...empresaData,
        sucursales_activas: sucursalesActivas || 0,
        rol_usuario: userData.rol_sistema
      })
    } catch (err) {
      console.error('Error al obtener empresa:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const puedeCrearSucursal = () => {
    if (!empresa) return false
    return empresa.sucursales_activas < empresa.sucursales_contratadas
  }

  const sucursalesDisponibles = () => {
    if (!empresa) return 0
    return empresa.sucursales_contratadas - empresa.sucursales_activas
  }

  return {
    empresa,
    loading,
    error,
    puedeCrearSucursal,
    sucursalesDisponibles,
    recargar: obtenerEmpresa
  }
}
