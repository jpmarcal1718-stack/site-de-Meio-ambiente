import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { LocalRepository } from "../src/repositories/localRepository";
import { validateBackup } from "../src/validation/schema";
describe("IndexedDB e backups", () => {
  it("carrega os exemplos uma única vez e preserva edições ao reabrir", async () => {
    const name = crypto.randomUUID();
    const repo = new LocalRepository(name);
    const first = await repo.load();
    expect(first.data.demands).toHaveLength(12);
    expect(first.data.routines).toHaveLength(6);
    first.data.demands[0].title = "Registro persistido";
    await repo.save(first.data, first.revision);
    const reloaded = await new LocalRepository(name).load();
    expect(reloaded.data.demands[0].title).toBe("Registro persistido");
    expect(reloaded.data.demands).toHaveLength(12);
    expect(reloaded.revision).toBe(2);
  });
  it("duas inicializações concorrentes não duplicam a carga", async () => {
    const name = crypto.randomUUID();
    const [a, b] = await Promise.all([
      new LocalRepository(name).load(),
      new LocalRepository(name).load(),
    ]);
    expect(a.data.seededAt).toBe(b.data.seededAt);
    expect(a.data.demands[0].id).toBe(b.data.demands[0].id);
  });
  it("importação inválida não altera os dados atuais", async () => {
    const repo = new LocalRepository(crypto.randomUUID());
    const before = await repo.load();
    const bad = {
      ...before.data,
      demands: [{ ...before.data.demands[0], title: "" }],
    };
    expect(() => validateBackup(bad)).toThrow();
    await expect(repo.save(bad, before.revision)).rejects.toThrow();
    expect(await repo.load()).toEqual(before);
  });
  it("substitui os dados atomicamente mantendo os vínculos válidos", async () => {
    const repo = new LocalRepository(crypto.randomUUID());
    const s = await repo.load();
    const imported = validateBackup(JSON.parse(JSON.stringify(s.data)));
    imported.demands[0].title = "Backup recuperado";
    const saved = await repo.save(imported, s.revision);
    expect(saved.revision).toBe(2);
    expect((await repo.load()).data.demands[0].title).toBe("Backup recuperado");
  });
  it("impede sobrescrita de uma alteração feita em outra aba", async () => {
    const name = crypto.randomUUID();
    const a = new LocalRepository(name);
    const b = new LocalRepository(name);
    const s = await a.load();
    await b.save({ ...s.data, demands: s.data.demands.slice(1) }, s.revision);
    await expect(a.save(s.data, s.revision)).rejects.toThrow("outra aba");
    expect((await a.load()).data.demands).toHaveLength(11);
  });
});
