import type { LucideIcon } from "lucide-react";
import {
  HelpCircle,
  Landmark,
  Monitor,
  Users,
  Wrench,
} from "lucide-react";
import { equipoCodigoFromPlantilla } from "./equipos";

export type PortalCategoria = {
  id: string;
  label: string;
  descripcion: string;
  equipoGestion: string;
  icon: LucideIcon;
  accent: string;
  accentSoft: string;
};

/** Categorías simplificadas para el portal (sustituyen la cuadrícula de plantillas). */
export const PORTAL_CATEGORIAS: PortalCategoria[] = [
  {
    id: "it",
    label: "Informática",
    descripcion: "Equipos, software, accesos, averías técnicas",
    equipoGestion: "IT",
    icon: Monitor,
    accent: "#0052cc",
    accentSoft: "#deebff",
  },
  {
    id: "rrhh",
    label: "Recursos humanos",
    descripcion: "Altas, permisos, nómina, consultas de personal",
    equipoGestion: "RRHH",
    icon: Users,
    accent: "#6554c0",
    accentSoft: "#eae6ff",
  },
  {
    id: "mantenimiento",
    label: "Instalaciones",
    descripcion: "Averías, mobiliario, climatización, electricidad",
    equipoGestion: "MANTENIMIENTO",
    icon: Wrench,
    accent: "#ff8b00",
    accentSoft: "#fff0e0",
  },
  {
    id: "finanzas",
    label: "Finanzas",
    descripcion: "Facturas, pagos, presupuestos, nómina",
    equipoGestion: "FINANZAS",
    icon: Landmark,
    accent: "#00875a",
    accentSoft: "#e3fcef",
  },
  {
    id: "otro",
    label: "Otra consulta",
    descripcion: "Cualquier otra solicitud; se asignará al equipo adecuado",
    equipoGestion: "Según contenido",
    icon: HelpCircle,
    accent: "#5e6c84",
    accentSoft: "#ebecf0",
  },
];

export function categoriaPorId(id: string): PortalCategoria | undefined {
  return PORTAL_CATEGORIAS.find((c) => c.id === id);
}

export function equipoCodigoDesdeCategoria(categoriaId: string): string | null {
  const cat = categoriaPorId(categoriaId);
  if (!cat) return null;
  return equipoCodigoFromPlantilla(cat.equipoGestion);
}
