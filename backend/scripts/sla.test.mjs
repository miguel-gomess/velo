import assert from "node:assert/strict";
import { describe, it } from "node:test";

function horasSlaPrioridad(prioridad) {
  const map = { critica: 8, urgente: 8, alta: 24, normal: 72, media: 72, baja: 168 };
  return map[prioridad.trim().toLowerCase()] ?? 72;
}

function calcularFechaLimite(prioridad, desde = new Date()) {
  const h = horasSlaPrioridad(prioridad);
  return new Date(desde.getTime() + h * 3600 * 1000);
}

describe("SLA", () => {
  it("alta = 24h", () => {
    const d = calcularFechaLimite("alta", new Date("2026-01-01T12:00:00Z"));
    assert.equal(d.toISOString(), "2026-01-02T12:00:00.000Z");
  });
  it("critica = 8h", () => {
    assert.equal(horasSlaPrioridad("critica"), 8);
  });
});
