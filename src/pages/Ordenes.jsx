import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const Ordenes = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingOrden, setEditingOrden] = useState(null);

  const [selectedRepuestos, setSelectedRepuestos] = useState([]);
  const [selectedOrdenForActions, setSelectedOrdenForActions] =
    useState(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const [selectedOrdenDetalle, setSelectedOrdenDetalle] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const [serviciosPredefinidos] = useState([
    {
      id: "cambio-aceite",
      nombre: "Cambio de aceite",
      repuestos: ["Aceite motor 10W40", "Filtro de aceite"],
      tiempoEstimado: "30-45 minutos",
      checklist: [
        "Revisar nivel y estado del aceite antiguo",
        "Cambiar filtro de aceite",
        "Revisar posible presencia de limaduras",
        "Registrar kilometraje actual en la ficha",
      ],
      proximo:
        "Próximo cambio de aceite en 3.000 - 5.000 km o 6 meses (lo que ocurra primero).",
    },
    {
      id: "ajuste-cadena",
      nombre: "Ajuste de cadena",
      repuestos: ["Lubricante de cadena"],
      tiempoEstimado: "20-30 minutos",
      checklist: [
        "Revisar tensión de cadena",
        "Revisar desgaste de piñón y corona",
        "Lubricar cadena",
        "Verificar alineación de la rueda trasera",
      ],
      proximo: "Revisar tensión y lubricación de cadena cada 1.000 km.",
    },
    {
      id: "mantencion-completa",
      nombre: "Mantención completa",
      repuestos: [
        "Aceite motor",
        "Filtro de aceite",
        "Filtro de aire",
        "Bujías",
      ],
      tiempoEstimado: "1 día de trabajo",
      checklist: [
        "Cambio de aceite y filtro",
        "Revisión y limpieza filtro de aire",
        "Revisión bujías",
        "Revisión frenos (pastillas y discos)",
        "Revisión dirección y suspensión",
        "Revisión sistema eléctrico y luces",
      ],
      proximo: "Próxima mantención completa en 10.000 km o 12 meses.",
    },
    {
      id: "cambio-pastillas",
      nombre: "Cambio pastillas de freno",
      repuestos: [
        "Pastillas de freno delanteras",
        "Pastillas de freno traseras",
      ],
      tiempoEstimado: "45-60 minutos",
      checklist: [
        "Revisar espesor de pastillas actuales",
        "Verificar estado de discos",
        "Cambiar pastillas y asentar correctamente",
        "Revisar nivel de líquido de frenos",
      ],
      proximo:
        "Revisar estado de pastillas cada 5.000 km o ante ruidos anormales.",
    },
  ]);

  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [recordarProxima, setRecordarProxima] = useState(false);

  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    moto_marca: "",
    moto_modelo: "",
    problema: "",
    estado: "Pendiente",
    precio_servicio: "",
    precio_mano_obra: "",
  });

  useEffect(() => {
    fetchOrdenes();
    fetchProductos();
  }, []);

  useEffect(() => {
    filterOrdenes();
  }, [ordenes, searchTerm, filterEstado]);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ordenes")
        .select(
          `
          *,
          ordenes_repuestos (
            id,
            cantidad,
            inventario:producto_id (
              id,
              nombre,
              marca,
              modelo,
              precio
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrdenes(data || []);
      setFilteredOrdenes(data || []);
    } catch (error) {
      console.error("Error fetching ordenes:", error);
      alert("❌ Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error("Error fetching productos:", error);
      alert("❌ Error al cargar los productos");
    }
  };

  const filterOrdenes = () => {
    let filtered = [...ordenes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.cliente_nombre.toLowerCase().includes(term) ||
          o.moto_marca?.toLowerCase().includes(term) ||
          o.moto_modelo?.toLowerCase().includes(term) ||
          o.cliente_telefono?.includes(term) ||
          o.id.toLowerCase().includes(term)
      );
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((o) => o.estado === filterEstado);
    }

    setFilteredOrdenes(filtered);
  };

  const formatPrecio = (precio) => {
    if (!precio && precio !== 0) return "$0";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const formatPrecioParaInput = (precio) => {
    if (!precio && precio !== 0) return "";
    return new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(precio);
  };

  const parsePrecioInput = (precioStr) => {
    if (!precioStr) return 0;
    return (
      parseFloat(precioStr.replace(/\./g, "").replace(",", ".")) || 0
    );
  };

  const calcularTotalOrden = (orden) => {
    if (!orden) return 0;
    const totalRepuestos =
      orden.ordenes_repuestos?.reduce((sum, rep) => {
        const precio = rep.inventario?.precio || 0;
        return sum + precio * (rep.cantidad || 0);
      }, 0) || 0;
    const servicio = orden.precio_servicio || 0;
    const manoObra = orden.precio_mano_obra || 0;
    return totalRepuestos + servicio + manoObra;
  };

  const exportToPDF = async (orden) => {
    try {
      if (!orden) {
        alert("❌ No hay orden seleccionada");
        return;
      }

      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.width = "800px";
      element.style.padding = "20px";
      element.style.backgroundColor = "white";
      element.style.color = "black";
      element.style.fontFamily = "Arial, sans-serif";

      const fecha = new Date(orden.created_at).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const totalRepuestosPrecio =
        orden.ordenes_repuestos?.reduce((sum, rep) => {
          const precio = rep.inventario?.precio || 0;
          return sum + precio * (rep.cantidad || 0);
        }, 0) || 0;

      const totalOrden = calcularTotalOrden(orden);

      element.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #3b82f6;padding-bottom:20px;">
            <div>
              <h1 style="color:#1e40af;margin:0;font-size:28px;font-weight:bold;">SERVI MOTO</h1>
              <p style="color:#6b7280;margin:5px 0;font-size:14px;">Taller Mecánico Especializado</p>
              <p style="color:#6b7280;margin:0;font-size:12px;">Orden de Trabajo y Presupuesto</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:24px;font-weight:bold;color:#1e40af;">ORDEN ${orden.id
                .substring(0, 8)
                .toUpperCase()}</div>
              <div style="font-size:14px;color:#6b7280;">${fecha}</div>
            </div>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="color:#1e40af;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Información del Cliente</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;">
              <div><strong>Nombre:</strong> ${orden.cliente_nombre ||
                "No especificado"}</div>
              <div><strong>Teléfono:</strong> ${orden.cliente_telefono ||
                "No registrado"}</div>
              <div><strong>Marca:</strong> ${orden.moto_marca ||
                "No especificada"}</div>
              <div><strong>Modelo:</strong> ${orden.moto_modelo ||
                "No especificado"}</div>
            </div>
          </div>

          <div style="margin-bottom:30px;">
            <h2 style="color:#1e40af;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Detalles de la Reparación y Presupuesto</h2>
            <div style="margin-top:15px;">
              <strong>Servicio:</strong>
              <div style="background:#f9fafb;padding:15px;border-radius:8px;margin-top:10px;border-left:4px solid #3b82f6;">
                ${orden.problema || "No especificado"}
              </div>
            </div>
            <div style="margin-top:20px;">
              <h3 style="color:#374151;font-size:16px;margin-bottom:10px;">Desglose del Presupuesto</h3>
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;">
                <tbody>
                  <tr>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Servicio</td>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                      orden.precio_servicio || 0
                    )}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Mano de obra</td>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                      orden.precio_mano_obra || 0
                    )}</td>
                  </tr>
                  ${
                    orden.ordenes_repuestos &&
                    orden.ordenes_repuestos.length > 0
                      ? `<tr>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Repuestos</td>
                    <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                      totalRepuestosPrecio
                    )}</td>
                  </tr>`
                      : ""
                  }
                  <tr style="background:#1e40af;color:white;">
                    <td style="padding:12px 15px;font-weight:bold;">TOTAL</td>
                    <td style="padding:12px 15px;text-align:right;font-weight:bold;font-size:18px;">${formatPrecio(
                      totalOrden
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          ${
            orden.ordenes_repuestos && orden.ordenes_repuestos.length > 0
              ? `
          <div style="margin-bottom:30px;">
            <h2 style="color:#1e40af;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Repuestos Utilizados</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:15px;">
              <thead>
                <tr style="background:#1e40af;color:white;">
                  <th style="padding:12px;text-align:left;border:1px solid #d1d5db;">Producto</th>
                  <th style="padding:12px;text-align:center;border:1px solid #d1d5db;">Cantidad</th>
                  <th style="padding:12px;text-align:left;border:1px solid #d1d5db;">Precio Unitario</th>
                  <th style="padding:12px;text-align:left;border:1px solid #d1d5db;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orden.ordenes_repuestos
                  .map((rep, index) => {
                    const precio = rep.inventario?.precio || 0;
                    const subtotal = precio * (rep.cantidad || 0);
                    return `
                    <tr style="background:${
                      index % 2 === 0 ? "#f9fafb" : "white"
                    };">
                      <td style="padding:10px;border:1px solid #d1d5db;">${
                        rep.inventario?.nombre || "Producto no encontrado"
                      }</td>
                      <td style="padding:10px;text-align:center;border:1px solid #d1d5db;">${
                        rep.cantidad
                      }</td>
                      <td style="padding:10px;border:1px solid #d1d5db;">${formatPrecio(
                        precio
                      )}</td>
                      <td style="padding:10px;border:1px solid #d1d5db;">${formatPrecio(
                        subtotal
                      )}</td>
                    </tr>`;
                  })
                  .join("")}
                <tr style="background:#f3f4f6;font-weight:bold;">
                  <td colspan="3" style="padding:10px;border:1px solid #d1d5db;text-align:right;">Total Repuestos</td>
                  <td style="padding:10px;border:1px solid #d1d5db;">${formatPrecio(
                    totalRepuestosPrecio
                  )}</td>
                </tr>
              </tbody>
            </table>
          </div>`
              : ""
          }

          <div style="margin-top:40px;padding-top:20px;border-top:2px dashed #d1d5db;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;">
              <div>
                <div style="border-top:1px solid #d1d5db;padding-top:10px;text-align:center;height:60px;">
                  <p style="font-size:12px;color:#6b7280;">Firma del Mecánico</p>
                </div>
              </div>
              <div>
                <div style="border-top:1px solid #d1d5db;padding-top:10px;text-align:center;height:60px;">
                  <p style="font-size:12px;color:#6b7280;">Firma del Cliente</p>
                  <p style="font-size:10px;color:#9ca3af;">Acepto el presupuesto y autorizo el trabajo</p>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:50px;padding-top:20px;border-top:2px solid #1e40af;text-align:center;font-size:11px;color:#6b7280;">
            <p>Servi Moto • Taller Mecánico</p>
            <p>Orden y presupuesto generados el ${new Date().toLocaleDateString(
              "es-ES"
            )} • ID: ${orden.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>
      `;

      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      document.body.removeChild(element);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      const fechaStr = new Date().toISOString().split("T")[0];
      const nombreCliente =
        orden.cliente_nombre?.replace(/[^a-zA-Z0-9]/g, "").substring(0, 20) ||
        "cliente";
      const fileName = `orden_${nombreCliente}_${fechaStr}.pdf`;

      pdf.save(fileName);
      alert(`✅ PDF "${fileName}" generado exitosamente`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("❌ Error al generar el PDF. Por favor, intenta de nuevo.");
    }
  };

  const shareViaWhatsApp = (orden) => {
    if (!orden.cliente_telefono) {
      alert("❌ El cliente no tiene número de teléfono registrado");
      return;
    }

    let phone = orden.cliente_telefono.replace(/\D/g, "");
    if (phone.startsWith("56")) phone = phone.substring(2);
    if (phone.startsWith("0")) phone = phone.substring(1);
    if (phone.length !== 9) {
      alert(
        "❌ Número de teléfono inválido. Debe tener 9 dígitos (ej: 912345678)"
      );
      return;
    }

    const phoneNumber = `56${phone}`;
    const fecha = new Date(orden.created_at).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const totalRepuestosPrecio =
      orden.ordenes_repuestos?.reduce((sum, rep) => {
        const precio = rep.inventario?.precio || 0;
        return sum + precio * (rep.cantidad || 0);
      }, 0) || 0;

    const repuestosText =
      orden.ordenes_repuestos && orden.ordenes_repuestos.length > 0
        ? `\n\nRepuestos utilizados:\n${orden.ordenes_repuestos
            .map((rep) => {
              const precio = rep.inventario?.precio || 0;
              return `- ${rep.cantidad}x ${
                rep.inventario?.nombre || "Producto"
              } (${formatPrecio(precio)} c/u)`;
            })
            .join("\n")}`
        : "";

    let proximaMantencionText = "";
    if (recordarProxima && (orden.tipo_servicio || selectedServicioId)) {
      const servicio = serviciosPredefinidos.find(
        (s) =>
          s.id === orden.tipo_servicio ||
          s.id === selectedServicioId
      );
      if (servicio) {
        proximaMantencionText = `\n\nPróxima mantención recomendada:\n${servicio.proximo}`;
      }
    }

    const message = `Hola ${
      orden.cliente_nombre || ""
    }!

INFORMACIÓN DE TU ORDEN - SERVI MOTO

Orden: ${orden.id.substring(0, 8).toUpperCase()}
Fecha: ${fecha}
Moto: ${orden.moto_marca || "No especificada"} ${
      orden.moto_modelo || ""
    }
Servicio: ${orden.problema || "No especificado"}
Estado: ${orden.estado}

PRESUPUESTO:
Servicio: ${formatPrecio(orden.precio_servicio || 0)}
Mano de obra: ${formatPrecio(orden.precio_mano_obra || 0)}
Repuestos: ${formatPrecio(totalRepuestosPrecio)}
TOTAL: ${formatPrecio(
      calcularTotalOrden(orden)
    )}${repuestosText}${proximaMantencionText}

Taller Servi Moto
Horario: Lunes a Viernes 08:00 - 18:00

Gracias por confiar en nosotros.
Mensaje generado automáticamente por el sistema Servi Moto`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.cliente_nombre.trim()) {
        alert("❌ El nombre del cliente es requerido");
        return;
      }
      if (!form.problema.trim()) {
        alert("❌ La descripción del servicio es requerida");
        return;
      }

      const ordenData = {
        cliente_nombre: form.cliente_nombre.trim(),
        cliente_telefono: form.cliente_telefono.trim() || null,
        moto_marca: form.moto_marca.trim() || null,
        moto_modelo: form.moto_modelo.trim() || null,
        problema: form.problema.trim(),
        estado: form.estado,
        precio_servicio: parsePrecioInput(form.precio_servicio) || 0,
        precio_mano_obra: parsePrecioInput(form.precio_mano_obra) || 0,
        tipo_servicio: selectedServicioId || null,
        updated_at: new Date().toISOString(),
      };

      let ordenId;

      if (editingOrden) {
        const { error } = await supabase
          .from("ordenes")
          .update(ordenData)
          .eq("id", editingOrden.id);
        if (error) throw error;
        ordenId = editingOrden.id;
        alert("✅ Orden actualizada correctamente");
      } else {
        const { data, error } = await supabase
          .from("ordenes")
          .insert(ordenData)
          .select("*")
          .single();
        if (error) throw error;
        ordenId = data.id;
        alert("✅ Orden creada correctamente");
      }

      await handleRepuestos(ordenId, !!editingOrden);

      setShowModal(false);
      setEditingOrden(null);
      resetForm();
      fetchOrdenes();
    } catch (error) {
      console.error("Error saving orden:", error);
      alert(`❌ Error al guardar la orden: ${error.message}`);
    }
  };

  const handleRepuestos = async (ordenId, isEditing) => {
    try {
      if (isEditing) {
        const { data: repuestosAnteriores, error: errorAnteriores } =
          await supabase
            .from("ordenes_repuestos")
            .select("producto_id, cantidad")
            .eq("orden_id", ordenId);

        if (errorAnteriores) throw errorAnteriores;

        for (const repuesto of repuestosAnteriores || []) {
          const producto = productos.find((p) => p.id === repuesto.producto_id);
          if (producto) {
            const nuevoStock = (producto.stock || 0) + repuesto.cantidad;
            await supabase
              .from("inventario")
              .update({ stock: nuevoStock })
              .eq("id", repuesto.producto_id);
          }
        }

        await supabase.from("ordenes_repuestos").delete().eq("orden_id", ordenId);
      }

      for (const repuesto of selectedRepuestos) {
        if (!repuesto.id || !repuesto.cantidad || repuesto.cantidad <= 0)
          continue;

        const producto = productos.find((p) => p.id === repuesto.id);
        if (!producto) continue;

        if ((producto.stock || 0) < repuesto.cantidad) {
          alert(
            `❌ Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`
          );
          continue;
        }

        await supabase.from("ordenes_repuestos").insert({
          orden_id: ordenId,
          producto_id: repuesto.id,
          cantidad: repuesto.cantidad,
        });

        const nuevoStock = (producto.stock || 0) - repuesto.cantidad;
        await supabase
          .from("inventario")
          .update({ stock: nuevoStock })
          .eq("id", repuesto.id);
      }
    } catch (error) {
      console.error("Error handling repuestos:", error);
      throw error;
    }
  };

  const handleEdit = (orden) => {
    setEditingOrden(orden);
    setForm({
      cliente_nombre: orden.cliente_nombre || "",
      cliente_telefono: orden.cliente_telefono || "",
      moto_marca: orden.moto_marca || "",
      moto_modelo: orden.moto_modelo || "",
      problema: orden.problema || "",
      estado: orden.estado || "Pendiente",
      precio_servicio: formatPrecioParaInput(orden.precio_servicio || 0),
      precio_mano_obra: formatPrecioParaInput(orden.precio_mano_obra || 0),
    });

    setSelectedServicioId(orden.tipo_servicio || "");

    if (orden.ordenes_repuestos) {
      const repuestos = orden.ordenes_repuestos
        .map((r) => ({
          id: r.inventario?.id,
          nombre: r.inventario?.nombre,
          cantidad: r.cantidad || 1,
        }))
        .filter((r) => r.id);
      setSelectedRepuestos(repuestos);
    } else {
      setSelectedRepuestos([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar esta orden? Esta acción restaurará el stock de los repuestos utilizados pero NO se puede deshacer."
      )
    )
      return;

    try {
      const { data: repuestos, error: repuestosError } = await supabase
        .from("ordenes_repuestos")
        .select("producto_id, cantidad")
        .eq("orden_id", id);

      if (repuestosError) throw repuestosError;

      for (const repuesto of repuestos || []) {
        const producto = productos.find((p) => p.id === repuesto.producto_id);
        if (producto) {
          const nuevoStock = (producto.stock || 0) + repuesto.cantidad;
          await supabase
            .from("inventario")
            .update({ stock: nuevoStock })
            .eq("id", repuesto.producto_id);
        }
      }

      await supabase.from("ordenes_repuestos").delete().eq("orden_id", id);
      const { error } = await supabase.from("ordenes").delete().eq("id", id);
      if (error) throw error;

      fetchOrdenes();
      alert("✅ Orden eliminada correctamente. Stock restaurado.");
    } catch (error) {
      console.error("Error deleting orden:", error);
      alert("❌ Error al eliminar la orden");
    }
  };

  const addRepuesto = () => {
    setSelectedRepuestos([
      ...selectedRepuestos,
      { id: "", nombre: "", cantidad: 1 },
    ]);
  };

  const removeRepuesto = (index) => {
    const nuevos = [...selectedRepuestos];
    nuevos.splice(index, 1);
    setSelectedRepuestos(nuevos);
  };

  const updateRepuesto = (index, field, value) => {
    const nuevos = [...selectedRepuestos];
    if (field === "id") {
      const producto = productos.find((p) => p.id === value);
      nuevos[index] = {
        ...nuevos[index],
        id: value,
        nombre: producto?.nombre || "",
      };
    } else {
      nuevos[index] = { ...nuevos[index], [field]: value };
    }
    setSelectedRepuestos(nuevos);
  };

  const resetForm = () => {
    setForm({
      cliente_nombre: "",
      cliente_telefono: "",
      moto_marca: "",
      moto_modelo: "",
      problema: "",
      estado: "Pendiente",
      precio_servicio: "",
      precio_mano_obra: "",
    });
    setSelectedRepuestos([]);
    setSelectedServicioId("");
    setRecordarProxima(false);
    setEditingOrden(null);
    setShowModal(false);
  };

  const handlePrecioChange = (field, value) => {
    const cleanValue = value.replace(/[^0-9.,]/g, "");
    setForm({ ...form, [field]: cleanValue });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Finalizada":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300";
      case "En reparación":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300";
      case "Pendiente":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "Finalizada":
        return (
          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      case "En reparación":
        return (
          <WrenchScrewdriverIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        );
      case "Pendiente":
        return (
          <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        );
      default:
        return (
          <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const openDetalleOrden = (orden) => {
    setSelectedOrdenDetalle(orden);
    setShowDetalleModal(true);
  };

  const OrdenCard = ({ orden }) => {
    const totalOrden = calcularTotalOrden(orden);

    return (
      <div className="card mb-3 border-l-4 border-blue-500">
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getEstadoIcon(orden.estado)}
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {orden.cliente_nombre}
                </h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-2">
                <div className="flex items-center gap-1">
                  <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {orden.moto_marca || "Sin marca"}{" "}
                    {orden.moto_modelo || ""}
                  </span>
                </div>
                {orden.cliente_telefono && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{orden.cliente_telefono}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className={`badge ${getEstadoColor(
                  orden.estado
                )} text-xs`}
              >
                {orden.estado}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {orden.problema || "Sin descripción"}
            </p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(orden.created_at).toLocaleDateString("es-CL")}
              </div>
              <div className="text-xs text-gray-500">
                {orden.ordenes_repuestos?.length || 0} repuestos
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPrecio(totalOrden)}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => openDetalleOrden(orden)}
              className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
              title="Ver detalle de la orden"
            >
              <ClipboardDocumentListIcon className="w-3 h-3" />
              <span>Detalle</span>
            </button>
            <button
              onClick={() => handleEdit(orden)}
              className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
              title="Editar orden"
            >
              <PencilIcon className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {
                setSelectedOrdenForActions(orden);
                setShowActionsModal(true);
              }}
              className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1"
              title="Más acciones"
            >
              <ArrowPathIcon className="w-3 h-3" />
              <span>Acciones</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const style = `
    .hide-spin-buttons::-webkit-inner-spin-button,
    .hide-spin-buttons::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .hide-spin-buttons {
      -moz-appearance: textfield;
    }
  `;

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando órdenes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style>{style}</style>

      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Órdenes de Trabajo</h1>
            <p className="page-subtitle">
              {filteredOrdenes.length} órdenes encontradas
              <span className="ml-2 text-green-600 dark:text-green-400">
                Total{" "}
                {formatPrecio(
                  filteredOrdenes.reduce(
                    (sum, orden) => sum + calcularTotalOrden(orden),
                    0
                  )
                )}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOrdenes}
              className="btn-secondary flex items-center gap-2"
              title="Actualizar lista"
            >
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm sm:text-base"
              title="Crear nueva orden"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nueva Orden</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, moto, teléfono o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-9 sm:pl-10 text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                title="Limpiar búsqueda"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden btn-secondary p-2"
            title="Mostrar/Ocultar filtros"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>

        <div className={showFilters ? "block lg:block" : "hidden lg:block"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="input-label">Estado</label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="input-field text-sm sm:text-base"
              >
                <option value="todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En reparación">En reparación</option>
                <option value="Finalizada">Finalizada</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterEstado("todos");
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2 text-sm sm:text-base"
                title="Limpiar todos los filtros"
              >
                <FunnelIcon className="w-4 h-4" />
                Limpiar Filtros
              </button>
            </div>
          </div>

          {(searchTerm || filterEstado !== "todos") && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs dark:bg-blue-900/30 dark:text-blue-300">
                  Búsqueda: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                    title="Quitar filtro"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterEstado !== "todos" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs dark:bg-purple-900/30 dark:text-purple-300">
                  Estado: {filterEstado}
                  <button
                    onClick={() => setFilterEstado("todos")}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                    title="Quitar filtro"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vista de órdenes */}
      <div className="card overflow-hidden">
        {/* Vista tarjetas móvil */}
        <div className="lg:hidden">
          {filteredOrdenes.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron órdenes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterEstado !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Crea tu primera orden de trabajo."}
              </p>
              {!searchTerm && filterEstado === "todos" && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4 inline mr-2" />
                  Crear primera orden
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOrdenes.map((orden) => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </div>

        {/* Tabla desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Moto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredOrdenes.map((orden) => {
                const totalOrden = calcularTotalOrden(orden);
                return (
                  <tr
                    key={orden.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                            {orden.cliente_nombre}
                          </div>
                          {orden.cliente_telefono && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {orden.cliente_telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                        {orden.moto_marca || "N/A"} {orden.moto_modelo || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate">
                        {orden.problema || "Sin descripción"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`badge ${getEstadoColor(
                          orden.estado
                        )} text-xs`}
                      >
                        {orden.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatPrecio(totalOrden)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(orden.created_at).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetalleOrden(orden)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                          title="Ver detalle"
                        >
                          <ClipboardDocumentListIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">Detalle</span>
                        </button>
                        <button
                          onClick={() => handleEdit(orden)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                          title="Editar orden"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrdenForActions(orden);
                            setShowActionsModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1"
                          title="Más acciones"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">Acciones</span>
                        </button>
                        <button
                          onClick={() => handleDelete(orden.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                          title="Eliminar orden"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrdenes.length === 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-400 mb-2 sm:mb-0">
                  No hay órdenes para mostrar.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Acciones */}
      {showActionsModal && selectedOrdenForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-2 sm:mx-0">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones para Orden
                </h3>
                <button
                  onClick={() => {
                    setSelectedOrdenForActions(null);
                    setShowActionsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Información de la Orden
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>
                      <strong>Cliente:</strong>{" "}
                      {selectedOrdenForActions.cliente_nombre}
                    </div>
                    <div>
                      <strong>Moto:</strong>{" "}
                      {selectedOrdenForActions.moto_marca}{" "}
                      {selectedOrdenForActions.moto_modelo}
                    </div>
                    <div>
                      <strong>Estado:</strong>{" "}
                      {selectedOrdenForActions.estado}
                    </div>
                    <div>
                      <strong>Total:</strong>{" "}
                      {formatPrecio(
                        calcularTotalOrden(selectedOrdenForActions)
                      )}
                    </div>
                    <div>
                      <strong>Repuestos:</strong>{" "}
                      {selectedOrdenForActions.ordenes_repuestos?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      exportToPDF(selectedOrdenForActions);
                      setSelectedOrdenForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
                    title="Generar PDF de la orden"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Generar PDF
                  </button>
                  <button
                    onClick={() => {
                      shareViaWhatsApp(selectedOrdenForActions);
                      setSelectedOrdenForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Compartir por WhatsApp"
                    disabled={!selectedOrdenForActions.cliente_telefono}
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Compartir por WhatsApp
                  </button>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setSelectedOrdenForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="btn-secondary px-4 py-2 text-sm sm:text-base"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && selectedOrdenDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto pt-4 sm:pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Detalle de la Orden
                </h3>
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    setSelectedOrdenDetalle(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 flex gap-2">
                <button className="px-3 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600 dark:text-blue-400">
                  Resumen
                </button>
                <button
                  className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => {
                    const el = document.getElementById(
                      "orden-detalle-repuestos"
                    );
                    if (el)
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                >
                  Repuestos
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">
                      Información del Cliente
                    </h4>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Nombre: </span>
                      {selectedOrdenDetalle.cliente_nombre ||
                        "No especificado"}
                    </p>
                    <p>
                      <span className="font-medium">Teléfono: </span>
                      {selectedOrdenDetalle.cliente_telefono ||
                        "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Moto y Estado
                    </h4>
                  </div>
                  <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <span className="font-medium">Moto: </span>
                      {selectedOrdenDetalle.moto_marca || "Sin marca"}{" "}
                      {selectedOrdenDetalle.moto_modelo || ""}
                    </p>
                    <p>
                      <span className="font-medium">Estado: </span>
                      <span
                        className={`badge ${getEstadoColor(
                          selectedOrdenDetalle.estado
                        )}`}
                      >
                        {selectedOrdenDetalle.estado}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Fecha: </span>
                      {selectedOrdenDetalle.created_at
                        ? new Date(
                            selectedOrdenDetalle.created_at
                          ).toLocaleDateString("es-CL")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Descripción del servicio
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  {selectedOrdenDetalle.problema || "Sin descripción"}
                </div>
              </div>

              {/* Info de servicio predefinido en detalle, si existe */}
              {selectedOrdenDetalle.tipo_servicio && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  {(() => {
                    const servicio = serviciosPredefinidos.find(
                      (s) => s.id === selectedOrdenDetalle.tipo_servicio
                    );
                    if (!servicio) return null;
                    return (
                      <>
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Servicio predefinido: {servicio.nombre}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                          Tiempo estimado: {servicio.tiempoEstimado}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                          Repuestos comunes:{" "}
                          {servicio.repuestos.join(", ")}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Próxima mantención recomendada:{" "}
                          {servicio.proximo}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Servicio</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrecio(
                      selectedOrdenDetalle.precio_servicio || 0
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <p className="text-gray-500 dark:text-gray-400">
                    Mano de obra
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrecio(
                      selectedOrdenDetalle.precio_mano_obra || 0
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatPrecio(calcularTotalOrden(selectedOrdenDetalle))}
                  </p>
                </div>
              </div>

              <div id="orden-detalle-repuestos" className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Repuestos utilizados
                </h4>
                {selectedOrdenDetalle.ordenes_repuestos &&
                selectedOrdenDetalle.ordenes_repuestos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">
                            Producto
                          </th>
                          <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">
                            Cantidad
                          </th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                            Precio
                          </th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrdenDetalle.ordenes_repuestos.map(
                          (rep, index) => {
                            const precio = rep.inventario?.precio || 0;
                            const subtotal = precio * (rep.cantidad || 0);
                            return (
                              <tr
                                key={index}
                                className="border-b border-gray-100 dark:border-gray-700"
                              >
                                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                                  {rep.inventario?.nombre ||
                                    "Producto no encontrado"}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                                  {rep.cantidad}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                  {formatPrecio(precio)}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                                  {formatPrecio(subtotal)}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Esta orden no tiene repuestos asociados.
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setShowDetalleModal(false);
                    setSelectedOrdenDetalle(null);
                  }}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Orden */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto pt-4 sm:pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingOrden ? "Editar Orden" : "Nueva Orden de Trabajo"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Nombre del cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={form.cliente_nombre}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cliente_nombre: e.target.value,
                        })
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: Juan Pérez"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="input-label">Teléfono</label>
                    <input
                      type="tel"
                      value={form.cliente_telefono}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cliente_telefono: e.target.value,
                        })
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: 912345678"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para compartir la orden por WhatsApp
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Marca de la moto
                    </label>
                    <input
                      type="text"
                      value={form.moto_marca}
                      onChange={(e) =>
                        setForm({ ...form, moto_marca: e.target.value })
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: Honda, Yamaha, Suzuki"
                    />
                  </div>
                  <div>
                    <label className="input-label">
                      Modelo de la moto
                    </label>
                    <input
                      type="text"
                      value={form.moto_modelo}
                      onChange={(e) =>
                        setForm({ ...form, moto_modelo: e.target.value })
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: CBR 600, R6, GSX-R"
                    />
                  </div>
                </div>

                {/* Servicios predefinidos */}
                <div className="border border-blue-100 dark:border-blue-900/40 rounded-lg p-3 sm:p-4 mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        Servicios predefinidos
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona un servicio estándar para autocompletar la
                        orden.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={selectedServicioId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedServicioId(id);
                        const servicio = serviciosPredefinidos.find(
                          (s) => s.id === id
                        );
                        if (servicio) {
                          setForm((prev) => ({
                            ...prev,
                            problema: prev.problema
                              ? prev.problema
                              : `${servicio.nombre}.\n\nTiempo estimado: ${servicio.tiempoEstimado}.`,
                          }));

                          if (selectedRepuestos.length === 0 && productos.length > 0) {
                            const repSugeridos = servicio.repuestos
                              .map((nombreRep) => {
                                const prod = productos.find(
                                  (p) =>
                                    p.nombre.toLowerCase() ===
                                    nombreRep.toLowerCase()
                                );
                                if (!prod) return null;
                                return {
                                  id: prod.id,
                                  nombre: prod.nombre,
                                  cantidad: 1,
                                };
                              })
                              .filter(Boolean);
                            if (repSugeridos.length > 0) {
                              setSelectedRepuestos(repSugeridos);
                            }
                          }
                        }
                      }}
                      className="input-field text-sm sm:text-base"
                    >
                      <option value="">Seleccionar servicio</option>
                      {serviciosPredefinidos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        id="recordarProxima"
                        type="checkbox"
                        checked={recordarProxima}
                        onChange={(e) => setRecordarProxima(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="recordarProxima"
                        className="text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                      >
                        Incluir próxima mantención en el mensaje al cliente
                      </label>
                    </div>
                  </div>

                  {selectedServicioId && (
                    <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {(() => {
                        const servicio = serviciosPredefinidos.find(
                          (s) => s.id === selectedServicioId
                        );
                        if (!servicio) return null;
                        return (
                          <>
                            <p className="text-xs text-gray-500 mb-1">
                              Checklist técnico sugerido:
                            </p>
                            <ul className="list-disc list-inside text-xs text-gray-700 dark:text-gray-300 space-y-1 mb-2">
                              {servicio.checklist.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {servicio.proximo}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="input-label">
                    Servicio requerido
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.problema}
                    onChange={(e) =>
                      setForm({ ...form, problema: e.target.value })
                    }
                    className="input-field resize-none text-sm sm:text-base"
                    placeholder="Describa el problema o servicio requerido..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Precio del servicio
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.precio_servicio}
                        onChange={(e) =>
                          handlePrecioChange(
                            "precio_servicio",
                            e.target.value
                          )
                        }
                        className="input-field pl-10 text-sm sm:text-base hide-spin-buttons"
                        placeholder="20.000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Mano de obra</label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.precio_mano_obra}
                        onChange={(e) =>
                          handlePrecioChange(
                            "precio_mano_obra",
                            e.target.value
                          )
                        }
                        className="input-field pl-10 text-sm sm:text-base hide-spin-buttons"
                        placeholder="15.000"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                      Total estimado
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-300">
                      {formatPrecio(
                        parsePrecioInput(form.precio_servicio) +
                          parsePrecioInput(form.precio_mano_obra) +
                          selectedRepuestos.reduce((sum, rep) => {
                            const producto = productos.find(
                              (p) => p.id === rep.id
                            );
                            return (
                              sum +
                              (producto?.precio || 0) * (rep.cantidad || 0)
                            );
                          }, 0)
                      )}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-2">
                    Incluye Servicio{" "}
                    {formatPrecio(parsePrecioInput(form.precio_servicio))}
                    , Mano de obra{" "}
                    {formatPrecio(parsePrecioInput(form.precio_mano_obra))} y
                    Repuestos{" "}
                    {formatPrecio(
                      selectedRepuestos.reduce((sum, rep) => {
                        const producto = productos.find(
                          (p) => p.id === rep.id
                        );
                        return (
                          sum +
                          (producto?.precio || 0) * (rep.cantidad || 0)
                        );
                      }, 0)
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Estado de la orden
                    </label>
                    <select
                      value={form.estado}
                      onChange={(e) =>
                        setForm({ ...form, estado: e.target.value })
                      }
                      className="input-field text-sm sm:text-base"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En reparación">En reparación</option>
                      <option value="Finalizada">Finalizada</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="input-label">Fecha</label>
                      <div className="input-field bg-gray-50 dark:bg-gray-700 cursor-not-allowed text-sm sm:text-base">
                        {new Date().toLocaleDateString("es-CL")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Repuestos */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Repuestos utilizados
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona los repuestos que se usarán
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addRepuesto}
                      className="text-sm btn-primary px-3 py-1.5 flex items-center gap-1"
                      title="Agregar repuesto"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar
                    </button>
                  </div>

                  {selectedRepuestos.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <WrenchScrewdriverIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No hay repuestos agregados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedRepuestos.map((repuesto, index) => {
                        const producto = productos.find(
                          (p) => p.id === repuesto.id
                        );
                        const precioUnitario = producto?.precio || 0;
                        const subtotal =
                          precioUnitario * (repuesto.cantidad || 0);

                        return (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <select
                                value={repuesto.id}
                                onChange={(e) =>
                                  updateRepuesto(
                                    index,
                                    "id",
                                    e.target.value
                                  )
                                }
                                className="w-full input-field text-sm"
                                required
                              >
                                <option value="">
                                  Seleccionar repuesto
                                </option>
                                {productos.map((producto) => (
                                  <option
                                    key={producto.id}
                                    value={producto.id}
                                    disabled={producto.stock <= 0}
                                  >
                                    {producto.nombre} - Stock{" "}
                                    {producto.stock} -{" "}
                                    {formatPrecio(producto.precio)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={producto?.stock || 1}
                                  value={repuesto.cantidad}
                                  onChange={(e) =>
                                    updateRepuesto(
                                      index,
                                      "cantidad",
                                      parseInt(e.target.value || "1", 10)
                                    )
                                  }
                                  className="w-16 input-field py-1 text-center text-sm"
                                />
                              </div>
                              <div className="text-xs text-gray-500 w-16 text-right">
                                {formatPrecio(subtotal)}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeRepuesto(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Quitar repuesto"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 order-2 sm:order-1">
                    {editingOrden
                      ? "Editando orden existente. Los campos marcados con * son obligatorios."
                      : "Los campos marcados con * son obligatorios."}
                  </div>
                  <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 sm:flex-none btn-secondary px-4 py-2 text-sm sm:text-base"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none btn-primary px-4 py-2 text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      {editingOrden ? (
                        <>
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Actualizar Orden
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          Crear Orden
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ordenes;

