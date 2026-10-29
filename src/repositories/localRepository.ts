import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AppData, Snapshot } from "../types";
import { createSeed } from "../data/seed";
import { validateBackup } from "../validation/schema";
interface Database extends DBSchema {
  application: { key: string; value: Snapshot };
}
export interface Repository {
  load(): Promise<Snapshot>;
  save(data: AppData, revision: number): Promise<Snapshot>;
}
export class LocalRepository implements Repository {
  private connection?: Promise<IDBPDatabase<Database>>;
  constructor(private name = "gestao-ambiental-ivaipora-v1") {}
  private db() {
    this.connection ??= openDB<Database>(this.name, 1, {
      upgrade(db) {
        db.createObjectStore("application");
      },
      blocking() {
        location.reload();
      },
      blocked() {
        console.warn(
          "Feche outras abas desta aplicação para concluir a atualização do armazenamento.",
        );
      },
    }).catch((error) => {
      this.connection = undefined;
      throw error;
    });
    return this.connection;
  }
  async load(): Promise<Snapshot> {
    const db = await this.db();
    const tx = db.transaction("application", "readwrite");
    let snapshot = await tx.store.get("current");
    if (!snapshot) {
      snapshot = { revision: 1, data: createSeed() };
      await tx.store.put(snapshot, "current");
    }
    await tx.done;
    return { ...snapshot, data: validateBackup(snapshot.data) };
  }
  async save(data: AppData, revision: number): Promise<Snapshot> {
    const valid = validateBackup(data);
    const db = await this.db();
    const tx = db.transaction("application", "readwrite");
    const current = await tx.store.get("current");
    if (current?.revision !== revision) {
      tx.abort();
      await tx.done.catch(() => {});
      throw new Error(
        "Os dados mudaram em outra aba. Recarregue esta página antes de salvar novamente. Seu formulário continua aberto.",
      );
    }
    const snapshot = { data: valid, revision: revision + 1 };
    await tx.store.put(snapshot, "current");
    await tx.done;
    return snapshot;
  }
}
export const repository: Repository = new LocalRepository();
