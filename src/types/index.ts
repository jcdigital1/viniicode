export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface QrCodeItem {
  id: string;
  userId: string;
  code: string; // Unique permanent code, e.g. KYS7G9ND
  name: string;
  destinationUrl: string;
  active: boolean;
  type: 'standard' | 'google_review' | 'whatsapp' | 'instagram' | 'custom';
  totalScans: number;
  lastScannedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QrScanRecord {
  id?: string;
  qrCodeId: string;
  code: string;
  scannedAt: string;
}

export interface GoogleBusinessItem {
  id: string;
  userId: string;
  businessName: string;
  address: string;
  placeId: string;
  reviewUrl: string;
  qrCodeId?: string;
  createdAt: string;
}
