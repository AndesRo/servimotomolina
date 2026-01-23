# Servi-Moto 🔧🏍️

Sistema web profesional para la **gestión de inventario y órdenes de trabajo** de talleres de motocicletas. Permite controlar repuestos, órdenes de reparación, clientes y estados de servicio de forma moderna y responsiva.

---

## 🛠️ Stack Tecnológico

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=FFD62E)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=flat&logo=javascript&logoColor=F7DF1E)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-0F172A?style=flat&logo=tailwindcss&logoColor=38BDF8)

### Backend y Base de Datos

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=181818)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

### Otras librerías clave

- `react-router-dom` para enrutamiento.
- `react-big-calendar` para calendario de órdenes.
- `jsPDF` + `html2canvas` para generación de PDFs de órdenes.
- `xlsx` para importación de inventario desde Excel/CSV. [web:100][web:104]

---

## ✨ Características principales

- Gestión de inventario de repuestos con control de stock mínimo.
- Órdenes de trabajo con detalle de cliente, moto, servicio, repuestos y costos.
- Exportación de órdenes a PDF y envío de resumen por WhatsApp.
- Calendario visual de órdenes (pendientes, en reparación, finalizadas).
- Dashboard con métricas rápidas (stock bajo, órdenes activas).
- Autenticación segura con Supabase y modo oscuro. [file:10][file:9][file:15]

---

## 🚀 Scripts de desarrollo

```bash
# Instalar dependencias
npm install

# Entorno de desarrollo
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview


⚙️ Configuración rápida
Clonar el repositorio.

Crear el archivo .env con las variables de Supabase:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

Configurar tablas de inventario, ordenes, ordenes_repuestos en Supabase según el esquema usado en el código.

Ejecutar npm run dev y acceder a http://localhost:5173. [file:3][file:14]
```
