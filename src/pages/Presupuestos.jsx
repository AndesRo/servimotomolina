import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const Presupuestos = () => {
  const [presupuestos, setPresupuestos] = useState([]);
  const [filteredPresupuestos, setFilteredPresupuestos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState(null);

  const [selectedRepuestos, setSelectedRepuestos] = useState([]);
  const [selectedPresupuestoForActions, setSelectedPresupuestoForActions] =
    useState(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState({
    clientenombre: "",
    clientetelefono: "",
    motomarca: "",
    motomodelo: "",
    diagnostico: "",
    estado: "borrador",
    manoobraestimada: "",
    notascliente: "",
  });

  useEffect(() => {
    fetchPresupuestos();
    fetchProductos();
  }, []);

  useEffect(() => {
    filterPresupuestos();
  }, [presupuestos, searchTerm, filterEstado]);

  const fetchPresupuestos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("presupuestos")
        .select(
          `
          *,
          presupuesto_repuestos (
            id,
            cantidad,
            precio_unitario_estimado,
            subtotal_estimado,
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
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setPresupuestos(data || []);
      setFilteredPresupuestos(data || []);
    } catch (error) {
      console.error("Error fetching presupuestos:", error);
      alert("❌ Error al cargar los presupuestos");
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

  const filterPresupuestos = () => {
    let filtered = [...presupuestos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => {
        const cliente = p.cliente_nombre?.toLowerCase() || "";
        const moto = `${p.moto_marca || ""} ${p.moto_modelo || ""}`
          .toLowerCase()
          .trim();
        const tel = p.cliente_telefono || "";
        const id = p.id?.toLowerCase() || "";
        return (
          cliente.includes(term) ||
          moto.includes(term) ||
          tel.includes(term) ||
          id.includes(term)
        );
      });
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((p) => p.estado === filterEstado);
    }

    setFilteredPresupuestos(filtered);
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

  const calcularTotalesLocales = () => {
    const manoObra = parsePrecioInput(form.manoobraestimada);
    const totalRepuestos =
      selectedRepuestos.reduce((sum, rep) => {
        const producto = productos.find((p) => p.id === rep.id);
        const precio = rep.precio_unitario_estimado
          ? parsePrecioInput(rep.precio_unitario_estimado)
          : producto?.precio || 0;
        return sum + precio * (rep.cantidad || 0);
      }, 0) || 0;

    const total = manoObra + totalRepuestos;
    return { totalRepuestos, total };
  };

  const calcularTotalesDesdeDB = (p) => {
    const manoObra = p.mano_obra_estimado || 0;
    const totalRepuestos = p.total_repuestos_estimado || 0;
    const totalServicios = p.total_servicios_estimado || 0;
    const total =
      p.total_estimado || manoObra + totalRepuestos + totalServicios;
    return { manoObra, totalRepuestos, totalServicios, total };
  };

  const { totalRepuestos, total } = calcularTotalesLocales();

  const addRepuesto = () => {
    setSelectedRepuestos([
      ...selectedRepuestos,
      {
        id: "",
        nombre: "",
        cantidad: 1,
        precio_unitario_estimado: "",
      },
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
        nombre: producto?.nombre,
        precio_unitario_estimado: producto?.precio
          ? formatPrecioParaInput(producto.precio)
          : "",
      };
    } else {
      nuevos[index] = {
        ...nuevos[index],
        [field]: value,
      };
    }
    setSelectedRepuestos(nuevos);
  };

  const resetForm = () => {
    setForm({
      clientenombre: "",
      clientetelefono: "",
      motomarca: "",
      motomodelo: "",
      diagnostico: "",
      estado: "borrador",
      manoobraestimada: "",
      notascliente: "",
    });
    setSelectedRepuestos([]);
    setEditingPresupuesto(null);
    setShowModal(false);
  };

  const handlePrecioChange = (field, value) => {
    const cleanValue = value.replace(/[^0-9.,]/g, "");
    setForm((prev) => ({ ...prev, [field]: cleanValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.clientenombre.trim()) {
        alert("El nombre del cliente es requerido");
        return;
      }
      if (!form.diagnostico.trim()) {
        alert("La descripción del diagnóstico es requerida");
        return;
      }

      const manoObra = parsePrecioInput(form.manoobraestimada) || 0;
      const totalRepuestosCalc =
        selectedRepuestos.reduce((sum, rep) => {
          const precio = parsePrecioInput(
            rep.precio_unitario_estimado
          );
          return sum + precio * (rep.cantidad || 0);
        }, 0) || 0;
      const totalServiciosCalc = 0; // por ahora no usas tabla de servicios
      const totalCalc = manoObra + totalRepuestosCalc + totalServiciosCalc;

      const presupuestoData = {
        cliente_nombre: form.clientenombre.trim(),
        cliente_telefono: form.clientetelefono.trim() || null,
        moto_marca: form.motomarca.trim() || null,
        moto_modelo: form.motomodelo.trim() || null,
        diagnostico_inicial: form.diagnostico.trim(),
        estado: form.estado,
        mano_obra_estimado: manoObra,
        total_repuestos_estimado: totalRepuestosCalc,
        total_servicios_estimado: totalServiciosCalc,
        total_estimado: totalCalc,
        notas_cliente: form.notascliente.trim() || null,
        observaciones_internas: null,
        fecha_creacion: editingPresupuesto
          ? editingPresupuesto.fecha_creacion
          : new Date().toISOString(),I
      
      };

      let presupuestoId;

      if (editingPresupuesto) {
        const { error } = await supabase
          .from("presupuestos")
          .update(presupuestoData)
          .eq("id", editingPresupuesto.id);
        if (error) throw error;
        presupuestoId = editingPresupuesto.id;
        alert("Presupuesto actualizado correctamente");
      } else {
        const { data, error } = await supabase
          .from("presupuestos")
          .insert(presupuestoData)
          .select("id")
          .single();
        if (error) throw error;
        presupuestoId = data.id;
        alert("Presupuesto creado correctamente");
      }

      await handleRepuestos(presupuestoId, !!editingPresupuesto);

      setShowModal(false);
      setEditingPresupuesto(null);
      resetForm();
      fetchPresupuestos();
    } catch (error) {
      console.error("Error saving presupuesto:", error);
      alert(`❌ Error al guardar el presupuesto: ${error.message}`);
    }
  };

  const handleRepuestos = async (presupuestoId, isEditing) => {
    try {
      if (isEditing) {
        await supabase
          .from("presupuesto_repuestos")
          .delete()
          .eq("presupuesto_id", presupuestoId);
      }

      for (const rep of selectedRepuestos) {
        if (!rep.id || !rep.cantidad || rep.cantidad <= 0) continue;

        const precioUnitario =
          parsePrecioInput(rep.precio_unitario_estimado) || 0;
        const subtotal = precioUnitario * (rep.cantidad || 0);

        await supabase.from("presupuesto_repuestos").insert({
          presupuesto_id: presupuestoId,
          producto_id: rep.id,
          cantidad: rep.cantidad,
          precio_unitario_estimado: precioUnitario,
          subtotal_estimado: subtotal,
        });
      }
    } catch (error) {
      console.error("Error guardando repuestos del presupuesto:", error);
      throw error;
    }
  };

  const handleEdit = (p) => {
    setEditingPresupuesto(p);
    setForm({
      clientenombre: p.cliente_nombre || "",
      clientetelefono: p.cliente_telefono || "",
      motomarca: p.moto_marca || "",
      motomodelo: p.moto_modelo || "",
      diagnostico: p.diagnostico_inicial || "",
      estado: p.estado || "borrador",
      manoobraestimada: formatPrecioParaInput(
        p.mano_obra_estimado || 0
      ),
      notascliente: p.notas_cliente || "",
    });

    if (p.presupuesto_repuestos) {
      const repuestos = p.presupuesto_repuestos.map((r) => ({
        id: r.inventario?.id,
        nombre: r.inventario?.nombre,
        cantidad: r.cantidad || 1,
        precio_unitario_estimado: formatPrecioParaInput(
          r.precio_unitario_estimado || r.inventario?.precio || 0
        ),
      }));
      setSelectedRepuestos(repuestos);
    } else {
      setSelectedRepuestos([]);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "¿Seguro que deseas eliminar este presupuesto? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await supabase
        .from("presupuesto_repuestos")
        .delete()
        .eq("presupuesto_id", id);
      const { error } = await supabase
        .from("presupuestos")
        .delete()
        .eq("id", id);
      if (error) throw error;

      fetchPresupuestos();
      alert("Presupuesto eliminado correctamente.");
    } catch (error) {
      console.error("Error deleting presupuesto:", error);
      alert("❌ Error al eliminar el presupuesto");
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "aprobado":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300";
      case "enviado":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300";
      case "rechazado":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300";
      case "vencido":
        return "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
      default:
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300";
    }
  };

  const exportPresupuestoToPDF = async (p) => {
    try {
      if (!p) {
        alert("❌ No hay presupuesto seleccionado");
        return;
      }

      const { manoObra, totalRepuestos, totalServicios, total } =
        calcularTotalesDesdeDB(p);

      const element = document.createElement("div");
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.width = "800px";
      element.style.padding = "20px";
      element.style.backgroundColor = "white";
      element.style.color = "black";
      element.style.fontFamily = "Arial, sans-serif";

      const fecha = new Date(
        p.fecha_creacion || p.created_at
      ).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      element.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;border-bottom:3px solid #7c3aed;padding-bottom:20px;">
            <div>
              <h1 style="color:#4c1d95;margin:0;font-size:28px;font-weight:bold;">SERVI MOTO</h1>
              <p style="color:#6b7280;margin:5px 0;font-size:14px;">Taller Mecánico Especializado</p>
              <p style="color:#6b7280;margin:0;font-size:12px;">Presupuesto de Reparación</p>
            </div>
            <div style="text-align:right;">
              <div style="font-size:20px;font-weight:bold;color:#4c1d95;">PRESUPUESTO ${p.id
                .substring(0, 8)
                .toUpperCase()}</div>
              <div style="font-size:14px;color:#6b7280;">${fecha}</div>
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <h2 style="color:#4c1d95;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Información del Cliente</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px;font-size:13px;">
              <div><strong>Nombre:</strong> ${
                p.cliente_nombre || "No especificado"
              }</div>
              <div><strong>Teléfono:</strong> ${
                p.cliente_telefono || "No registrado"
              }</div>
              <div><strong>Marca:</strong> ${
                p.moto_marca || "No especificada"
              }</div>
              <div><strong>Modelo:</strong> ${
                p.moto_modelo || "No especificado"
              }</div>
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <h2 style="color:#4c1d95;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Diagnóstico y Trabajo Estimado</h2>
            <div style="margin-top:10px;font-size:13px;">
              <strong>Diagnóstico inicial:</strong>
              <div style="background:#f9fafb;padding:12px;border-radius:8px;margin-top:8px;border-left:4px solid #7c3aed;">
                ${p.diagnostico_inicial || "Sin diagnóstico"}
              </div>
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <h2 style="color:#4c1d95;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Resumen del Presupuesto</h2>
            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;font-size:13px;">
              <tbody>
                <tr>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Mano de obra estimada</td>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                    manoObra
                  )}</td>
                </tr>
                <tr>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Repuestos estimados</td>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                    totalRepuestos
                  )}</td>
                </tr>
                <tr>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;">Servicios adicionales</td>
                  <td style="padding:10px 15px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${formatPrecio(
                    totalServicios
                  )}</td>
                </tr>
                <tr style="background:#4c1d95;color:white;">
                  <td style="padding:12px 15px;font-weight:bold;">TOTAL ESTIMADO</td>
                  <td style="padding:12px 15px;text-align:right;font-weight:bold;font-size:16px;">${formatPrecio(
                    total
                  )}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${
            p.presupuesto_repuestos &&
            p.presupuesto_repuestos.length > 0
              ? `
          <div style="margin-bottom:30px;">
            <h2 style="color:#4c1d95;border-bottom:2px solid #e5e7eb;padding-bottom:10px;font-size:18px;">Detalle de Repuestos Estimados</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:12px;">
              <thead>
                <tr style="background:#4c1d95;color:white;">
                  <th style="padding:8px;text-align:left;border:1px solid #d1d5db;">Producto</th>
                  <th style="padding:8px;text-align:center;border:1px solid #d1d5db;">Cantidad</th>
                  <th style="padding:8px;text-align:right;border:1px solid #d1d5db;">Precio Unitario</th>
                  <th style="padding:8px;text-align:right;border:1px solid #d1d5db;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${p.presupuesto_repuestos
                  .map((rep, index) => {
                    const precio = rep.precio_unitario_estimado || 0;
                    const subtotal = rep.subtotal_estimado || 0;
                    return `
                    <tr style="${
                      index % 2 === 0 ? "background:#f9fafb;" : ""
                    }">
                      <td style="padding:8px;border:1px solid #e5e7eb;">${
                        rep.inventario?.nombre ||
                        rep.descripcion ||
                        "Producto no encontrado"
                      }</td>
                      <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${
                        rep.cantidad
                      }</td>
                      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatPrecio(
                        precio
                      )}</td>
                      <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${formatPrecio(
                        subtotal
                      )}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          <div style="margin-top:40px;padding-top:20px;border-top:2px dashed #d1d5db;">
            <h3 style="color:#4c1d95;font-size:16px;margin-bottom:10px;">Notas importantes</h3>
            <ul style="color:#6b7280;font-size:12px;line-height:1.6;padding-left:20px;">
              <li>Este presupuesto es válido por 30 días desde la fecha de emisión.</li>
              <li>Los valores son estimados y pueden variar según la inspección final.</li>
              <li>Cualquier trabajo adicional será informado y deberá ser autorizado por el cliente.</li>
            </ul>
            ${
              p.notas_cliente
                ? `<p style="margin-top:10px;font-size:12px;"><strong>Notas para el cliente:</strong> ${
                    p.notas_cliente
                  }</p>`
                : ""
            }
          </div>

          <div style="margin-top:30px;padding-top:15px;border-top:2px solid #4c1d95;text-align:center;font-size:11px;color:#6b7280;">
            <p>Servi Moto • Taller Mecánico</p>
            <p>Presupuesto generado el ${new Date().toLocaleDateString(
              "es-ES"
            )} • ID: ${p.id.substring(0, 8).toUpperCase()}</p>
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
        p.cliente_nombre
          ?.replace(/[^a-zA-Z0-9]/g, "")
          ?.substring(0, 20) || "cliente";
      const fileName = `presupuesto_${nombreCliente}_${fechaStr}.pdf`;

      pdf.save(fileName);
      alert(`PDF ${fileName} generado exitosamente`);
    } catch (error) {
      console.error("Error generando PDF de presupuesto:", error);
      alert("❌ Error al generar el PDF. Intenta de nuevo.");
    }
  };

  const printPresupuesto = (p) => {
    if (!p) return;
    exportPresupuestoToPDF(p).then(() => {
      // El usuario puede abrir y luego imprimir el PDF
      alert(
        "PDF generado. Ábrelo desde descargas para imprimir el presupuesto."
      );
    });
  };

  const sharePresupuestoViaWhatsApp = (p) => {
    if (!p?.cliente_telefono) {
      alert("El cliente no tiene número de teléfono registrado");
      return;
    }

    let phone = p.cliente_telefono.replace(/\D/g, "");
    if (phone.startsWith("56")) phone = phone.substring(2);
    if (phone.startsWith("0")) phone = phone.substring(1);
    if (phone.length !== 9) {
      alert(
        "Número de teléfono inválido. Debe tener 9 dígitos (ej: 912345678)."
      );
      return;
    }

    const phoneNumber = `56${phone}`;
    const fecha = new Date(
      p.fecha_creacion || p.created_at
    ).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const { manoObra, totalRepuestos, totalServicios, total } =
      calcularTotalesDesdeDB(p);

    const repuestosText =
      p.presupuesto_repuestos && p.presupuesto_repuestos.length > 0
        ? `Repuestos estimados:\n${p.presupuesto_repuestos
            .map((rep) => {
              const nombre =
                rep.inventario?.nombre ||
                rep.descripcion ||
                "Producto";
              const precio = rep.precio_unitario_estimado || 0;
              return `${rep.cantidad}x ${nombre} - ${formatPrecio(
                precio
              )} c/u`;
            })
            .join("\n")}`
        : "Sin repuestos estimados.";

    const message = `Hola ${p.cliente_nombre}!

Te enviamos el detalle de tu PRESUPUESTO - SERVI MOTO:

Presupuesto: ${p.id.substring(0, 8).toUpperCase()}
Fecha: ${fecha}

Moto: ${p.moto_marca || "No especificada"} ${
      p.moto_modelo || ""
    }

Diagnóstico inicial:
${p.diagnostico_inicial || "Sin diagnóstico"}

RESUMEN DE VALORES:
- Mano de obra: ${formatPrecio(manoObra)}
- Repuestos: ${formatPrecio(totalRepuestos)}
- Servicios adicionales: ${formatPrecio(totalServicios)}
- TOTAL ESTIMADO: ${formatPrecio(total)}

${repuestosText}

Este presupuesto es referencial y puede variar si aparecen trabajos adicionales.

Taller Servi Moto
Horario: Lunes a Viernes 08:00 - 18:00

Mensaje generado automáticamente por el sistema Servi Moto.`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const PresupuestoCard = ({ p }) => {
    const { total } = calcularTotalesDesdeDB(p);
    return (
      <div className="card mb-3 border-l-4 border-purple-500">
        <div className="flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {p.cliente_nombre}
                </h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-2">
                <div className="flex items-center gap-1">
                  <WrenchScrewdriverIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {p.moto_marca || "Sin marca"} {p.moto_modelo || ""}
                  </span>
                </div>
                {p.cliente_telefono && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{p.cliente_telefono}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span
                className={`badge ${getEstadoColor(
                  p.estado
                )} text-xs capitalize`}
              >
                {p.estado}
              </span>
              <div className="mt-2 text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPrecio(total)}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {p.diagnostico_inicial || "Sin diagnóstico"}
            </p>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(
                  p.fecha_creacion || p.created_at
                ).toLocaleDateString("es-CL")}
              </div>
              <div className="text-xs text-gray-500">
                {p.presupuesto_repuestos?.length || 0} repuestos
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total estimado
              </div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPrecio(total)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => handleEdit(p)}
              className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1"
              title="Editar presupuesto"
            >
              <PencilIcon className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {
                setSelectedPresupuestoForActions(p);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando presupuestos...
          </p>
        </div>
      </div>
    );
  }

  const totalListado = filteredPresupuestos.reduce((sum, p) => {
    const { total } = calcularTotalesDesdeDB(p);
    return sum + total;
  }, 0);

  return (
    <div className="page-container">
      <style>{style}</style>

      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="page-subtitle">
              {filteredPresupuestos.length} presupuestos encontrados
              <span className="ml-2 text-green-600 dark:text-green-400">
                Total estimado {formatPrecio(totalListado)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPresupuestos}
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
              title="Crear nuevo presupuesto"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Presupuesto</span>
              <span className="sm:hidden">Nuevo</span>
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
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-9 sm:pl-10 text-sm sm:text-base"
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
                <option value="borrador">Borrador</option>
                <option value="enviado">Enviado</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="vencido">Vencido</option>
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
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs dark:bg-purple-900/30 dark:text-purple-300">
                  Búsqueda: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                    title="Quitar filtro"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterEstado !== "todos" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                  Estado: {filterEstado}
                  <button
                    onClick={() => setFilterEstado("todos")}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
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

      {/* Lista */}
      <div className="card overflow-hidden">
        {/* Mobile cards */}
        <div className="lg:hidden">
          {filteredPresupuestos.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No se encontraron presupuestos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterEstado !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Crea tu primer presupuesto para comenzar."}
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
                  Crear primer presupuesto
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredPresupuestos.map((p) => (
                <PresupuestoCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop table */}
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
                  Diagnóstico
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total estimado
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
              {filteredPresupuestos.map((p) => {
                const { total } = calcularTotalesDesdeDB(p);
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                            {p.cliente_nombre}
                          </div>
                          {p.cliente_telefono && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {p.cliente_telefono}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                        {p.moto_marca || "N/A"} {p.moto_modelo || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white max-w-[200px] truncate">
                        {p.diagnostico_inicial || "Sin diagnóstico"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`badge ${getEstadoColor(
                          p.estado
                        )} text-xs capitalize`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatPrecio(total)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(
                        p.fecha_creacion || p.created_at
                      ).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                          title="Editar presupuesto"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">
                            Editar
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPresupuestoForActions(p);
                            setShowActionsModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                          title="Más acciones"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">
                            Acciones
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                          title="Eliminar presupuesto"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span className="hidden xl:inline">
                            Eliminar
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPresupuestos.length === 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                No hay presupuestos para mostrar.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal acciones */}
      {showActionsModal && selectedPresupuestoForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-2 sm:mx-0">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones para Presupuesto
                </h3>
                <button
                  onClick={() => {
                    setSelectedPresupuestoForActions(null);
                    setShowActionsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
                    Información del Presupuesto
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>
                      <strong>Cliente:</strong>{" "}
                      {selectedPresupuestoForActions.cliente_nombre}
                    </div>
                    <div>
                      <strong>Moto:</strong>{" "}
                      {selectedPresupuestoForActions.moto_marca ||
                        "Sin marca"}{" "}
                      {selectedPresupuestoForActions.moto_modelo || ""}
                    </div>
                    <div>
                      <strong>Estado:</strong>{" "}
                      {selectedPresupuestoForActions.estado}
                    </div>
                    <div>
                      <strong>Total:</strong>{" "}
                      {formatPrecio(
                        calcularTotalesDesdeDB(
                          selectedPresupuestoForActions
                        ).total
                      )}
                    </div>
                    <div>
                      <strong>Repuestos:</strong>{" "}
                      {selectedPresupuestoForActions
                        .presupuesto_repuestos?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => {
                      exportPresupuestoToPDF(
                        selectedPresupuestoForActions
                      );
                      setSelectedPresupuestoForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm sm:text-base"
                    title="Exportar presupuesto a PDF"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Exportar a PDF
                  </button>

                  <button
                    onClick={() => {
                      printPresupuesto(selectedPresupuestoForActions);
                      setSelectedPresupuestoForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-all duration-200 active:scale-95"
                    title="Imprimir presupuesto"
                  >
                    <PrinterIcon className="w-5 h-5" />
                    Imprimir
                  </button>

                  <button
                    onClick={() => {
                      sharePresupuestoViaWhatsApp(
                        selectedPresupuestoForActions
                      );
                      setSelectedPresupuestoForActions(null);
                      setShowActionsModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Compartir por WhatsApp"
                    disabled={
                      !selectedPresupuestoForActions.cliente_telefono
                    }
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    Compartir por WhatsApp
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setSelectedPresupuestoForActions(null);
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
      )}

      {/* Modal crear/editar presupuesto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto pt-4 sm:pt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingPresupuesto
                    ? "Editar Presupuesto"
                    : "Nuevo Presupuesto"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Nombre del cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={form.clientenombre}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientenombre: e.target.value,
                        }))
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
                      value={form.clientetelefono}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientetelefono: e.target.value,
                        }))
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: 912345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Marca de la moto
                    </label>
                    <input
                      type="text"
                      value={form.motomarca}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          motomarca: e.target.value,
                        }))
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
                      value={form.motomodelo}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          motomodelo: e.target.value,
                        }))
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Ej: CBR 600, R6, GSX-R"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">
                    Diagnóstico / Descripción
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.diagnostico}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        diagnostico: e.target.value,
                      }))
                    }
                    className="input-field resize-none text-sm sm:text-base"
                    placeholder="Describe el diagnóstico o trabajo estimado..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">
                      Mano de obra estimada
                    </label>
                    <div className="relative">
                      <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={form.manoobraestimada}
                        onChange={(e) =>
                          handlePrecioChange(
                            "manoobraestimada",
                            e.target.value
                          )
                        }
                        className="input-field pl-10 text-sm sm:text-base hide-spin-buttons"
                        placeholder="30.000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Notas para el cliente</label>
                    <input
                      type="text"
                      value={form.notascliente}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          notascliente: e.target.value,
                        }))
                      }
                      className="input-field text-sm sm:text-base"
                      placeholder="Comentarios adicionales visibles al cliente"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-800 dark:text-purple-300 text-sm sm:text-base">
                      Total estimado
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-purple-800 dark:text-purple-300">
                      {formatPrecio(total)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 mt-2">
                    Mano de obra{" "}
                    {formatPrecio(
                      parsePrecioInput(form.manoobraestimada)
                    )}
                    , Repuestos {formatPrecio(totalRepuestos)}.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="input-label">Estado</label>
                    <select
                      value={form.estado}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          estado: e.target.value,
                        }))
                      }
                      className="input-field text-sm sm:text-base"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="enviado">Enviado</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="rechazado">Rechazado</option>
                      <option value="vencido">Vencido</option>
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

                {/* Repuestos estimados */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Repuestos estimados
                      </h4>
                      <p className="text-xs text-gray-500">
                        Selecciona los repuestos considerados en el
                        presupuesto.
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
                      {selectedRepuestos.map((rep, index) => {
                        const precioUnitario = parsePrecioInput(
                          rep.precio_unitario_estimado
                        );
                        const subtotal =
                          precioUnitario * (rep.cantidad || 0);
                        return (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <select
                                value={rep.id}
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
                                {productos.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nombre} -{" "}
                                    {formatPrecio(p.precio)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                value={rep.cantidad}
                                onChange={(e) =>
                                  updateRepuesto(
                                    index,
                                    "cantidad",
                                    parseInt(
                                      e.target.value || "1",
                                      10
                                    )
                                  )
                                }
                                className="w-16 input-field py-1 text-center text-sm"
                              />
                              <div className="relative">
                                <CurrencyDollarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={rep.precio_unitario_estimado}
                                  onChange={(e) =>
                                    updateRepuesto(
                                      index,
                                      "precio_unitario_estimado",
                                      e.target.value
                                    )
                                  }
                                  className="w-24 input-field py-1 pl-7 text-sm"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 w-24 text-right">
                                {formatPrecio(subtotal || 0)}
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
                    {editingPresupuesto
                      ? "Editando presupuesto existente."
                      : "Crea un nuevo presupuesto para tu cliente."}
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
                      {editingPresupuesto ? (
                        <>
                          <DocumentArrowDownIcon className="w-4 h-4" />
                          Actualizar Presupuesto
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          Crear Presupuesto
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

export default Presupuestos;


