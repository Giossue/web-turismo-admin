export const MAX_IMPORTACIONES_SIMULTANEAS = 2;
export const MAX_IMPORTACIONES_POR_MINUTO = 12;
const VENTANA_MS = 60_000;
const MAX_USUARIOS = 1024;

/** Límites por proceso: mantienen acotados cuerpos, workers y memoria de cuotas. */
export class ImportAdmission {
  private activas = 0;
  private usuarios = new Map<number, { inicio: number; cantidad: number }>();
  reservar(): (() => void) | null {
    if (this.activas >= MAX_IMPORTACIONES_SIMULTANEAS) return null;
    this.activas++;
    let liberada = false;
    return () => {
      if (!liberada) {
        liberada = true;
        this.activas--;
      }
    };
  }
  admitirUsuario(id: number, ahora = Date.now()): boolean {
    for (const [usuario, cuota] of this.usuarios)
      if (ahora - cuota.inicio >= VENTANA_MS) this.usuarios.delete(usuario);
    const cuota = this.usuarios.get(id);
    if (cuota) {
      if (cuota.cantidad >= MAX_IMPORTACIONES_POR_MINUTO) return false;
      cuota.cantidad++;
    } else {
      if (this.usuarios.size >= MAX_USUARIOS) return false;
      this.usuarios.set(id, { inicio: ahora, cantidad: 1 });
    }
    return true;
  }
}
