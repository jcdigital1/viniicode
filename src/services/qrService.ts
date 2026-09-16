import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  increment,
  serverTimestamp,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { QrCodeItem } from '../types';
import { normalizeUrl } from '../config';

// Characters excluding ambiguous 0, O, 1, I
const SAFE_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an 8-character unique alphanumeric code (e.g. KYS7G9ND)
 */
export const generateUniqueCode = async (): Promise<string> => {
  let isUnique = false;
  let code = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    let result = '';
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * SAFE_CODE_CHARS.length);
      result += SAFE_CODE_CHARS[randomIndex];
    }
    code = result;

    // Check if code already exists in Firestore
    const q = query(collection(db, 'qrcodes'), where('code', '==', code), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      isUnique = true;
    }
  }

  return code;
};

/**
 * Creates a new dynamic QR Code in Firestore.
 */
export const createQrCode = async (
  userId: string,
  data: {
    name: string;
    destinationUrl: string;
    type?: QrCodeItem['type'];
  }
): Promise<QrCodeItem> => {
  const code = await generateUniqueCode();
  const normalizedUrl = normalizeUrl(data.destinationUrl);
  const now = new Date().toISOString();

  const qrCol = collection(db, 'qrcodes');
  const newDocRef = doc(qrCol);

  const qrItem: QrCodeItem = {
    id: newDocRef.id,
    userId,
    code,
    name: data.name.trim(),
    destinationUrl: normalizedUrl,
    active: true,
    type: data.type || 'standard',
    totalScans: 0,
    lastScannedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, qrItem);
  return qrItem;
};

/**
 * Updates an existing QR Code.
 * CRITICAL RULE: "code" is IMMUTABLE and cannot be altered.
 */
export const updateQrCode = async (
  qrId: string,
  data: {
    name?: string;
    destinationUrl?: string;
    active?: boolean;
  }
): Promise<void> => {
  const qrRef = doc(db, 'qrcodes', qrId);
  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof data.name === 'string') {
    updates.name = data.name.trim();
  }
  if (typeof data.destinationUrl === 'string') {
    updates.destinationUrl = normalizeUrl(data.destinationUrl);
  }
  if (typeof data.active === 'boolean') {
    updates.active = data.active;
  }

  await updateDoc(qrRef, updates);
};

/**
 * Toggles active/inactive state without deleting the QR Code.
 */
export const toggleQrCodeActive = async (qrId: string, currentActive: boolean): Promise<void> => {
  const qrRef = doc(db, 'qrcodes', qrId);
  await updateDoc(qrRef, {
    active: !currentActive,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Permanently deletes a QR Code document.
 */
export const deleteQrCode = async (qrId: string): Promise<void> => {
  const qrRef = doc(db, 'qrcodes', qrId);
  await deleteDoc(qrRef);
};

/**
 * Subscribes to real-time updates for a user's QR codes.
 */
export const subscribeUserQrCodes = (
  userId: string,
  callback: (items: QrCodeItem[]) => void,
  onError?: (err: Error) => void
) => {
  const q = query(
    collection(db, 'qrcodes'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: QrCodeItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as QrCodeItem);
      });
      // Sort newest first in memory
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (err) => {
      console.error('Firestore subscribe error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Looks up a QR code item by its unique public permanent code.
 */
export const getQrCodeByCode = async (code: string): Promise<QrCodeItem | null> => {
  const q = query(collection(db, 'qrcodes'), where('code', '==', code), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  const firstDoc = snapshot.docs[0];
  return firstDoc.data() as QrCodeItem;
};

/**
 * Records a scan event for telemetry and increments the QR code's totalScans count.
 */
export const recordScan = async (qrCodeId: string, code: string): Promise<void> => {
  try {
    const nowIso = new Date().toISOString();

    // 1. Add record to qrScans collection
    await addDoc(collection(db, 'qrScans'), {
      qrCodeId,
      code,
      scannedAt: nowIso,
    });

    // 2. Increment scan counter on QR code doc
    const qrRef = doc(db, 'qrcodes', qrCodeId);
    await updateDoc(qrRef, {
      totalScans: increment(1),
      lastScannedAt: nowIso,
    });
  } catch (err) {
    // Telemetry errors should not break the user redirect
    console.warn('Failed to record scan telemetry:', err);
  }
};
