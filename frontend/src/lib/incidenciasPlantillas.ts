import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Landmark,
  Scale,
  Settings,
  Shield,
  Store,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";

/** Normaliza el código de departamento (BBDD / formularios). */
export function normalizeDept(departamento: string | null | undefined): string {
  return (departamento ?? "").trim().toUpperCase();
}

export type PlantillaCampo = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: string[];
};

/**
 * Plantillas visibles para cualquier usuario.
 * `equipoGestion` = equipo interno que suele resolver / enrutar la solicitud (p. ej. IT).
 * En el futuro puede mapearse a `asignado_a` o a reglas automáticas.
 */
export type PlantillaDef = {
  id: string;
  icon: LucideIcon;
  equipoGestion: string;
  titulo: string;
  subtitulo: string;
  campos: PlantillaCampo[];
};

const I = {
  Briefcase,
  Settings,
  Zap,
  Shield,
  Landmark,
  Store,
  Scale,
  FileText,
  Wrench,
  Building2,
  Wallet,
  ClipboardList,
} as const;

export const PLANTILLAS_INCIDENCIAS: PlantillaDef[] = [
  {
    id: "it_material",
    icon: I.Settings,
    equipoGestion: "IT",
    titulo: "Material informático",
    subtitulo:
      "Consumibles, periféricos o equipo. Cualquier compañía puede abrirla; la gestiona el equipo IT.",
    campos: [
      {
        id: "tipo_material",
        label: "Qué necesitas",
        type: "select",
        options: [
          "Portátil / PC",
          "Monitor / dock",
          "Teclado / ratón / auriculares",
          "Cable / adaptador",
          "Licencia / software",
          "Otro",
        ],
      },
      {
        id: "cantidad_detalle",
        label: "Cantidad y detalle",
        type: "textarea",
        placeholder: "Unidades, referencia aprobada, motivo del pedido…",
      },
      {
        id: "fecha_ideal",
        label: "Fecha ideal de entrega (opcional)",
        type: "date",
      },
    ],
  },
  {
    id: "it_equipo",
    icon: I.Wrench,
    equipoGestion: "IT",
    titulo: "Equipamiento o reinstalación",
    subtitulo: "Cambio de equipo, imagen, acceso a aplicaciones. Gestiona IT.",
    campos: [
      {
        id: "tipo",
        label: "Tipo de petición",
        type: "select",
        options: ["Nuevo equipo", "Sustitución", "Reinstalación", "Ampliación", "Otro"],
      },
      {
        id: "especificaciones",
        label: "Especificaciones",
        type: "textarea",
        placeholder: "RAM, SO, motivo del cambio…",
      },
      {
        id: "urgencia",
        label: "Urgencia para ti",
        type: "select",
        options: ["Baja", "Media", "Alta", "Crítica"],
      },
    ],
  },
  {
    id: "it_incidencia",
    icon: I.Settings,
    equipoGestion: "IT",
    titulo: "Incidencia técnica",
    subtitulo: "Red, correo, VPN o aplicaciones. Gestiona IT.",
    campos: [
      {
        id: "sintoma",
        label: "Síntoma",
        type: "textarea",
        placeholder: "Qué ocurre y desde cuándo",
      },
      {
        id: "dispositivo",
        label: "Equipo / ubicación",
        type: "text",
        placeholder: "Ej. PC-042, teletrabajo",
      },
    ],
  },
  {
    id: "rrhh_alta",
    icon: I.Briefcase,
    equipoGestion: "RRHH",
    titulo: "Alta de nuevo empleado",
    subtitulo: "Onboarding y contrato. Gestiona RRHH.",
    campos: [
      {
        id: "nombre_emp",
        label: "Nombre completo",
        type: "text",
        placeholder: "Ej. Ana López García",
      },
      {
        id: "dni_emp",
        label: "DNI / NIE / Pasaporte",
        type: "text",
        placeholder: "12345678X",
      },
      {
        id: "puesto",
        label: "Cargo / puesto",
        type: "text",
        placeholder: "Ej. Analista de datos",
      },
      {
        id: "fecha_inicio",
        label: "Fecha de incorporación",
        type: "date",
      },
    ],
  },
  {
    id: "rrhh_ausencia",
    icon: I.ClipboardList,
    equipoGestion: "RRHH",
    titulo: "Ausencia o permiso",
    subtitulo: "Vacaciones o permisos. Gestiona RRHH.",
    campos: [
      {
        id: "tipo_permiso",
        label: "Tipo",
        type: "select",
        options: ["Vacaciones", "Permiso personal", "Enfermedad", "Otro"],
      },
      {
        id: "fechas",
        label: "Fechas afectadas",
        type: "text",
        placeholder: "Ej. del 12/05 al 16/05",
      },
      {
        id: "detalle",
        label: "Detalle",
        type: "textarea",
        placeholder: "Observaciones",
      },
    ],
  },
  {
    id: "admin_accesos",
    icon: I.Shield,
    equipoGestion: "ADMIN / Sistemas",
    titulo: "Accesos o permisos avanzados",
    subtitulo: "Roles especiales, carpetas corporativas sensibles.",
    campos: [
      {
        id: "sistema",
        label: "Sistema o aplicación",
        type: "text",
        placeholder: "Ej. ERP, VPN, carpeta Q:",
      },
      {
        id: "tipo_acceso",
        label: "Tipo de permiso",
        type: "select",
        options: ["Lectura", "Escritura", "Administrador", "Solo consulta"],
      },
      {
        id: "justificacion",
        label: "Justificación",
        type: "textarea",
        placeholder: "Motivo del negocio, referencia…",
      },
    ],
  },
  {
    id: "admin_informe",
    icon: I.FileText,
    equipoGestion: "ADMIN",
    titulo: "Informe o datos del directorio",
    subtitulo: "Listados o exportaciones de personal.",
    campos: [
      {
        id: "alcance",
        label: "Alcance del informe",
        type: "textarea",
        placeholder: "Datos, periodo, filtros…",
      },
      {
        id: "fecha_limite",
        label: "Fecha límite deseada",
        type: "date",
      },
    ],
  },
  {
    id: "manto_averia",
    icon: I.Zap,
    equipoGestion: "MANTENIMIENTO",
    titulo: "Avería en instalaciones",
    subtitulo: "Electricidad, climatización, mobiliario.",
    campos: [
      {
        id: "ubicacion",
        label: "Ubicación (sala / planta)",
        type: "text",
        placeholder: "Ej. Sala de juntas 2, planta 3",
      },
      {
        id: "descripcion",
        label: "Descripción",
        type: "textarea",
        placeholder: "Detalle del problema",
      },
    ],
  },
  {
    id: "fin_factura",
    icon: I.Landmark,
    equipoGestion: "FINANZAS",
    titulo: "Factura o pago",
    subtitulo: "Proveedores y cobros.",
    campos: [
      {
        id: "proveedor",
        label: "Proveedor / concepto",
        type: "text",
        placeholder: "Nombre o número de factura",
      },
      {
        id: "importe",
        label: "Importe aproximado (opcional)",
        type: "text",
        placeholder: "Ej. 1.234,56 €",
      },
      {
        id: "detalle",
        label: "Detalle",
        type: "textarea",
        placeholder: "Qué necesitas resolver",
      },
    ],
  },
  {
    id: "fin_nomina",
    icon: I.Wallet,
    equipoGestion: "FINANZAS",
    titulo: "Nómina o retenciones",
    subtitulo: "Dudas sobre liquidaciones.",
    campos: [
      {
        id: "periodo",
        label: "Periodo",
        type: "text",
        placeholder: "Ej. abril 2026",
      },
      {
        id: "pregunta",
        label: "Pregunta",
        type: "textarea",
        placeholder: "Describe la duda",
      },
    ],
  },
  {
    id: "com_pedido",
    icon: I.Store,
    equipoGestion: "COMERCIAL",
    titulo: "Pedido o presupuesto cliente",
    subtitulo: "Soporte comercial.",
    campos: [
      {
        id: "cliente",
        label: "Cliente / cuenta",
        type: "text",
        placeholder: "Razón social o código",
      },
      {
        id: "necesidad",
        label: "Necesidad",
        type: "textarea",
        placeholder: "Producto, plazo, condiciones…",
      },
    ],
  },
  {
    id: "com_material",
    icon: I.Building2,
    equipoGestion: "COMERCIAL",
    titulo: "Material comercial o muestras",
    subtitulo: "Catálogos y envíos promocionales.",
    campos: [
      {
        id: "material",
        label: "Material solicitado",
        type: "textarea",
        placeholder: "Tipo y cantidad",
      },
      {
        id: "envio",
        label: "Dirección de envío",
        type: "text",
        placeholder: "Si aplica",
      },
    ],
  },
  {
    id: "legal_consulta",
    icon: I.Scale,
    equipoGestion: "LEGAL",
    titulo: "Consulta legal",
    subtitulo: "Contratos y cumplimiento.",
    campos: [
      {
        id: "materia",
        label: "Materia",
        type: "select",
        options: ["Contrato", "RGPD", "Proveedor", "Otro"],
      },
      {
        id: "contexto",
        label: "Contexto",
        type: "textarea",
        placeholder: "Resumen y urgencia",
      },
    ],
  },
  {
    id: "gen_otra",
    icon: I.ClipboardList,
    equipoGestion: "Según contenido",
    titulo: "Otra solicitud",
    subtitulo: "Si no encaja en ninguna plantilla, descríbela; se asignará manualmente.",
    campos: [
      {
        id: "asunto",
        label: "Asunto",
        type: "text",
        placeholder: "Título breve",
      },
      {
        id: "detalle",
        label: "Descripción",
        type: "textarea",
        placeholder: "Explica qué necesitas",
      },
    ],
  },
];

/** Todas las plantillas comunes; «Otra solicitud» al final. */
export function plantillasDisponibles(): PlantillaDef[] {
  const list = [...PLANTILLAS_INCIDENCIAS];
  const idx = list.findIndex((p) => p.id === "gen_otra");
  if (idx >= 0) {
    const [otra] = list.splice(idx, 1);
    list.push(otra);
  }
  return list;
}
