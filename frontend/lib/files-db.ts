// Types for stored records
interface StoredFileRecord {
  id?: number;
  name: string;
  type: string;
  // Prefer bytes; keep blob optional for backwards compatibility
  bytes?: ArrayBuffer;
  blob?: Blob;
}

// open or create IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open('myFilesDB', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

// save a file and get its id
export async function saveFile(file: File): Promise<number> {
  if (file.size === 0) {
    throw new Error('Refusing to save an empty file');
  }

  // Store bytes (ArrayBuffer) instead of Blob to avoid empty Blob issues
  const bytes = await file.arrayBuffer();
  debugger;

  const db = await openDB();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');

    let newId: number | undefined;

    const record: StoredFileRecord = {
      name: file.name,
      type: file.type,
      bytes,
    };

    const req = store.add(record) as IDBRequest<number>;

    req.onsuccess = () => {
      newId = req.result as number;
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to save file'));
    tx.onabort = () =>
      reject((tx.error as Error) ?? new Error('Transaction aborted'));
    tx.onerror = () =>
      reject((tx.error as Error) ?? new Error('Transaction error'));
    tx.oncomplete = () => {
      if (typeof newId === 'number') {
        resolve(newId);
      } else {
        reject(new Error('Insert did not return an ID'));
      }
    };
  });
}

// read all, convert to File objects, then delete them
export async function readAndDeleteFiles(): Promise<File[]> {
  const db = await openDB();
  return new Promise<File[]>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');

    const getReq = store.getAll() as IDBRequest<StoredFileRecord[]>;
    let files: File[] = [];

    getReq.onsuccess = () => {
      const records = getReq.result ?? [];
      files = records.map((r) => {
        const hasBytes = r.bytes && r.bytes.byteLength > 0;
        const hasBlob = r.blob && r.blob.size > 0;

        if (hasBytes) {
          return new File([r.bytes as ArrayBuffer], r.name, { type: r.type });
        }
        if (hasBlob) {
          return new File([r.blob as Blob], r.name, { type: r.type });
        }
        return new File([], r.name, { type: r.type });
      });

      const clearReq = store.clear();
      clearReq.onerror = () =>
        reject(clearReq.error ?? new Error('Failed to clear store'));
    };

    getReq.onerror = () =>
      reject(getReq.error ?? new Error('Failed to read files'));

    tx.onabort = () =>
      reject((tx.error as Error) ?? new Error('Transaction aborted'));
    tx.onerror = () =>
      reject((tx.error as Error) ?? new Error('Transaction error'));
    tx.oncomplete = () => resolve(files);
  });
}

// Optional: wipe the DB to remove any previously-saved empty blobs
export async function resetFilesDB(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('myFilesDB');
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(req.error ?? new Error('Failed to delete database'));
    req.onblocked = () => reject(new Error('Delete blocked by another tab'));
  });
}
