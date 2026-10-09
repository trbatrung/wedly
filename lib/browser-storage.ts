import { imageExpired } from "./domain";
import type { Update } from "./types";

const DB_NAME = "wedly-images-v1";
type ImageRecord = {
  id: string;
  blob: Blob;
  expiresAt: string;
  retained: boolean;
};
// Keep live multipart uploads below Vercel's 4.5 MB request limit.
export async function prepareImage(file: File): Promise<File> {
  if (file.size <= 3.5 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas"),
      scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể tối ưu ảnh. Hãy thử ảnh nhỏ hơn.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("Không thể đọc ảnh.")),
        "image/jpeg",
        0.9,
      ),
    );
    if (blob.size > 3.5 * 1024 * 1024)
      throw new Error("Ảnh quá lớn. Chọn vùng trao đổi cần đọc rồi tải lại.");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("images", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Trình duyệt không thể lưu ảnh."));
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("images", mode);
      const request = operation(tx.objectStore("images"));
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
export async function saveImage(id: string, blob: Blob, expiresAt: string) {
  await transaction("readwrite", (s) =>
    s.put({ id, blob, expiresAt, retained: false } satisfies ImageRecord),
  );
}
export async function getImage(id: string): Promise<Blob | null> {
  const record = (await transaction("readonly", (s) => s.get(id))) as
    ImageRecord | undefined;
  if (!record) return null;
  if (!record.retained && Date.parse(record.expiresAt) <= Date.now()) {
    await deleteImage(id);
    return null;
  }
  return record.blob;
}
export async function deleteImage(id: string) {
  await transaction("readwrite", (s) => s.delete(id));
}
export async function retainImage(id: string, retained: boolean) {
  const record = (await transaction("readonly", (s) => s.get(id))) as
    ImageRecord | undefined;
  if (record) {
    if (!record.retained && Date.parse(record.expiresAt) <= Date.now())
      throw new Error("Ảnh đã hết hạn.");
    await transaction("readwrite", (s) => s.put({ ...record, retained }));
  }
}
export async function cleanImages(updates: Update[]) {
  const records = (await transaction("readonly", (s) =>
    s.getAll(),
  )) as ImageRecord[];
  await Promise.all(
    records
      .filter((r) => {
        const u = updates.find((u) => u.id === r.id);
        return !u || imageExpired(u);
      })
      .map((r) => deleteImage(r.id)),
  );
}
