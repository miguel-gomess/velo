import { Building2, ShieldCheck, Settings } from "lucide-react";
import { SeccionPlaceholder } from "./SeccionPlaceholder";
import { PanelAnalisis } from "./AnalisisPanel";

export { PanelAnalisis };

export function PanelEmpresa() {
  return (
    <SeccionPlaceholder
      title="Empresa"
      description="Datos corporativos, sedes y políticas internas centralizadas para el equipo ADMIN."
      Icon={Building2}
      hint="Próximamente: datos de la organización y documentación."
    />
  );
}

export function PanelSeguridad() {
  return (
    <SeccionPlaceholder
      title="Seguridad"
      description="Auditoría de accesos, políticas de contraseñas y revisiones de sesión para el panel Velo."
      Icon={ShieldCheck}
      hint="Próximamente: registro de eventos y alertas."
    />
  );
}

export function PanelAjustes() {
  return (
    <SeccionPlaceholder
      title="Ajustes"
      description="Preferencias del panel, integraciones y opciones avanzadas reservadas al departamento ADMIN."
      Icon={Settings}
      hint="Próximamente: webhooks y variables de entorno de solo lectura."
    />
  );
}
