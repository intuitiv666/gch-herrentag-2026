export interface SpieltagErgebnis {
  id?: string;
  spieltag: number;
  datum: string;
  klasse: string;
  sonderpreis?: string;
  bahn?: number;
  spieler: string;
  hcp?: number;
  club: string;
  punkte?: number;
  distanz?: string;
}

export interface EinzelErgebnis {
  spieltag: number;
  datum: string;
  punkte: number;
}

export interface Jahreswertung {
  spieler: string;
  club?: string;
  hcp: number;
  spiele: number;
  spieleGewertet: number;
  punkteGesamt: number;
  punkteSchnitt: number;
  fjSwing: number;
  srSwing: number;
  htSwing: number;
  rang: number;
  einzelErgebnisse: EinzelErgebnis[];
}

export interface Turnier {
  id?: string;
  spieltag: number;
  datum: string;
  name: string;
  startzeit: string;
  sponsor?: string;
  bericht?: string;
}

export interface Tagessponsor {
  id: string;
  name: string;
  logoUrl?: string;
  url?: string;
}

export interface Birdie {
  id?: string;
  spieltag: number;
  datum: string;
  spieler: string;
  loch: number;
}
