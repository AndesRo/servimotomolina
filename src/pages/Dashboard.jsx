import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  CubeIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  FireIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosBajoStock: 0,
    ordenesPendientes: 0,
    ordenesEnReparacion: 0,
    ordenesCompletadas: 0,
    ordenesHoy: 0,
    totalClientes: 0,
    valorInventario: 0,
    ingresosMes: 0,
  });

  const [recentOrdenes, setRecentOrdenes] = useState([]);
  const [recentProductos, setRecentProductos] = useState([]);
  const [ordenesPorDia, setOrdenesPorDia] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("semana"); // semana, mes, año

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const formatPrecio = (precio) => {
    if (!precio && precio !== 0) return "$0";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Productos
      const { data: productos, count: totalProductos } = await supabase
        .from("inventario")
        .select("id, nombre, categoria, precio, stock, stock_minimo", {
          count: "exact",
        });

      const productosBajoStock =
        productos?.filter((p) => p.stock < p.stock_minimo).length || 0;

      const valorInventario =
        productos?.reduce(
          (sum, p) => sum + (p.precio || 0) * (p.stock || 0),
          0
        ) || 0;

      // Órdenes
      const hoy = new Date().toISOString().split("T")[0];
      const inicioMes = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
        .toISOString()
        .split("T")[0];

      // Órdenes con repuestos (relación ordenes_repuestos -> inventario)
      const { data: todasOrdenes } = await supabase
        .from("ordenes")
        .select(
          `
          *,
          ordenes_repuestos (
            cantidad,
            inventario (
              id,
              nombre,
              precio
            )
          )
        `
        );

      const ordenesPendientes =
        todasOrdenes?.filter((o) => o.estado === "Pendiente").length || 0;
      const ordenesEnReparacion =
        todasOrdenes?.filter((o) => o.estado === "En reparación").length || 0;
      const ordenesCompletadas =
        todasOrdenes?.filter((o) => o.estado === "Finalizada").length || 0;
      const ordenesHoy =
        todasOrdenes?.filter((o) =>
          o.created_at?.startsWith(hoy)
        ).length || 0;

      // Ingresos del mes (solo finalizadas)
      const ordenesMes =
        todasOrdenes?.filter(
          (o) => o.created_at >= inicioMes && o.estado === "Finalizada"
        ) || [];

      const ingresosMes = ordenesMes.reduce((sum, orden) => {
        const totalRepuestos =
          orden.ordenes_repuestos?.reduce((s, rep) => {
            const precio = rep.inventario?.precio || 0;
            return s + precio * (rep.cantidad || 0);
          }, 0) || 0;

        // Nombres de columnas coherentes con Ordenes.jsx (precioservicio, preciomanoobra)
        const servicio = orden.precio_servicio || orden.precioservicio || 0;
        const manoObra =
          orden.precio_mano_obra || orden.preciomanoobra || 0;

        return sum + servicio + manoObra + totalRepuestos;
      }, 0);

      // Órdenes recientes
      const { data: ordenesRecientes } = await supabase
        .from("ordenes")
        .select(
          `
          *,
          ordenes_repuestos (
            cantidad,
            inventario (
              id,
              nombre,
              precio
            )
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      // Productos recientes
      const { data: productosRecientes } = await supabase
        .from("inventario")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      // Órdenes por día (últimos 7 días)
      const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      const ordenesPorDiaData = ultimos7Dias.map((fechaISO) => {
        const count =
          todasOrdenes?.filter((o) =>
            o.created_at?.startsWith(fechaISO)
          ).length || 0;
        return {
          fecha: new Date(fechaISO).toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
          }),
          count,
        };
      });

      // Productos más vendidos
      const productosVendidos = {};
      todasOrdenes?.forEach((orden) => {
        orden.ordenes_repuestos?.forEach((rep) => {
          const productoId = rep.inventario?.id;
          const productoNombre =
            rep.inventario?.nombre || "Producto eliminado";
          const cantidad = rep.cantidad || 0;

          if (productoId) {
            if (!productosVendidos[productoId]) {
              productosVendidos[productoId] = {
                id: productoId,
                nombre: productoNombre,
                cantidad: 0,
              };
            }
            productosVendidos[productoId].cantidad += cantidad;
          }
        });
      });

      const productosMasVendidosArray = Object.values(
        productosVendidos
      )
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      // Clientes únicos (usa cliente_nombre de la tabla ordenes/presupuestos)
      const clientesUnicos = new Set(
        todasOrdenes?.map((o) =>
          o.cliente_nombre ? o.cliente_nombre.toLowerCase() : ""
        )
      ).size;

      setStats({
        totalProductos: totalProductos || 0,
        productosBajoStock,
        ordenesPendientes,
        ordenesEnReparacion,
        ordenesCompletadas,
        ordenesHoy,
        totalClientes: clientesUnicos,
        valorInventario,
        ingresosMes,
      });

      setRecentOrdenes(ordenesRecientes || []);
      setRecentProductos(productosRecientes || []);
      setOrdenesPorDia(ordenesPorDiaData);
      setProductosMasVendidos(productosMasVendidosArray);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    subtitle,
    onClick,
  }) => (
    <div
      className={`card transform-hover ${
        onClick ? "cursor-pointer hover:shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {loading
                ? "..."
                : title.includes("Ingresos") ||
                  title.includes("Total Inventario") ||
                  title.includes("$")
                ? formatPrecio(value)
                : value}
            </p>
            {trend && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  trend.value >= 0
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {trend.value >= 0 ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-2 sm:p-3 rounded-xl ${color} ml-2 flex items-center justify-center`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );

  const lineChartData = {
    labels: ordenesPorDia.map((d) => d.fecha),
    datasets: [
      {
        label: "Órdenes por día",
        data: ordenesPorDia.map((d) => d.count),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { stepSize: 1 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const doughnutChartData = {
    labels: ["Pendientes", "En reparación", "Completadas"],
    datasets: [
      {
        data: [
          stats.ordenesPendientes,
          stats.ordenesEnReparacion,
          stats.ordenesCompletadas,
        ],
        backgroundColor: [
          "rgb(234, 179, 8)", // amarillo
          "rgb(59, 130, 246)", // azul
          "rgb(34, 197, 94)", // verde
        ],
        borderColor: [
          "rgb(234, 179, 8)",
          "rgb(59, 130, 246)",
          "rgb(34, 197, 94)",
        ],
        borderWidth: 2,
        cutout: "70%",
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
  };

  const barChartData = {
    labels: productosMasVendidos.map((p) => {
      if (!p.nombre) return "Sin nombre";
      return p.nombre.length > 15
        ? `${p.nombre.substring(0, 12)}...`
        : p.nombre;
    }),
    datasets: [
      {
        label: "Cantidad vendida",
        data: productosMasVendidos.map((p) => p.cantidad),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const handleGoToOrdenes = () => navigate("/ordenes");
  const handleGoToInventario = () => navigate("/inventario");

  const handleGenerateReport = () => {
    alert("Función de generación de reporte diario. Próximamente disponible.");
  };

  const calcularTotalOrden = (orden) => {
    const totalRepuestos =
      orden.ordenes_repuestos?.reduce((sum, rep) => {
        const precio = rep.inventario?.precio || 0;
        return sum + precio * (rep.cantidad || 0);
      }, 0) || 0;
    const servicio = orden.precio_servicio || orden.precioservicio || 0;
    const manoObra =
      orden.precio_mano_obra || orden.preciomanoobra || 0;
    return totalRepuestos + servicio + manoObra;
  };

  if (loading && !stats.totalProductos) {
    return (
      <div className="page-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Panel de Control</h1>
            <p className="page-subtitle">
              Bienvenido al sistema de gestión de taller Servi-Moto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </button>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="input-field text-sm py-1.5"
            >
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="ano">Este año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Inventario"
          value={stats.valorInventario}
          icon={CubeIcon}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          subtitle={`${stats.totalProductos} productos`}
          trend={{ value: 5 }}
          onClick={handleGoToInventario}
        />
        <StatCard
          title="Productos bajo stock"
          value={stats.productosBajoStock}
          icon={ExclamationTriangleIcon}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          subtitle="Requieren atención"
          trend={{ value: -2 }}
          onClick={handleGoToInventario}
        />
        <StatCard
          title="Órdenes activas"
          value={stats.ordenesPendientes + stats.ordenesEnReparacion}
          icon={WrenchScrewdriverIcon}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          subtitle={`${stats.ordenesHoy} hoy`}
          trend={{ value: 8 }}
          onClick={handleGoToOrdenes}
        />
        <StatCard
          title="Ingresos del mes"
          value={stats.ingresosMes}
          icon={CurrencyDollarIcon}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          subtitle={`${stats.ordenesCompletadas} completadas`}
          trend={{ value: 12 }}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Órdenes por día */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Actividad de órdenes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Órdenes creadas en los últimos 7 días
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Órdenes
                </span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Estado de órdenes */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estado de órdenes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Distribución actual
              </p>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {stats.ordenesPendientes +
                stats.ordenesEnReparacion +
                stats.ordenesCompletadas}
            </div>
          </div>
          <div className="h-64">
            <Doughnut
              data={doughnutChartData}
              options={doughnutChartOptions}
            />
          </div>
        </div>
      </div>

      {/* Productos más vendidos + acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Productos más vendidos */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Productos más vendidos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Repuestos más utilizados este mes
              </p>
            </div>
            <button
              onClick={handleGoToInventario}
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              Ver inventario
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Acciones rápidas
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/ordenes?new=true")}
              className="w-full btn-primary flex items-center justify-center gap-3 px-4 py-3 text-left"
            >
              <PlusIcon className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Nueva orden</div>
                <div className="text-xs opacity-90">
                  Crear orden de trabajo
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate("/inventario?new=true")}
              className="w-full btn-secondary flex items-center justify-center gap-3 px-4 py-3 text-left"
            >
              <CubeIcon className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Agregar producto</div>
                <div className="text-xs opacity-90">
                  Nuevo al inventario
                </div>
              </div>
            </button>
            <button
              onClick={handleGenerateReport}
              className="w-full btn-secondary flex items-center justify-center gap-3 px-4 py-3 text-left"
            >
              <ChartBarIcon className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Generar reporte</div>
                <div className="text-xs opacity-90">
                  Reporte mensual
                </div>
              </div>
            </button>
            <button
              onClick={handleGoToOrdenes}
              className="w-full btn-secondary flex items-center justify-center gap-3 px-4 py-3 text-left"
            >
              <FireIcon className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="font-medium">Órdenes urgentes</div>
                <div className="text-xs opacity-90">
                  {stats.ordenesPendientes + stats.ordenesEnReparacion}{" "}
                  pendientes
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Órdenes recientes + productos recientes + clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Órdenes recientes */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Órdenes recientes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Últimas 5 órdenes de trabajo
              </p>
            </div>
            <button
              onClick={handleGoToOrdenes}
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              Ver todas
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full space-y-2">
              {recentOrdenes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay órdenes recientes
                </div>
              ) : (
                recentOrdenes.map((orden) => {
                  const totalOrden = calcularTotalOrden(orden);
                  return (
                    <div
                      key={orden.id}
                      className="card-flat hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      {/* Móvil */}
                      <div className="sm:hidden">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {orden.cliente_nombre}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {orden.moto_marca} {orden.moto_modelo}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              orden.estado === "Finalizada"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                                : orden.estado === "En reparación"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {orden.estado}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">
                            {new Date(
                              orden.created_at
                            ).toLocaleDateString("es-CL")}
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {formatPrecio(totalOrden)}
                          </div>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {orden.cliente_nombre}
                          </p>
                          {orden.cliente_telefono && (
                            <p className="text-xs text-gray-500">
                              {orden.cliente_telefono}
                            </p>
                          )}
                        </div>
                        <div className="col-span-3">
                          <p className="text-gray-700 dark:text-gray-300">
                            {orden.moto_marca} {orden.moto_modelo}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              orden.estado === "Finalizada"
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                                : orden.estado === "En reparación"
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {orden.estado}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(
                            orden.created_at
                          ).toLocaleDateString("es-CL")}
                        </div>
                        <div className="col-span-2 text-right">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {formatPrecio(totalOrden)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Productos recientes + clientes */}
        <div className="space-y-6">
          {/* Productos recientes */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Productos agregados recientemente
            </h3>
            <div className="space-y-3">
              {recentProductos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No hay productos recientes
                </div>
              ) : (
                recentProductos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={handleGoToInventario}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          producto.categoria === "Repuesto"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : producto.categoria === "Accesorio"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        <CubeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {producto.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {producto.categoria}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-sm ${
                          producto.stock < producto.stock_minimo
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {producto.stock}
                      </p>
                      <p className="text-xs text-gray-500">Stock</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={handleGoToInventario}
              className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium py-2 mt-2"
            >
              Ver todos los productos
            </button>
          </div>

          {/* Resumen de clientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Clientes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Activos este mes
                </p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stats.totalClientes}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Clientes registrados
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.ordenesHoy}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Hoy
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.ordenesCompletadas}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Completadas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
