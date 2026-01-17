import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase, TABLES } from '../utils/supabase'

const ImportExcel = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Validar estructura
        const requiredColumns = ['nombre', 'categoria', 'marca', 'modelo', 'stock', 'stock_minimo']
        const headers = Object.keys(jsonData[0] || {})
        
        const isValid = requiredColumns.every(col => 
          headers.some(h => h.toLowerCase() === col.toLowerCase())
        )

        if (!isValid) {
          throw new Error('Estructura del archivo inválida. Verifica las columnas requeridas.')
        }

        // Normalizar datos
        const productos = jsonData.map(row => ({
          nombre: row.nombre || row.Nombre,
          categoria: (row.categoria || row.Categoria || 'Repuesto').charAt(0).toUpperCase() + 
                    (row.categoria || row.Categoria || 'Repuesto').slice(1),
          marca: row.marca || row.Marca || '',
          modelo: row.modelo || row.Modelo || '',
          stock: parseInt(row.stock || row.Stock || 0),
          stock_minimo: parseInt(row.stock_minimo || row['stock_minimo'] || row['Stock Minimo'] || 5)
        }))

        // Insertar en Supabase
        const { data: inserted, error } = await supabase
          .from(TABLES.INVENTARIO)
          .insert(productos)
          .select()

        if (error) throw error

        setImportResult({
          success: true,
          message: `Se importaron ${inserted.length} productos exitosamente`,
          count: inserted.length
        })

        if (onImportComplete) {
          onImportComplete(inserted)
        }

      } catch (error) {
        setImportResult({
          success: false,
          message: `Error: ${error.message}`
        })
      } finally {
        setLoading(false)
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        Importar desde Excel/CSV
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subir archivo (.xlsx, .csv)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
          />
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Estructura requerida:</p>
          <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
            nombre, categoria, marca, modelo, stock, stock_minimo
          </code>
        </div>

        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Importando...</span>
          </div>
        )}

        {importResult && (
          <div className={`p-4 rounded-lg ${
            importResult.success 
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {importResult.message}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportExcel