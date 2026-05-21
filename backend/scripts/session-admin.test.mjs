import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ADMIN_DEPT = "ADMIN";

function isAdminUsuario(usuario) {
  if (usuario.es_admin) return true;
  return (usuario.departamento ?? "").trim().toUpperCase() === ADMIN_DEPT;
}

describe("isAdminUsuario", () => {
  it("departamento ADMIN", () => {
    assert.equal(
      isAdminUsuario({ departamento: "ADMIN", es_admin: false }),
      true,
    );
  });
  it("flag es_admin", () => {
    assert.equal(
      isAdminUsuario({ departamento: "IT", es_admin: true }),
      true,
    );
  });
  it("agente normal", () => {
    assert.equal(
      isAdminUsuario({ departamento: "IT", es_admin: false }),
      false,
    );
  });
});
