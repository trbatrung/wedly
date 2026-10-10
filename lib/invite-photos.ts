"use client";
import { useEffect, useState } from "react";

// Invitation photos. Re-encoding through a canvas resizes large phone photos
// and drops EXIF metadata such as GPS location before anything is stored.
export async function compressPhoto(file: File, maxSide = 2000) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type))
    throw new Error("Chọn ảnh JPG, PNG hoặc WebP.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Ảnh quá lớn. Chọn ảnh dưới 20 MB.");
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Không thể đọc ảnh. Hãy chọn ảnh khác.");
  });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh trên trình duyệt này.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Không thể xử lý ảnh.")),
        "image/jpeg",
        0.86,
      ),
    );
  } finally {
    bitmap.close();
  }
}

// Demo photos stay in this browser, separate from the 48-hour screenshot store.
const DB_NAME = "wedly-invite-photos-v1";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("photos", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Trình duyệt không thể lưu ảnh."));
  });
}
async function run<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("photos", mode);
      const request = operation(tx.objectStore("photos"));
      let value: T;
      request.onsuccess = () => {
        value = request.result;
      };
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(new Error("Không thể truy cập ảnh đã lưu."));
      tx.onabort = () => reject(new Error("Không thể lưu ảnh."));
    });
  } finally {
    db.close();
  }
}
const idOf = (ref: string) => ref.slice("local:".length);
export async function storeLocalPhoto(blob: Blob) {
  const id = crypto.randomUUID();
  await run("readwrite", (s) => s.put({ id, blob }));
  return `local:${id}`;
}
export async function loadLocalPhoto(ref: string): Promise<Blob | null> {
  const record = (await run("readonly", (s) => s.get(idOf(ref)))) as
    | { blob: Blob }
    | undefined;
  return record?.blob ?? null;
}
export async function removeLocalPhoto(ref: string) {
  await run("readwrite", (s) => s.delete(idOf(ref)));
}
// Removes demo photos no invitation refers to (e.g. uploaded, never saved).
export async function pruneLocalPhotos(keep: string[]) {
  const ids = (await run("readonly", (s) => s.getAllKeys())) as string[];
  const used = new Set(keep.filter((r) => r.startsWith("local:")).map(idOf));
  await Promise.all(
    ids
      .filter((id) => !used.has(id))
      .map((id) => run("readwrite", (s) => s.delete(id))),
  );
}
// Resolves a stored photo reference to something an <img> can show.
export function usePhoto(ref: string) {
  const [src, setSrc] = useState<string | null>(
    ref.startsWith("https://") ? ref : null,
  );
  useEffect(() => {
    if (!ref.startsWith("local:")) {
      setSrc(ref.startsWith("https://") ? ref : null);
      return;
    }
    let alive = true,
      url: string | undefined;
    setSrc(null);
    loadLocalPhoto(ref)
      .then((blob) => {
        if (blob && alive) {
          url = URL.createObjectURL(blob);
          setSrc(url);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ref]);
  return src;
}
