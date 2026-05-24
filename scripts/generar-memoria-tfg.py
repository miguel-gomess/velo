#!/usr/bin/env python3
"""Genera docs/Memoria-Velo.docx e imágenes en docs/memoria/imagenes/."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

from memoria_contenido import (
    ABSTRACT_EN,
    ABSTRACT_ES,
    AMPLIACION,
    ANEXOS_INTRO,
    ANEXOS_REPOSITORIO,
    BIBLIOGRAFIA_INTRO,
    CONCLUSIONES,
    FASES_DESARROLLO,
    EXTENSION_MEMORIA,
    DESARROLLO_ADMIN,
    DESARROLLO_DESPLIEGUE,
    DESARROLLO_DISENO,
    DESARROLLO_FLUJO,
    DESARROLLO_INTRO,
    DESARROLLO_PLANIFICACION,
    DESARROLLO_PORTAL,
    DESARROLLO_PRUEBAS,
    DESARROLLO_SEGURIDAD,
    DESARROLLO_TABLERO,
    DESARROLLO_TECNOLOGIAS,
    INTRODUCCION,
    JUSTIFICACION,
    OBJETIVO_GENERAL,
    OBJETIVOS_ESPECIFICOS,
)

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
IMG_DIR = ROOT / "docs" / "memoria" / "imagenes"
OUT_DOCX = ROOT / "docs" / "Memoria-Velo.docx"
CM2 = Cm(2)
MIN_PAGINAS = 20
MIN_PALABRAS = 2700
FONT_MONO = "Consolas"
FONT_UI = "Segoe UI"


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in ("consola.ttf", "cour.ttf", "lucon.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def render_code_image(path: Path, title: str, lines: list[str], width: int = 1100) -> None:
    line_h = 22
    pad = 24
    h = pad * 2 + 36 + len(lines) * line_h
    img = Image.new("RGB", (width, h), "#1a1f1e")
    draw = ImageDraw.Draw(img)
    f_title = _font(14, True)
    f_code = _font(13)
    draw.rectangle((0, 0, width, 32), fill="#0d3d2e")
    draw.text((pad, 8), title, fill="#7ee8b8", font=f_title)
    y = 44
    for i, line in enumerate(lines):
        color = "#9ca3af" if line.strip().startswith("//") else "#e8f0ec"
        if "import" in line or "export" in line or "async def" in line or "function" in line:
            color = "#7ee8b8"
        draw.text((pad, y), line[:120], fill=color, font=f_code)
        y += line_h
    img.save(path, "PNG")


def render_architecture(path: Path) -> None:
    w, h = 1000, 520
    img = Image.new("RGB", (w, h), "#f4f7f5")
    draw = ImageDraw.Draw(img)
    f = _font(15, True)
    f2 = _font(12)

    boxes = [
        (60, 80, 280, 180, "Pantallas\n(navegador)", "#0d3d2e", "#ffffff"),
        (360, 80, 580, 180, "Servidor\n(aplicación)", "#145c42", "#ffffff"),
        (660, 80, 880, 180, "Base de datos", "#1e293b", "#ffffff"),
        (200, 280, 420, 380, "Inicio de sesión", "#0d3d2e", "#ffffff"),
        (480, 280, 700, 380, "Archivos adjuntos", "#334155", "#ffffff"),
        (720, 280, 920, 420, "Publicación\nen internet", "#64748b", "#ffffff"),
    ]
    for x1, y1, x2, y2, label, bg, fg in boxes:
        draw.rounded_rectangle((x1, y1, x2, y2), radius=12, fill=bg)
        for i, line in enumerate(label.split("\n")):
            draw.text((x1 + 16, y1 + 16 + i * 22), line, fill=fg, font=f if i == 0 else f2)

    arrows = [
        ((280, 130), (360, 130)),
        ((580, 130), (660, 130)),
        ((340, 180), (340, 280)),
        ((590, 180), (590, 280)),
    ]
    for a, b in arrows:
        draw.line([*a, *b], fill="#0d3d2e", width=3)
        draw.polygon([(b[0], b[1]), (b[0] - 10, b[1] - 6), (b[0] - 10, b[1] + 6)], fill="#0d3d2e")

    draw.text((40, 24), "Esquema general de Velo", fill="#0d3d2e", font=f)
    img.save(path, "PNG")


def render_erd(path: Path) -> None:
    w, h = 1000, 560
    img = Image.new("RGB", (w, h), "#ffffff")
    draw = ImageDraw.Draw(img)
    f = _font(13, True)
    f2 = _font(11)
    entities = [
        (40, 60, 220, 200, "usuarios", ["id", "email", "rol", "departamento"]),
        (280, 60, 460, 200, "incidencias", ["id", "titulo", "estado", "epica_id", "fecha_limite"]),
        (520, 60, 700, 200, "incidencia_mensajes", ["id", "incidencia_id", "es_interno"]),
        (740, 60, 920, 200, "incidencia_adjuntos", ["id", "tipo", "ruta"]),
        (40, 280, 220, 400, "epicas", ["id", "clave", "nombre", "color"]),
        (160, 420, 360, 520, "usuario_equipos", ["usuario_id", "equipo_codigo"]),
        (400, 280, 600, 420, "incidencia_eventos", ["id", "tipo", "payload"]),
        (640, 280, 860, 420, "incidencia_lecturas", ["usuario_id", "ultimo_mensaje_id"]),
    ]
    for x1, y1, x2, y2, name, cols in entities:
        draw.rectangle((x1, y1, x2, y2), outline="#0d3d2e", width=2)
        draw.rectangle((x1, y1, x2, y1 + 28), fill="#0d3d2e")
        draw.text((x1 + 8, y1 + 6), name, fill="#ffffff", font=f)
        y = y1 + 36
        for c in cols:
            draw.text((x1 + 8, y), c, fill="#1e293b", font=f2)
            y += 18
    draw.line([(220, 130), (280, 130)], fill="#64748b", width=2)
    draw.line([(220, 340), (280, 130)], fill="#64748b", width=2)
    draw.line([(460, 130), (520, 130)], fill="#64748b", width=2)
    draw.line([(340, 200), (340, 280)], fill="#64748b", width=2)
    draw.text((40, 20), "Figura 2 — Modelo de datos simplificado", fill="#0d3d2e", font=f)
    img.save(path, "PNG")


def render_ui_mock(path: Path, title: str, subtitle: str, cards: list[tuple[str, str]]) -> None:
    w, h = 1000, 620
    img = Image.new("RGB", (w, h), "#0f1413")
    draw = ImageDraw.Draw(img)
    f = _font(14, True)
    f2 = _font(12)
    draw.rectangle((0, 0, w, 56), fill="#0d3d2e")
    draw.text((24, 16), "Velo", fill="#7ee8b8", font=f)
    draw.text((120, 18), subtitle, fill="#a8c4b8", font=f2)
    draw.text((24, 72), title, fill="#e8f0ec", font=_font(20, True))
    y = 120
    for head, body in cards:
        draw.rounded_rectangle((24, y, w - 24, y + 90), radius=10, fill="#1a2421", outline="#2d4a3e")
        draw.text((40, y + 14), head, fill="#7ee8b8", font=f)
        draw.text((40, y + 40), body[:90], fill="#c5d4cc", font=f2)
        y += 104
    img.save(path, "PNG")


def setup_images() -> dict[str, Path]:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    arch = IMG_DIR / "01-arquitectura.png"
    render_architecture(arch)
    paths["arquitectura"] = arch

    erd = IMG_DIR / "02-modelo-datos.png"
    render_erd(erd)
    paths["erd"] = erd

    code_auth = IMG_DIR / "03-codigo-auth.png"
    render_code_image(
        code_auth,
        "Ejemplo: configuración del inicio de sesión",
        [
            "import { betterAuth } from \"better-auth\";",
            "import { pool } from \"@/lib/db\";",
            "",
            "export const auth = betterAuth({",
            "  database: pool,",
            "  emailAndPassword: { enabled: true },",
            "  trustedOrigins: [...getAllowedOriginsList()],",
            "});",
        ],
    )
    paths["codigo_auth"] = code_auth

    code_routes = IMG_DIR / "04-codigo-rutas-react.png"
    render_code_image(
        code_routes,
        "Ejemplo: organización de las pantallas de la app",
        [
            "<Route path=\"/portal\" element={<RequireAuth><Portal /></RequireAuth>} />",
            "<Route path=\"/workspace\" element={<RequireAuth><Workspace />}>",
            "  <Route index element={<WorkspaceKanbanPanel />} />",
            "</Route>",
            "<Route path=\"/dashboard\" element={<RequireAuth><Dashboard />}>",
            "  <Route path=\"incidencias\" element={<IncidenciasPanel />} />",
            "  <Route path=\"analisis\" element={<PanelAnalisis />} />",
            "</Route>",
        ],
    )
    paths["codigo_rutas"] = code_routes

    code_api = IMG_DIR / "05-codigo-api-incidencias.png"
    render_code_image(
        code_api,
        "Ejemplo: quién ve cada listado de solicitudes",
        [
            "const scope = url.searchParams.get(\"scope\") ?? \"portal\";",
            "// portal: solo solicitudes del usuario",
            "// kanban: equipo + solicitudes propias (OR usuario_id)",
            "// all: administrador — visión global",
            "if (scope === \"kanban\") { /* filtro por equipos */ }",
        ],
    )
    paths["codigo_api"] = code_api

    ui_captures = {
        "portal": "06-portal-inicio.png",
        "kanban": "07-workspace-kanban.png",
        "dashboard": "08-dashboard-admin.png",
        "config": "09-configuracion-equipos.png",
        "login": "10-login.png",
        "portal_mis": "11-portal-mis-solicitudes.png",
        "portal_nueva": "12-portal-nueva-solicitud.png",
        "analisis": "13-dashboard-analisis.png",
        "roadmap": "14-roadmap-epicas.png",
        "cronograma": "15-cronograma-gantt.png",
        "calendario": "16-calendario-plazos.png",
    }
    for key, fname in ui_captures.items():
        p = IMG_DIR / fname
        paths[key] = p
        if not p.exists():
            print(f"Aviso: falta captura {fname} — ejecuta capturar-pantallas-memoria.mjs")

    if not paths["roadmap"].exists():
        render_ui_mock(
            paths["roadmap"],
            "Roadmap por épica",
            "Planificación — vista ejecutiva",
            [
                ("INFRA · Infraestructura", "68% cerradas · SLA 92% en plazo"),
                ("PORTAL · Portal del empleado", "45% cerradas · próximo límite VEL-12"),
                ("SEGURIDAD", "3 abiertas · 1 fuera de plazo"),
            ],
        )
    if not paths["cronograma"].exists():
        render_ui_mock(
            paths["cronograma"],
            "Cronograma (Gantt)",
            "Línea temporal por épica",
            [
                ("VEL-8 · Acceso VPN", "Barra en curso — límite 28 may"),
                ("VEL-12 · Impresora planta 2", "Fuera de plazo — arrastre de plazo"),
                ("Agrupado por épica INFRA", "Fines de semana sombreados · línea «Hoy»"),
            ],
        )
    if not paths["calendario"].exists():
        render_ui_mock(
            paths["calendario"],
            "Calendario de plazos",
            "Vencimientos por día",
            [
                ("21 may — 2 incidencias", "Verde: en plazo · Ámbar: vence pronto"),
                ("28 may — 1 incidencia", "Rojo: fuera de plazo"),
                ("Clic en día abre detalle", "Colores según estado SLA"),
            ],
        )

    return paths


def add_page_number(section) -> None:
    footer = section.footer
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = p.add_run()
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    run._r.append(fld)


def set_doc_defaults(doc: Document) -> None:
    for section in doc.sections:
        section.top_margin = CM2
        section.bottom_margin = CM2
        section.left_margin = CM2
        section.right_margin = CM2
        add_page_number(section)
    style = doc.styles["Normal"]
    style.font.name = "Arial"
    style.font.size = Pt(12)
    pf = style.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    pf.line_spacing = 1.5
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def add_heading(doc: Document, text: str, level: int = 1) -> None:
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.name = "Arial"
        run.font.color.rgb = RGBColor(0x0D, 0x3D, 0x2E)


def add_para(doc: Document, text: str) -> None:
    p = doc.add_paragraph(text)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    p.paragraph_format.line_spacing = 1.5
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def add_paras(doc: Document, paragraphs: list[str]) -> None:
    for text in paragraphs:
        add_para(doc, text)


def add_figure(doc: Document, img_path: Path, caption: str, width_cm: float = 15.5) -> None:
    if img_path.exists():
        doc.add_picture(str(img_path), width=Cm(width_cm))
        last = doc.paragraphs[-1]
        last.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap = doc.add_paragraph(caption)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in cap.runs:
        run.font.size = Pt(10)
        run.italic = True


def build_document(images: dict[str, Path]) -> None:
    """Estructura según guía del centro: 10 apartados."""
    doc = Document()
    set_doc_defaults(doc)

    # --- 1. Portada (sin número de página en la plantilla del centro) ---
    for _ in range(6):
        doc.add_paragraph()
    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t.add_run("VELO\nSistema de gestión de incidencias internas")
    r.bold = True
    r.font.size = Pt(22)
    r.font.name = "Arial"
    doc.add_paragraph()
    sub = doc.add_paragraph(
        "Trabajo de Fin de Grado\n"
        "Ciclo Formativo de Grado Superior\n"
        "Desarrollo de Aplicaciones Multiplataforma (DAM)\n"
        "Modalidad Dual\n\n"
        "[Nombre del alumno/a]\n"
        "[Nombre del tutor/a]\n"
        "[Centro educativo]\n"
        "Curso 2025/2026"
    )
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.add_page_break()

    # --- 2. Abstract (español + inglés) ---
    add_heading(doc, "Abstract", 1)
    add_heading(doc, "Resumen (español)", 2)
    add_paras(doc, ABSTRACT_ES)
    add_heading(doc, "Abstract (English)", 2)
    add_paras(doc, ABSTRACT_EN)
    doc.add_page_break()

    # --- 3. Índice ---
    add_heading(doc, "Índice", 1)
    for item in [
        "1. Portada",
        "2. Abstract",
        "3. Índice",
        "4. Justificación del proyecto",
        "5. Introducción",
        "6. Objetivos",
        "7. Desarrollo",
        "8. Conclusiones",
        "9. Bibliografía",
        "10. Anexos",
    ]:
        doc.add_paragraph(item, style="List Number")
    doc.add_page_break()

    # --- 4. Justificación ---
    add_heading(doc, "4. Justificación del proyecto", 1)
    add_paras(doc, JUSTIFICACION)
    add_paras(doc, EXTENSION_MEMORIA[:2])
    doc.add_page_break()

    # --- 5. Introducción ---
    add_heading(doc, "5. Introducción", 1)
    add_paras(doc, INTRODUCCION)
    add_paras(doc, EXTENSION_MEMORIA[2:4])
    doc.add_page_break()

    # --- 6. Objetivos ---
    add_heading(doc, "6. Objetivos", 1)
    add_heading(doc, "6.1 Objetivo general", 2)
    add_para(doc, OBJETIVO_GENERAL)
    add_heading(doc, "6.2 Objetivos específicos", 2)
    for obj in OBJETIVOS_ESPECIFICOS:
        doc.add_paragraph(obj, style="List Bullet")
    doc.add_page_break()

    # --- 7. Desarrollo ---
    add_heading(doc, "7. Desarrollo", 1)
    add_paras(doc, DESARROLLO_INTRO)

    add_heading(doc, "7.1 Fases del proyecto", 2)
    add_paras(doc, FASES_DESARROLLO)

    add_heading(doc, "7.2 Diseño de la solución", 2)
    add_paras(doc, DESARROLLO_DISENO)
    add_figure(
        doc,
        images["arquitectura"],
        "Figura 1. Esquema general: pantallas, servidor y base de datos.",
    )
    add_figure(
        doc,
        images["erd"],
        "Figura 2. Principales datos que guarda el sistema (usuarios, solicitudes, mensajes).",
    )

    add_heading(doc, "7.3 Portal del empleado", 2)
    add_paras(doc, DESARROLLO_PORTAL)
    if images.get("login"):
        add_figure(doc, images["login"], "Figura 3. Pantalla de acceso con correo y contraseña.")
    add_figure(doc, images["portal"], "Figura 4. Página de inicio del portal.")
    if images.get("portal_mis"):
        add_figure(doc, images["portal_mis"], "Figura 5. Listado de mis solicitudes.")
    if images.get("portal_nueva"):
        add_figure(doc, images["portal_nueva"], "Figura 6. Alta de una nueva solicitud.")

    add_heading(doc, "7.4 Tablero de trabajo del equipo", 2)
    add_paras(doc, DESARROLLO_TABLERO)
    add_figure(doc, images["kanban"], "Figura 7. Tablero con columnas de estado.")

    add_heading(doc, "7.5 Planificación por épicas", 2)
    add_paras(doc, DESARROLLO_PLANIFICACION)
    add_paras(doc, DESARROLLO_FLUJO)
    if images.get("roadmap"):
        add_figure(doc, images["roadmap"], "Figura 11. Roadmap con avance y SLA por épica.")
    if images.get("cronograma"):
        add_figure(doc, images["cronograma"], "Figura 12. Cronograma tipo Gantt con agrupación por épica.")
    if images.get("calendario"):
        add_figure(doc, images["calendario"], "Figura 13. Calendario de fechas límite con código de colores SLA.")

    add_heading(doc, "7.6 Panel de administración", 2)
    add_paras(doc, DESARROLLO_ADMIN)
    add_figure(doc, images["dashboard"], "Figura 8. Vista global de incidencias.")
    if images.get("analisis"):
        add_figure(
            doc,
            images["analisis"],
            "Figura 9. Resumen de tiempos, plazos y SLA desglosado por épica.",
        )
    add_figure(doc, images["config"], "Figura 10. Configuración de equipos, plazos y épicas.")

    add_heading(doc, "7.7 Seguridad y protección de datos", 2)
    add_paras(doc, DESARROLLO_SEGURIDAD)

    add_heading(doc, "7.8 Pruebas realizadas", 2)
    add_paras(doc, DESARROLLO_PRUEBAS)

    add_heading(doc, "7.9 Puesta en marcha en internet", 2)
    add_paras(doc, DESARROLLO_DESPLIEGUE)

    add_heading(doc, "7.10 Valoración del resultado", 2)
    add_paras(doc, AMPLIACION)

    add_heading(doc, "7.11 Nota sobre tecnologías utilizadas", 2)
    add_paras(doc, DESARROLLO_TECNOLOGIAS)

    doc.add_page_break()

    # --- 8. Conclusiones ---
    add_heading(doc, "8. Conclusiones", 1)
    add_paras(doc, CONCLUSIONES)
    add_paras(doc, EXTENSION_MEMORIA[4:])
    doc.add_page_break()

    # --- 9. Bibliografía ---
    add_heading(doc, "9. Bibliografía", 1)
    add_paras(doc, BIBLIOGRAFIA_INTRO)
    refs = [
        "Atlassian. (2024). Kanban Guide. https://www.atlassian.com/agile/kanban",
        "Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. Tesis doctoral, University of California, Irvine.",
        "Meta Open Source. (2024). React documentation. https://react.dev/",
        "OWASP Foundation. (2024). OWASP Top Ten. https://owasp.org/www-project-top-ten/",
        "PostgreSQL Global Development Group. (2025). PostgreSQL documentation. https://www.postgresql.org/docs/",
        "Vercel, Inc. (2025). Next.js documentation. https://nextjs.org/docs",
        "W3C. (2024). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/",
    ]
    for ref in refs:
        p = doc.add_paragraph(ref)
        p.paragraph_format.left_indent = Cm(1)
        p.paragraph_format.first_line_indent = Cm(-1)

    doc.add_page_break()

    # --- 10. Anexos ---
    add_heading(doc, "10. Anexos", 1)
    add_paras(doc, ANEXOS_INTRO)

    add_heading(doc, "Anexo A. Repositorio y usuarios de prueba", 2)
    add_para(doc, ANEXOS_REPOSITORIO)

    add_heading(doc, "Anexo B. Capturas de pantalla", 2)
    for key, cap in [
        ("login", "Acceso al sistema."),
        ("portal", "Portal — inicio."),
        ("portal_mis", "Portal — mis solicitudes."),
        ("portal_nueva", "Portal — nueva solicitud."),
        ("kanban", "Tablero del equipo."),
        ("roadmap", "Roadmap por épica."),
        ("cronograma", "Cronograma Gantt."),
        ("calendario", "Calendario de plazos."),
        ("dashboard", "Administración — listado."),
        ("analisis", "Administración — análisis SLA por épica."),
        ("config", "Administración — configuración."),
    ]:
        if key not in images or not images[key].exists():
            continue
        add_figure(doc, images[key], cap, width_cm=14)

    add_heading(doc, "Anexo C. Fragmentos de código (referencia técnica)", 2)
    add_para(
        doc,
        "Opcional para lectores con perfil técnico. No es necesario para entender el apartado 7.",
    )
    for key, cap in [
        ("codigo_auth", "Inicio de sesión en el servidor."),
        ("codigo_rutas", "Organización de pantallas."),
        ("codigo_api", "Reglas de visibilidad de solicitudes."),
    ]:
        if key in images:
            add_figure(doc, images[key], cap, width_cm=14)

    doc.save(OUT_DOCX)
    print(f"Documento: {OUT_DOCX}")
    print(f"Imágenes: {IMG_DIR}")


def count_words_doc(path: Path) -> int:
    doc = Document(str(path))
    return sum(len(p.text.split()) for p in doc.paragraphs if p.text.strip())


def count_pages_word(path: Path) -> int | None:
    try:
        import win32com.client  # type: ignore

        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(str(path.resolve()))
        n = int(doc.ComputeStatistics(2))
        doc.Close(False)
        word.Quit()
        return n
    except Exception:
        return None


def run_captures() -> None:
    script = ROOT / "scripts" / "capturar-pantallas-memoria.mjs"
    print("Capturando pantallas (requiere frontend y backend en marcha)…")
    subprocess.run(["node", str(script)], cwd=ROOT, check=True)


def main() -> None:
    if "--capturar" in sys.argv:
        run_captures()
    images = setup_images()
    build_document(images)
    words = count_words_doc(OUT_DOCX)
    pages_est = max(MIN_PAGINAS, words // 250 + 8)
    print(f"Palabras: {words} (estimación ~{words // 280} páginas de texto + figuras)")
    pages = count_pages_word(OUT_DOCX)
    if pages is not None:
        print(f"Páginas (Word): {pages}")
        if pages < MIN_PAGINAS:
            print(f"AVISO: {pages} páginas < {MIN_PAGINAS}. Añade texto o revisa márgenes en Word.")
    elif words < MIN_PALABRAS:
        print(f"AVISO: menos de {MIN_PALABRAS} palabras; puede quedar por debajo de {MIN_PAGINAS} páginas.")
    else:
        print(f"Extension orientativa >= {MIN_PAGINAS} paginas con figuras incluidas.")


if __name__ == "__main__":
    main()
