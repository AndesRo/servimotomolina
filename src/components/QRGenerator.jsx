import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

const QRGenerator = ({ ordenId, clienteNombre, fecha }) => {
  const ordenData = JSON.stringify({
    ordenId,
    cliente: clienteNombre,
    fecha,
    tipo: 'orden-servi-moto'
  })

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
      <QRCodeSVG 
        value={ordenData}
        size={128}
        level="H"
        includeMargin={true}
        bgColor="#ffffff"
        fgColor="#1e40af"
      />
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600">Escanea para ver detalles</p>
        <p className="text-xs text-gray-500">Orden #{ordenId.substring(0, 8)}</p>
      </div>
    </div>
  )
}

export default QRGenerator