# Servi Moto - Sistema de Gestión de Taller Mecánico

Aplicación web para la gestión integral de un taller mecánico de motos, que permite administrar inventario, órdenes de trabajo, calendario de citas y generar documentos en PDF, todo integrado con Supabase como backend. [file:3][file:5][file:10][file:13][file:14][file:16]

## Características principales

- **Autenticación** de usuarios con Supabase (login, sesión persistente y protección de rutas privadas). [file:12][file:14]
- Panel de **Dashboard** con visualizaciones y métricas usando Chart.js y react-chartjs-2. [file:3][file:11]
- Módulo de **Inventario** de repuestos con CRUD, control de stock y stock mínimo. [file:13]
- Gestión de **Órdenes de trabajo**:
  - Creación/edición de órdenes con datos de cliente, moto, servicio y estado. [file:10]
  - Asociación de repuestos a la orden con actualización automática de stock. [file:10][file:13]
  - Cálculo automático de totales (servicio, mano de obra, repuestos) en formato CLP. [file:10]
  - Exportación de orden a **PDF** con jsPDF + html2canvas. [file:10]
  - Envío de información de la orden vía **WhatsApp** al cliente. [file:10]
- **Calendario** de citas y órdenes usando react-big-calendar y moment. [file:3][file:9]
- Importación masiva de productos desde **Excel/CSV** al inventario usando xlsx. [file:16]
- Generación de **códigos QR** para productos/órdenes con react-qr-code. [file:3][file:17]
- **Tema oscuro/claro** global, persistente en localStorage. [file:7][file:14]
- UI responsive construida con **React**, **Vite**, **Tailwind CSS** y Heroicons. [file:2][file:3][file:5][file:7][file:10][file:13][file:15]

## Tecnologías utilizadas

- **Frontend**
  - React 18 + Vite. [file:3][file:5][file:6]
  - React Router DOM para enrutamiento. [file:3][file:5]
  - Tailwind CSS + PostCSS + Autoprefixer para estilos. [file:2][file:3][file:7]
  - Heroicons React para iconografía. [file:3][file:10][file:15]
- **Backend / BaaS**
  - Supabase (auth, base de datos, almacenamiento de tablas `INVENTARIO`, `ORDENES`, etc.). [file:8][file:10][file:13][file:14][file:16]
- **Librerías adicionales**
  - react-big-calendar y moment para calendario. [file:3][file:9]
  - chart.js + react-chartjs-2 para gráficos. [file:3][file:11]
  - xlsx para importación de Excel/CSV. [file:3][file:16]
  - html2canvas y jsPDF para generación de PDFs. [file:3][file:10]
  - react-qr-code / qrcode para códigos QR. [file:3][file:17]
  - react-datepicker para selección de fechas (según uso en páginas). [file:3]

## Estructura del proyecto

Principales archivos y carpetas (según los componentes incluidos):

- `index.html`: plantilla principal de la app Vite. [file:1]
- `main.jsx`: punto de entrada de React. [file:6]
- `App.jsx`: definición de rutas, layout general y protección de rutas privadas. [file:5]
- `context/AppContext.jsx`: contexto global para usuario, tema oscuro y Supabase. [file:14]
- `util/supabase.js`: configuración de cliente de Supabase y constantes de tablas. [file:8]
- `pages/Login.jsx`: pantalla de login con Supabase Auth. [file:12]
- `pages/Dashboard.jsx`: panel principal con indicadores y gráficos. [file:11]
- `pages/Inventario.jsx`: CRUD de inventario, control de stock y QR. [file:13]
- `pages/Ordenes.jsx`: gestión completa de órdenes de trabajo. [file:10]
- `pages/Calendario.jsx`: calendario de citas/órdenes. [file:9]
- `components/Navbar.jsx`: barra de navegación superior con controles y tema. [file:15]
- `components/ImportExcel.jsx`: importación masiva de productos desde Excel/CSV. [file:16]
- `components/QRGenerator.jsx`: componente para generación de códigos QR. [file:17]
- `index.css` / `App.css`: estilos globales y utilidades adicionales. [file:4][file:7]
- `tailwind.config.js`: configuración de Tailwind (colores, fuentes, paths, etc.). [file:2]
- `package.json`: scripts de NPM y dependencias del proyecto. [file:3]

## Requisitos previos

- Node.js y npm instalados.
- Cuenta y proyecto en Supabase configurado.
- Variables/URL de Supabase definidas en `supabase.js` (URL, anon key, nombres de tablas). [file:8]

## Instalación

1. Clonar este repositorio:

   ```bash
   git clone https://github.com/AndesRo/servi-moto.git
   cd servi-moto
   ```
