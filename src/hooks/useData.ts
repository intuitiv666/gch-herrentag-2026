import { useState, useCallback, useMemo, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import type { SpieltagErgebnis, Jahreswertung, Turnier, Tagessponsor, Birdie } from '@/types';

// Separate Collections für Damentag (getrennt von Herrentag)
const COLLECTIONS = {
  ERGEBNISSE: 'ergebnisse',
  KALENDER: 'kalender',
  SPONSOREN: 'sponsoren',
  LOGOS: 'logos',
  BIRDIES: 'birdies'
};

export function useData() {
  const [ergebnisse, setErgebnisse] = useState<SpieltagErgebnis[]>([]);
  const [kalender, setKalender] = useState<Turnier[]>([]);
  const [sponsoren, setSponsoren] = useState<Tagessponsor[]>([]);
  const [sponsorLogos, setSponsorLogos] = useState<Record<string, string>>({});
  const [birdies, setBirdies] = useState<Birdie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const ergebnisseQuery = query(collection(db, COLLECTIONS.ERGEBNISSE));
    const unsubscribeErgebnisse = onSnapshot(ergebnisseQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpieltagErgebnis));
      setErgebnisse(data);
    });

    const kalenderQuery = query(collection(db, COLLECTIONS.KALENDER));
    const unsubscribeKalender = onSnapshot(kalenderQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Turnier));
      const sortedData = data.sort((a, b) => {
        const parseDate = (datumStr: string): number => {
          const parts = datumStr.trim().split('.');
          if (parts.length !== 3) return 0;
          const tag = parseInt(parts[0], 10);
          const monat = parseInt(parts[1], 10) - 1;
          const jahr = parseInt(parts[2], 10);
          if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return 0;
          return new Date(jahr, monat, tag).getTime();
        };
        return parseDate(a.datum) - parseDate(b.datum);
      });
      setKalender(sortedData);
      setLoading(false);
    });

    const sponsorenQuery = query(collection(db, COLLECTIONS.SPONSOREN));
    const unsubscribeSponsoren = onSnapshot(sponsorenQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tagessponsor));
      setSponsoren(data);
    });

    const logosQuery = query(collection(db, COLLECTIONS.LOGOS));
    const unsubscribeLogos = onSnapshot(logosQuery, (snapshot) => {
      const logos: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        logos[doc.id] = doc.data().url;
      });
      setSponsorLogos(logos);
    });

    const birdiesQuery = query(collection(db, COLLECTIONS.BIRDIES));
    const unsubscribeBirdies = onSnapshot(birdiesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Birdie));
      setBirdies(data);
    });

    return () => {
      unsubscribeErgebnisse();
      unsubscribeKalender();
      unsubscribeSponsoren();
      unsubscribeLogos();
      unsubscribeBirdies();
    };
  }, []);

  const getBruttoWertung = useCallback((spieltagNum: number) => {
    return ergebnisse
      .filter(e => e.spieltag === spieltagNum && e.klasse?.toLowerCase() === 'brutto')
      .sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
  }, [ergebnisse]);

  const getNettoAWertung = useCallback((spieltagNum: number) => {
    return ergebnisse
      .filter(e => e.spieltag === spieltagNum && e.klasse?.toLowerCase() === 'netto a')
      .sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
  }, [ergebnisse]);

  const getNettoBWertung = useCallback((spieltagNum: number) => {
    return ergebnisse
      .filter(e => e.spieltag === spieltagNum && e.klasse?.toLowerCase() === 'netto b')
      .sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
  }, [ergebnisse]);

  const getSonderpreise = useCallback((spieltagNum: number) => {
    const sonderpreise = ergebnisse.filter(e => {
      const kl = e.klasse?.toLowerCase() || '';
      return e.spieltag === spieltagNum && (kl.includes('longest') || kl.includes('nearest') || kl.includes('pin'));
    });
    const longestDrive = sonderpreise.find(e => (e.klasse?.toLowerCase() || '').includes('longest'));
    const nearestPin = sonderpreise.find(e => { const k = e.klasse?.toLowerCase() || ''; return k.includes('nearest') && !k.includes('2.'); });
    const nearestPin2Schlag = sonderpreise.find(e => { const k = e.klasse?.toLowerCase() || ''; return k.includes('nearest') && k.includes('2.'); });
    return { longestDrive, nearestPin, nearestPin2Schlag };
  }, [ergebnisse]);

  // Helfer: HCP sicher als Zahl extrahieren (Firestore kann Strings liefern)
  // Korrigiert auch offensichtlich falsche Werte (> 54), wo das Dezimalzeichen verloren ging
  const parseHcp = useCallback((hcp: any): number => {
    if (hcp === undefined || hcp === null) return 0;
    let num: number;
    if (typeof hcp === 'number') {
      num = hcp;
    } else if (typeof hcp === 'string') {
      const cleaned = hcp.replace(',', '.').trim();
      num = parseFloat(cleaned);
      if (isNaN(num)) return 0;
    } else {
      return 0;
    }
    // Offensichtlich falsche Werte korrigieren: 157 → 15.7, 166 → 16.6
    if (num > 54 && num < 1000) {
      const corrected = num / 10;
      if (corrected >= -10 && corrected <= 54) {
        return Math.round(corrected * 10) / 10;
      }
    }
    return num;
  }, []);

  // Hilfsfunktion: Datum-String (DD.MM.YYYY) zu Timestamp
  const parseDatum = useCallback((datumStr: string): number => {
    const parts = datumStr.split('.');
    if (parts.length !== 3) return 0;
    const [tag, monat, jahr] = parts.map(Number);
    if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return 0;
    return new Date(jahr, monat - 1, tag).getTime();
  }, []);

  // Hilfsfunktion: Beste N Ergebnisse in Datumsbereich
  const calcSwing = useCallback((
    einzelErgebnisse: { punkte: number; spieltag: number; datum: string }[],
    anzahl: number,
    vonDatum: string,
    bisDatum: string
  ): number => {
    const vonTs = parseDatum(vonDatum);
    const bisTs = parseDatum(bisDatum);
    const imZeitraum = einzelErgebnisse.filter(e => {
      const eTs = parseDatum(e.datum);
      return eTs >= vonTs && eTs <= bisTs;
    });
    const bestN = imZeitraum.sort((a, b) => b.punkte - a.punkte).slice(0, anzahl);
    return bestN.reduce((sum, e) => sum + e.punkte, 0);
  }, [parseDatum]);

  const jahreswertungBrutto = useMemo((): Jahreswertung[] => {
    // Sammle ALLE Ergebnisse pro Spieler
    const spielerErgebnisse = new Map<string, { punkte: number; spieltag: number; datum: string }[]>();
    // Sammle HCP pro Spieler pro Spieltag
    const spielerHcpProSpieltag = new Map<string, Map<number, number>>();

    ergebnisse
      .filter(e => e.klasse?.toLowerCase() === 'brutto')
      .forEach(e => {
        const hcpNum = parseHcp(e.hcp);
        // Ergebnisse sammeln
        const existing = spielerErgebnisse.get(e.spieler);
        const eintrag = { punkte: e.punkte || 0, spieltag: e.spieltag, datum: e.datum };
        if (existing) {
          existing.push(eintrag);
        } else {
          spielerErgebnisse.set(e.spieler, [eintrag]);
        }
        // HCP pro Spieltag speichern (jede gültige Zahl akzeptieren, inkl. negativer Plus-Handicaps und 0)
        if (e.hcp !== undefined && e.hcp !== null) {
          let hcpMap = spielerHcpProSpieltag.get(e.spieler);
          if (!hcpMap) {
            hcpMap = new Map<number, number>();
            spielerHcpProSpieltag.set(e.spieler, hcpMap);
          }
          hcpMap.set(e.spieltag, hcpNum);
        }
      });

    return Array.from(spielerErgebnisse.entries()).map(([spieler, einzelErgebnisse]) => {
      // HCP vom höchsten (letzten) Spieltag nehmen
      const hcpMap = spielerHcpProSpieltag.get(spieler);
      let hcp = 0;
      if (hcpMap && hcpMap.size > 0) {
        const maxSpieltag = Math.max(...hcpMap.keys());
        hcp = hcpMap.get(maxSpieltag) || 0;
      }
      const sortedErgebnisse = einzelErgebnisse.sort((a, b) => a.punkte - b.punkte);
      const bottom12 = sortedErgebnisse.slice(0, 12);
      const summeBottom12 = bottom12.reduce((sum, e) => sum + e.punkte, 0);
      // Swing-Berechnungen basierend auf Datum
      const fjSwing = calcSwing(einzelErgebnisse, 6, '01.04.2026', '11.06.2026');
      const srSwing = calcSwing(einzelErgebnisse, 6, '11.06.2026', '13.08.2026');
      const htSwing = calcSwing(einzelErgebnisse, 6, '14.08.2026', '08.10.2026');
      return {
        spieler,
        hcp,
        punkteGesamt: summeBottom12,
        punkteSchnitt: einzelErgebnisse.length > 0 ? summeBottom12 / Math.min(12, einzelErgebnisse.length) : 0,
        fjSwing,
        srSwing,
        htSwing,
        spiele: einzelErgebnisse.length,
        spieleGewertet: Math.min(12, einzelErgebnisse.length),
        einzelErgebnisse: sortedErgebnisse,
        rang: 0
      };
    }).sort((a, b) => b.punkteGesamt - a.punkteGesamt).map((item, index) => ({ ...item, rang: index + 1 }));
  }, [ergebnisse, parseHcp, calcSwing]);

  const jahreswertungNetto = useMemo((): Jahreswertung[] => {
    // Sammle ALLE Ergebnisse pro Spieler
    const spielerErgebnisse = new Map<string, { punkte: number; spieltag: number; datum: string }[]>();
    // Sammle HCP pro Spieler pro Spieltag
    const spielerHcpProSpieltag = new Map<string, Map<number, number>>();

    ergebnisse
      .filter(e => { const kl = e.klasse?.toLowerCase() || ''; return kl === 'netto a' || kl === 'netto b'; })
      .forEach(e => {
        const hcpNum = parseHcp(e.hcp);
        // Ergebnisse sammeln
        const existing = spielerErgebnisse.get(e.spieler);
        const eintrag = { punkte: e.punkte || 0, spieltag: e.spieltag, datum: e.datum };
        if (existing) {
          existing.push(eintrag);
        } else {
          spielerErgebnisse.set(e.spieler, [eintrag]);
        }
        // HCP pro Spieltag speichern (jede gültige Zahl akzeptieren, inkl. negativer Plus-Handicaps und 0)
        if (e.hcp !== undefined && e.hcp !== null) {
          let hcpMap = spielerHcpProSpieltag.get(e.spieler);
          if (!hcpMap) {
            hcpMap = new Map<number, number>();
            spielerHcpProSpieltag.set(e.spieler, hcpMap);
          }
          hcpMap.set(e.spieltag, hcpNum);
        }
      });

    return Array.from(spielerErgebnisse.entries()).map(([spieler, einzelErgebnisse]) => {
      // HCP vom höchsten (letzten) Spieltag nehmen
      const hcpMap = spielerHcpProSpieltag.get(spieler);
      let hcp = 0;
      if (hcpMap && hcpMap.size > 0) {
        const maxSpieltag = Math.max(...hcpMap.keys());
        hcp = hcpMap.get(maxSpieltag) || 0;
      }
      const sortedErgebnisse = einzelErgebnisse.sort((a, b) => a.punkte - b.punkte);
      const bottom12 = sortedErgebnisse.slice(0, 12);
      const summeBottom12 = bottom12.reduce((sum, e) => sum + e.punkte, 0);
      // Swing-Berechnungen basierend auf Datum
      const fjSwing = calcSwing(einzelErgebnisse, 6, '01.04.2026', '11.06.2026');
      const srSwing = calcSwing(einzelErgebnisse, 6, '11.06.2026', '13.08.2026');
      const htSwing = calcSwing(einzelErgebnisse, 6, '14.08.2026', '08.10.2026');
      return {
        spieler,
        hcp,
        punkteGesamt: summeBottom12,
        punkteSchnitt: einzelErgebnisse.length > 0 ? summeBottom12 / Math.min(12, einzelErgebnisse.length) : 0,
        fjSwing,
        srSwing,
        htSwing,
        spiele: einzelErgebnisse.length,
        spieleGewertet: Math.min(12, einzelErgebnisse.length),
        einzelErgebnisse: sortedErgebnisse,
        rang: 0
      };
    }).sort((a, b) => b.punkteGesamt - a.punkteGesamt).map((item, index) => ({ ...item, rang: index + 1 }));
  }, [ergebnisse, parseHcp, calcSwing]);

  const addErgebnis = useCallback(async (ergebnis: Omit<SpieltagErgebnis, 'id'>) => { const newId = `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; await setDoc(doc(db, COLLECTIONS.ERGEBNISSE, newId), ergebnis); }, []);
  const updateErgebnis = useCallback(async (id: string, updates: Partial<SpieltagErgebnis>) => { await setDoc(doc(db, COLLECTIONS.ERGEBNISSE, id), updates, { merge: true }); }, []);
  const deleteErgebnis = useCallback(async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.ERGEBNISSE, id)); }, []);
  const deleteAllErgebnisse = useCallback(async () => {
    const batch = writeBatch(db);
    ergebnisse.forEach(e => { if (e.id) batch.delete(doc(db, COLLECTIONS.ERGEBNISSE, e.id)); });
    await batch.commit();
  }, [ergebnisse]);
  const saveBericht = useCallback(async (spieltag: number, bericht: string): Promise<{ success: boolean; error?: string }> => {
    try { const kalenderDoc = kalender.find(k => k.spieltag === spieltag); if (!kalenderDoc) return { success: false, error: `Kein Kalendereintrag für Spieltag ${spieltag}` }; if (!kalenderDoc.id) return { success: false, error: 'Kalendereintrag hat keine ID' }; await setDoc(doc(db, COLLECTIONS.KALENDER, kalenderDoc.id), { bericht }, { merge: true }); return { success: true }; } catch (err: any) { return { success: false, error: err.message }; }
  }, [kalender]);
  const addKalender = useCallback(async (turnier: Omit<Turnier, 'id'>) => { const newId = `k_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; await setDoc(doc(db, COLLECTIONS.KALENDER, newId), turnier); }, []);
  const updateKalender = useCallback(async (id: string, updates: Partial<Turnier>) => { await setDoc(doc(db, COLLECTIONS.KALENDER, id), updates, { merge: true }); }, []);
  const deleteKalender = useCallback(async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.KALENDER, id)); }, []);
  const addSponsor = useCallback(async (sponsor: Omit<Tagessponsor, 'id'>) => { const newId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; await setDoc(doc(db, COLLECTIONS.SPONSOREN, newId), sponsor); }, []);
  const updateSponsor = useCallback(async (id: string, updates: Partial<Tagessponsor>) => { await setDoc(doc(db, COLLECTIONS.SPONSOREN, id), updates, { merge: true }); }, []);
  const deleteSponsor = useCallback(async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.SPONSOREN, id)); }, []);
  const saveSponsorLogo = useCallback(async (sponsorName: string, logoUrl: string) => { await setDoc(doc(db, COLLECTIONS.LOGOS, sponsorName), { url: logoUrl }); }, []);
  const addBirdie = useCallback(async (birdie: Omit<Birdie, 'id'>) => { const newDoc = doc(collection(db, COLLECTIONS.BIRDIES)); await setDoc(newDoc, birdie); return newDoc.id; }, []);
  const updateBirdie = useCallback(async (id: string, birdie: Partial<Birdie>) => { await setDoc(doc(db, COLLECTIONS.BIRDIES, id), birdie, { merge: true }); }, []);
  const deleteBirdie = useCallback(async (id: string) => { await deleteDoc(doc(db, COLLECTIONS.BIRDIES, id)); }, []);
  const deleteAllBirdies = useCallback(async () => {
    const batch = writeBatch(db);
    birdies.forEach(b => { if (b.id) batch.delete(doc(db, COLLECTIONS.BIRDIES, b.id)); });
    await batch.commit();
  }, [birdies]);
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => { if (file.size > 500 * 1024) { reject(new Error('Datei zu gross (max. 500KB)')); return; } const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
  }, []);

  return { ergebnisse, kalender, sponsoren, sponsorLogos, birdies, loading, jahreswertungBrutto, jahreswertungNetto, getBruttoWertung, getNettoAWertung, getNettoBWertung, getSonderpreise, addErgebnis, updateErgebnis, deleteErgebnis, deleteAllErgebnisse, saveBericht, addKalender, updateKalender, deleteKalender, addSponsor, updateSponsor, deleteSponsor, saveSponsorLogo, fileToBase64, addBirdie, updateBirdie, deleteBirdie, deleteAllBirdies };
}
