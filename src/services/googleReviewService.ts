import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleBusinessItem } from '../types';

/**
 * Extracts Place ID or business details from standard Google Maps links or direct input.
 */
export interface ExtractedGoogleBusiness {
  businessName: string;
  address: string;
  placeId: string;
  reviewUrl: string;
}

/**
 * Parses Google Maps URL or Place ID input.
 * Supports:
 * - Direct Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4)
 * - https://search.google.com/local/writereview?placeid=...
 * - https://www.google.com/maps/place/...
 * - URLs with query parameters place_id, query_place_id, ftid
 */
export const parseGoogleMapsInput = (input: string): ExtractedGoogleBusiness | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check if user entered a direct Place ID (typically starts with ChIJ, 27+ chars)
  if (/^ChIJ[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return {
      businessName: 'Empresa Google',
      address: 'Endereço vinculado ao Place ID',
      placeId: trimmed,
      reviewUrl: `https://search.google.com/local/writereview?placeid=${trimmed}`,
    };
  }

  // 2. Direct review URL
  if (trimmed.includes('search.google.com/local/writereview')) {
    try {
      const parsedUrl = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const placeId = parsedUrl.searchParams.get('placeid') || parsedUrl.searchParams.get('place_id');
      if (placeId) {
        return {
          businessName: 'Empresa Google',
          address: 'Local verificado no Google',
          placeId,
          reviewUrl: `https://search.google.com/local/writereview?placeid=${placeId}`,
        };
      }
    } catch {
      // Continue parsing
    }
  }

  // 3. Google Maps place URLs: https://www.google.com/maps/place/Nome+Empresa/@lat,lng,...
  try {
    const urlStr = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const url = new URL(urlStr);

    // Check search params
    const paramPlaceId =
      url.searchParams.get('placeid') ||
      url.searchParams.get('place_id') ||
      url.searchParams.get('query_place_id');

    if (paramPlaceId) {
      return {
        businessName: 'Empresa Google',
        address: 'Local verificado no Google Maps',
        placeId: paramPlaceId,
        reviewUrl: `https://search.google.com/local/writereview?placeid=${paramPlaceId}`,
      };
    }

    // Path extraction: /maps/place/<Business+Name>/...
    const pathname = decodeURIComponent(url.pathname);
    const placeMatch = pathname.match(/\/place\/([^/@]+)/);
    let businessName = 'Empresa Google';
    if (placeMatch && placeMatch[1]) {
      businessName = placeMatch[1].replace(/\+/g, ' ');
    }

    // Try extracting hex/data place ID or ftid from URL
    const ftidMatch = url.search.match(/ftid=([^&]+)/) || url.pathname.match(/!1s([^!]+)/);
    const placeIdCandidate = ftidMatch ? ftidMatch[1] : '';

    // If we have a placeIdCandidate starting with 0x (hex cid) or ChIJ
    const finalPlaceId = placeIdCandidate || (businessName !== 'Empresa Google' ? `query_${encodeURIComponent(businessName)}` : '');

    if (finalPlaceId || businessName !== 'Empresa Google') {
      const generatedPlaceId = finalPlaceId.startsWith('ChIJ')
        ? finalPlaceId
        : finalPlaceId;

      const reviewUrl = finalPlaceId.startsWith('ChIJ')
        ? `https://search.google.com/local/writereview?placeid=${finalPlaceId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}`;

      return {
        businessName,
        address: 'Localização identificada via Google Maps',
        placeId: generatedPlaceId || 'N/A',
        reviewUrl,
      };
    }
  } catch {
    // If not a valid URL
  }

  // Fallback: If user typed an address or business name
  return {
    businessName: trimmed,
    address: 'Empresa selecionada',
    placeId: `custom_${Date.now()}`,
    reviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`,
  };
};

/**
 * Saves a Google business entry in Firestore
 */
export const saveGoogleBusiness = async (
  userId: string,
  data: {
    businessName: string;
    address: string;
    placeId: string;
    reviewUrl: string;
    qrCodeId?: string;
  }
): Promise<GoogleBusinessItem> => {
  const colRef = collection(db, 'googleBusinesses');
  const newDoc = doc(colRef);
  const now = new Date().toISOString();

  const item: GoogleBusinessItem = {
    id: newDoc.id,
    userId,
    businessName: data.businessName.trim(),
    address: data.address.trim(),
    placeId: data.placeId,
    reviewUrl: data.reviewUrl,
    qrCodeId: data.qrCodeId || '',
    createdAt: now,
  };

  await setDoc(newDoc, item);
  return item;
};

/**
 * Deletes a Google business entry from Firestore
 */
export const deleteGoogleBusiness = async (businessId: string): Promise<void> => {
  const docRef = doc(db, 'googleBusinesses', businessId);
  await deleteDoc(docRef);
};

/**
 * Subscribes to user's saved Google businesses
 */
export const subscribeUserGoogleBusinesses = (
  userId: string,
  callback: (items: GoogleBusinessItem[]) => void
) => {
  const q = query(
    collection(db, 'googleBusinesses'),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const items: GoogleBusinessItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as GoogleBusinessItem);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(items);
  });
};
