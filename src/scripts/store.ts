/* ที่เก็บในเครื่องของนักเรียน ถ้าเบราว์เซอร์ไม่ให้เก็บ ทุกอย่างยังใช้ได้แต่จะไม่จำ */

export function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function save(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ไม่จำก็ไม่เป็นไร */
  }
}
