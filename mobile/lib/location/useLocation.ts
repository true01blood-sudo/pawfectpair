/**
 * Hook pentru geolocație — folosește expo-location.
 * Oferă locația curentă, permisiuni, și distanțe pentru harta pet-friendly.
 * Conform cerinței de geolocație (PetGuardian + Maps).
 */
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface PetPlace {
  id: string;
  name: string;
  type: 'vet' | 'shop' | 'shelter' | 'trainer';
  /** Lipsește pentru surse fără coordonate reale (ex: vets) — nu poate apărea ca pin pe hartă. */
  coords?: Coords;
  address?: string;
  phone?: string;
  website?: string;
  isOpen?: boolean;
  rating?: number;
  // distanță în km față de locația curentă (calculată la runtime)
  distance?: number;
}

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

export function useLocation() {
  const [status, setStatus] = useState<PermissionStatus>('checking');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setStatus('checking');
    try {
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        setStatus('denied');
        setError('Permisiune locație refuzată');
        return false;
      }
      setStatus('granted');
      return true;
    } catch (e: any) {
      setStatus('denied');
      setError(e?.message ?? 'Eroare permisiune locație');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Coords | null> => {
    const granted = await requestPermission();
    if (!granted) return null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCoords(c);
      return c;
    } catch (e: any) {
      setError(e?.message ?? 'Nu am putut obține locația');
      return null;
    }
  }, [requestPermission]);

  // Watch continuous (pentru live tracking în PetGuardian)
  const startWatching = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return null;
    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,    // 5 secunde — mod live (PetGuardian)
        distanceInterval: 5,   // 5 metri
      },
      (loc) => setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
    );
  }, [requestPermission]);

  useEffect(() => {
    // La mount, verificăm starea permisiunii
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setStatus(status === 'granted' ? 'granted' : status === 'undetermined' ? 'undetermined' : 'denied');
    }).catch(() => setStatus('undetermined'));
  }, []);

  return {
    status,
    coords,
    error,
    requestPermission,
    getCurrentLocation,
    startWatching,
  };
}

/** Calculează distanța în km între 2 coordonate (Haversine) */
export function calcDistanceKm(a: Coords, b: Coords): number {
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Sortează locuri pet-friendly după distanță față de o coordonată (cele fără coords rămân la final) */
export function sortByDistance<T extends PetPlace>(places: T[], from: Coords): T[] {
  return places
    .map((p) => (p.coords ? { ...p, distance: calcDistanceKm(from, p.coords) } : p))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
}
