import { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '@/hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, Clock, MapPin, TrendingUp, Target, ChevronLeft, ChevronRight, FileText, Download, Database, Menu, X, Award, CheckCircle, Edit, Trash2, Save, Search, Plus, BarChart3, User, Cloud, CloudRain, Sun, Snowflake, Wind, ArrowLeft, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Jahreswertung, SpieltagErgebnis, Turnier } from '@/types';
import type { Birdie } from '@/types';

function PerformanceTab({ ergebnisse, birdies }: { ergebnisse: SpieltagErgebnis[]; birdies: Birdie[] }) {
  const [showAllBrutto, setShowAllBrutto] = useState(false);
  const [showAllNetto, setShowAllNetto] = useState(false);
  const [showAllBirdiesTop, setShowAllBirdiesTop] = useState(false);

  const uniqueSpieler = new Set(ergebnisse.map(e => e.spieler));
  const gastspieler = ergebnisse.filter(e => {
    const club = (e.club || '').toLowerCase();
    return !club.includes('hünxerwald') && !club.includes('gch') && club !== '';
  });
  const uniqueGast = new Set(gastspieler.map(e => e.spieler));
  const bruttoSum = ergebnisse.filter(e => e.klasse === 'Brutto').reduce((s, e) => s + (e.punkte || 0), 0);
  const nettoSum = ergebnisse.filter(e => e.klasse === 'Netto A' || e.klasse === 'Netto B').reduce((s, e) => s + (e.punkte || 0), 0);
  const birdieCount = birdies.length;

  const getBahn = (e: any): string => {
    if (e.bahn !== undefined && e.bahn !== null && e.bahn !== '') {
      const n = typeof e.bahn === 'number' ? e.bahn : parseInt(String(e.bahn));
      if (!isNaN(n) && n > 0) return String(n);
    }
    if (e.sonderpreis) {
      const m = String(e.sonderpreis).match(/(?:loch|bahn|hole)\s*(\d+)/i);
      if (m) return m[1];
    }
    return '-';
  };

  const longestDrives = ergebnisse.filter(e => e.klasse === 'Longest Drive' && e.distanz);
  const longestDrive = longestDrives.length > 0
    ? longestDrives.reduce((max, e) => {
        const d = parseFloat(String(e.distanz).replace(',', '.')) || 0;
        return d > max.d ? { name: e.spieler, d, spieltag: String(e.spieltag), bahn: getBahn(e) } : max;
      }, { name: '-', d: 0, spieltag: '-', bahn: '-' })
    : { name: '-', d: 0, spieltag: '-', bahn: '-' };

  const nearestPins = ergebnisse.filter(e => e.klasse === 'Nearest to the Pin' && e.distanz);
  const nearestPin = nearestPins.length > 0
    ? nearestPins.reduce((min, e) => {
        const d = parseFloat(String(e.distanz).replace(',', '.')) || 9999;
        return d < min.d ? { name: e.spieler, d, spieltag: String(e.spieltag), bahn: getBahn(e) } : min;
      }, { name: '-', d: 9999, spieltag: '-', bahn: '-' })
    : { name: '-', d: 0, spieltag: '-', bahn: '-' };

  const spielerProSpieltag = new Map<number, Set<string>>();
  ergebnisse.filter(e => e.klasse === 'Brutto').forEach(e => {
    if (!spielerProSpieltag.has(e.spieltag)) spielerProSpieltag.set(e.spieltag, new Set());
    spielerProSpieltag.get(e.spieltag)!.add(e.spieler);
  });
  const bruttoSpielerGesamt = Array.from(spielerProSpieltag.values()).reduce((sum, set) => sum + set.size, 0);

  const bruttoList = ergebnisse.filter(e => e.klasse === 'Brutto').sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
  const nettoList = ergebnisse.filter(e => e.klasse === 'Netto A' || e.klasse === 'Netto B').sort((a, b) => (b.punkte || 0) - (a.punkte || 0));

  const birdieCounts: Record<string, number> = {};
  birdies.forEach((b: any) => { birdieCounts[b.spieler] = (birdieCounts[b.spieler] || 0) + 1; });
  const sortedBirdies = Object.entries(birdieCounts).map(([spieler, count]) => ({ spieler, count })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance</h2>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Teilnehmer</p>
            <p className="text-3xl font-bold text-[#1a472a]">{uniqueSpieler.size}</p>
            <p className="text-xs text-gray-400">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Gastspieler</p>
            <p className="text-3xl font-bold text-blue-600">{uniqueGast.size}</p>
            <p className="text-xs text-gray-400">Andere Clubs</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Brutto</p>
            <p className="text-3xl font-bold text-[#1a472a]">{bruttoSum}</p>
            <p className="text-xs text-gray-400">Summe Punkte</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Netto</p>
            <p className="text-3xl font-bold text-purple-600">{nettoSum}</p>
            <p className="text-xs text-gray-400">Summe Punkte</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Birdies</p>
            <p className="text-3xl font-bold text-green-600">{birdieCount}</p>
            <p className="text-xs text-gray-400">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Longest Drive</p>
            <p className="text-3xl font-bold text-orange-600">{longestDrive.d > 0 ? longestDrive.d + 'm' : '-'}</p>
            <p className="text-xs text-gray-600 font-medium">{longestDrive.name}</p>
            <p className="text-xs text-gray-400">ST {longestDrive.spieltag}{longestDrive.bahn !== '-' ? ` | Bahn ${longestDrive.bahn}` : ''}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Nearest to Pin</p>
            <p className="text-3xl font-bold text-red-600">{nearestPin.d > 0 && nearestPin.d < 9999 ? nearestPin.d + 'm' : '-'}</p>
            <p className="text-xs text-gray-600 font-medium">{nearestPin.name}</p>
            <p className="text-xs text-gray-400">ST {nearestPin.spieltag}{nearestPin.bahn !== '-' ? ` | Bahn ${nearestPin.bahn}` : ''}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 uppercase">Spieler Gesamt</p>
            <p className="text-3xl font-bold text-[#1a472a]">{bruttoSpielerGesamt}</p>
            <p className="text-xs text-gray-400">Klasse Brutto</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Listen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-green-600" />Top {showAllBrutto ? '10' : '5'} Brutto-Punkte</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {bruttoList.slice(0, showAllBrutto ? 10 : 5).map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#1a472a] text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <span className="font-medium">{e.spieler}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Spieltag {e.spieltag}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#1a472a] w-8 text-right">{e.punkte}</span>
              </div>
            ))}
            {bruttoList.length > 5 && (
              <button onClick={() => setShowAllBrutto(!showAllBrutto)} className="w-full mt-2 py-2 text-sm text-[#1a472a] hover:bg-green-50 rounded-lg transition-colors font-medium">
                {showAllBrutto ? 'Nur Top 5 zeigen' : `Alle ${bruttoList.length} zeigen`}
              </button>
            )}
            {bruttoList.length === 0 && <p className="text-gray-500 text-center py-4">Noch keine Brutto-Ergebnisse.</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-purple-600" />Top {showAllNetto ? '10' : '5'} Netto-Punkte</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {nettoList.slice(0, showAllNetto ? 10 : 5).map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div>
                    <span className="font-medium">{e.spieler}</span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Spieltag {e.spieltag}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-purple-600 w-8 text-right">{e.punkte}</span>
              </div>
            ))}
            {nettoList.length > 5 && (
              <button onClick={() => setShowAllNetto(!showAllNetto)} className="w-full mt-2 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium">
                {showAllNetto ? 'Nur Top 5 zeigen' : `Alle ${nettoList.length} zeigen`}
              </button>
            )}
            {nettoList.length === 0 && <p className="text-gray-500 text-center py-4">Noch keine Netto-Ergebnisse.</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-green-600" />Top {showAllBirdiesTop ? '10' : '5'} Birdies</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {(() => {
              const displayList = sortedBirdies.slice(0, showAllBirdiesTop ? 10 : 5);
              return <>
                {displayList.length > 0 ? displayList.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="font-medium">{e.spieler}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 w-8 text-right">{e.count}</span>
                  </div>
                )) : <p className="text-gray-500 text-center py-4">Noch keine Birdies vorhanden.</p>}
                {sortedBirdies.length > 5 && (
                  <button onClick={() => setShowAllBirdiesTop(!showAllBirdiesTop)} className="w-full mt-2 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium">
                    {showAllBirdiesTop ? 'Nur Top 5 zeigen' : `Alle ${sortedBirdies.length} zeigen`}
                  </button>
                )}
              </>;
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('startseite');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSpieltag, setSelectedSpieltag] = useState<number>(1);
  const [selectedBerichtMenuSpieltag, setSelectedBerichtMenuSpieltag] = useState<number | null>(null);
  const [showFullResults, setShowFullResults] = useState({ spieltagBrutto: false, spieltagNettoA: false, spieltagNettoB: false });
  const [jahreswertungTab, setJahreswertungTab] = useState<'brutto' | 'netto'>('brutto');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTab, setAdminTab] = useState<'ergebnisse' | 'kalender' | 'sponsoren' | 'berichte'>('ergebnisse');
  const [selectedBerichtSpieltag, setSelectedBerichtSpieltag] = useState<number>(1);
  const [berichtText, setBerichtText] = useState('');
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<string | null>(null);

  const {
    ergebnisse, kalender, sponsoren, sponsorLogos, loading,
    jahreswertungBrutto, jahreswertungNetto,
    getBruttoWertung, getNettoAWertung, getNettoBWertung, getSonderpreise,
    addErgebnis, updateErgebnis, deleteErgebnis,
    saveBericht, addKalender, updateKalender, deleteKalender,
    addSponsor, updateSponsor, deleteSponsor, saveSponsorLogo, fileToBase64,
    birdies,
  } = useData();


  // Hilfsfunktion: Logo-URL für einen Sponsor finden (prüft logos-Collection UND sponsor.logoUrl)
  const getSponsorLogoUrl = useMemo(() => {
    return (sponsorName: string): string | null => {
      if (!sponsorName) return null;
      // 1. Prüfe die logos Collection
      if (sponsorLogos[sponsorName]) return sponsorLogos[sponsorName];
      // 2. Prüfe das logoUrl Feld im Sponsor-Dokument
      const sponsorObj = sponsoren.find(s => s.name === sponsorName);
      if (sponsorObj?.logoUrl) return sponsorObj.logoUrl;
      return null;
    };
  }, [sponsorLogos, sponsoren]);

  const spieltage = useMemo(() => {
    const uniqueSpieltage = Array.from(new Set(ergebnisse.map(e => e.spieltag)));
    return uniqueSpieltage.map(st => {
      const firstErgebnis = ergebnisse.find(e => e.spieltag === st);
      return { spieltag: st, datum: firstErgebnis?.datum || '' };
    }).sort((a, b) => a.spieltag - b.spieltag);
  }, [ergebnisse]);

  const nextTurnier = useMemo(() => {
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const kommende = kalender.filter(t => { const [tag, monat, jahr] = t.datum.split('.').map(Number); const terminDatum = new Date(jahr, monat - 1, tag); return terminDatum >= heute; });
    if (kommende.length > 0) return kommende[0];
    if (kalender.length > 0) return kalender[kalender.length - 1];
    return { spieltag: 1, datum: '15.04.2026', name: 'Saisoneröffnung', startzeit: '13:00' };
  }, [kalender]);

  const tageBisTurnier = useMemo(() => {
    if (!nextTurnier) return 0;
    const [tag, monat, jahr] = nextTurnier.datum.split('.').map(Number);
    const turnierDatum = new Date(jahr, monat - 1, tag);
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    return Math.ceil((turnierDatum.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextTurnier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a472a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setActiveTab('startseite')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="./gch-logo.png" alt="GC Hünxerwald" className="h-12 w-12 object-contain" />
              <div className="text-left">
                <h1 className="text-lg font-semibold text-gray-900">Herrentag</h1>
                <p className="text-xs text-gray-500">Golfclub Hünxerwald e.V.</p>
              </div>
            </button>

            <nav className="hidden xl:flex items-center gap-0.5">
              <button onClick={() => setActiveTab('startseite')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'startseite' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Startseite</button>
              <button onClick={() => setActiveTab('kalender')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'kalender' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Kalender</button>
              <button onClick={() => setActiveTab('performance')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'performance' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Performance</button>
              <button onClick={() => setActiveTab('ergebnisse')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'ergebnisse' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Ergebnisse</button>
              <button onClick={() => setActiveTab('berichte')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'berichte' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Berichte</button>
              <button onClick={() => setActiveTab('jahreswertung')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'jahreswertung' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Jahreswertung</button>
              <button onClick={() => setActiveTab('sponsoring')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'sponsoring' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Sponsoring</button>
              <button onClick={() => setActiveTab('wetter')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'wetter' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Wetter</button>
            </nav>

            <button className="xl:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-gray-200">
            <nav className="flex flex-col p-4 space-y-2">
              <button onClick={() => { setActiveTab('startseite'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'startseite' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Startseite</button>
              <button onClick={() => { setActiveTab('kalender'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'kalender' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Kalender</button>
              <button onClick={() => { setActiveTab('performance'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'performance' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Performance</button>
              <button onClick={() => { setActiveTab('ergebnisse'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'ergebnisse' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Ergebnisse</button>
              <button onClick={() => { setActiveTab('berichte'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'berichte' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Berichte</button>
              <button onClick={() => { setActiveTab('jahreswertung'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'jahreswertung' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Jahreswertung</button>
              <button onClick={() => { setActiveTab('sponsoring'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'sponsoring' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Sponsoring</button>
              <button onClick={() => { setActiveTab('wetter'); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'wetter' ? 'bg-[#1a472a] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Wetter</button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STARTSEITE */}
        {activeTab === 'startseite' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl">
              <div className="grid md:grid-cols-2 gap-8 items-stretch">
                <div className="flex flex-col">
                  <Badge className="mb-4 bg-[#1a472a] text-white w-fit"><Clock className="w-3 h-3 mr-1" />Nächster Termin</Badge>
                  <p className="text-xl font-semibold text-[#1a472a] mb-2">XANTI SOLAR Herrencup 2026</p>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{nextTurnier?.name || 'Saisoneröffnung'}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Countdown</p>
                      <p className="text-4xl font-bold text-[#1a472a]">{tageBisTurnier}</p>
                      <p className="text-sm text-gray-600">Tage</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Datum</p>
                      <p className="text-lg font-semibold text-gray-900">{nextTurnier?.datum || '15.04.2026'}</p>
                      <p className="text-sm text-gray-600">Start: {nextTurnier?.startzeit || '13:00'}</p>
                    </div>
                  </div>

                  {/* Wetter-Widget für nächsten Spieltag - klickbar */}
                  <button onClick={() => setActiveTab('wetter')} className="w-full text-left hover:opacity-80 transition-opacity">
                    <WetterWidget datum={nextTurnier?.datum || ''} label={`Wetter Hünxe am ${nextTurnier?.datum || ''}`} />
                  </button>

                  <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1a472a]" />
                      <span className="font-semibold text-[#1a472a]">Anmeldung bis spätestens 10:00 Uhr</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-row items-end justify-center gap-4 flex-wrap self-end">
                  {/* Tagessponsor Logo - LINKS */}
                  {(() => {
                    const termin = kalender.find(t => t.spieltag === nextTurnier?.spieltag);
                    const sponsorName = termin?.sponsor;
                    const sponsorLogo = sponsorName ? getSponsorLogoUrl(sponsorName) : null;
                    const sponsorObj = sponsorName ? sponsoren.find(s => s.name === sponsorName) : null;
                    return sponsorName ? (
                      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 w-[260px] h-[220px] flex flex-col items-center justify-center">
                        <p className="text-xs text-gray-500 text-center mb-2">Tagessponsor</p>
                        {sponsorLogo ? (
                          sponsorObj?.url ? (
                            <a href={sponsorObj.url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                              <img src={sponsorLogo} alt={sponsorName} className="max-h-[160px] w-auto object-contain" />
                            </a>
                          ) : (
                            <img src={sponsorLogo} alt={sponsorName} className="max-h-[160px] w-auto object-contain" />
                          )
                        ) : (
                          <p className="text-lg font-semibold text-[#1a472a] text-center">{sponsorName}</p>
                        )}
                      </div>
                    ) : null;
                  })()}

                  {/* Herrentag Logo - RECHTS */}
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 w-[260px] h-[220px] flex flex-col items-center justify-center">
                    <img src="./herrentag-logo.png" alt="Herrentag Golf Turnier" className="max-h-[200px] w-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button onClick={() => setActiveTab('kalender')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Kalender</p>
              </button>
              <button onClick={() => setActiveTab('performance')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Performance</p>
              </button>
              <button onClick={() => setActiveTab('ergebnisse')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Ergebnisse</p>
              </button>
              <button onClick={() => setActiveTab('berichte')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <FileText className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Berichte</p>
              </button>
              <button onClick={() => setActiveTab('jahreswertung')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <Trophy className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Jahreswertung</p>
              </button>
              <button onClick={() => setActiveTab('sponsoring')} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center">
                <Award className="w-8 h-8 mx-auto mb-3 text-[#1a472a]" />
                <p className="font-medium text-gray-900">Sponsoring</p>
              </button>
            </div>

            {/* Nächste Termine Vorschau - nur zukünftige Termine */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Nächste Termine</h3>
                <button onClick={() => setActiveTab('kalender')} className="text-sm text-[#1a472a] hover:underline font-medium">Alle anzeigen</button>
              </div>
              {(() => {
                const heute = new Date(); heute.setHours(0, 0, 0, 0);
                const kommendeTermine = kalender.filter(t => {
                  const [tag, monat, jahr] = t.datum.split('.').map(Number);
                  const terminDatum = new Date(jahr, monat - 1, tag);
                  return terminDatum >= heute;
                }).slice(0, 3);
                if (kommendeTermine.length === 0) return <p className="text-gray-500 text-center py-4">Keine zukünftigen Termine vorhanden.</p>;
                return (
                  <div className="grid gap-3">
                    {kommendeTermine.map((termin) => (
                      <Card key={termin.id || termin.spieltag} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#1a472a] rounded-xl flex flex-col items-center justify-center text-white">
                              <span className="text-xs opacity-80">{termin.datum.split('.')[1]}.</span>
                              <span className="text-2xl font-bold">{termin.datum.split('.')[0]}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{termin.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {termin.datum}</span>
                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {termin.startzeit}</span>
                              </div>
                            </div>
                            {termin.sponsor && getSponsorLogoUrl(termin.sponsor) && (
                              (() => {
                                const sponsorObj = sponsoren.find(s => s.name === termin.sponsor);
                                const logoUrl = getSponsorLogoUrl(termin.sponsor);
                                const frame = (
                                  <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[90px] h-[70px] cursor-pointer hover:shadow-md transition-all">
                                    <span className="text-[10px] text-gray-400 mb-1">Sponsor</span>
                                    <img src={logoUrl!} alt={termin.sponsor} className="h-10 w-auto object-contain" />
                                  </div>
                                );
                                return sponsorObj?.url ? (
                                  <a href={sponsorObj.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{frame}</a>
                                ) : frame;
                              })()
                            )}
                            {termin.sponsor && !getSponsorLogoUrl(termin.sponsor) && (
                              <span className="text-sm text-[#1a472a] font-medium">{termin.sponsor}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Admin Link am Seitenende */}
            <div className="flex justify-center pt-4 border-t border-gray-200">
              <button onClick={() => setActiveTab('admin')} className="text-sm text-gray-400 hover:text-[#1a472a] transition-colors flex items-center gap-1">
                <Database className="w-4 h-4" />
                Admin-Bereich
              </button>
            </div>
          </div>
        )}

        {/* KALENDER */}
        {activeTab === 'kalender' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Spieltagskalender 2026</h2>
            <div className="grid gap-4">
              {kalender.length === 0 ? (
                <Card className="border-0 shadow-md p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Keine Kalender-Daten vorhanden.</p>
                </Card>
              ) : (
                (() => {
                  const monatsNamen = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                  const gruppiert = new Map<string, typeof kalender>();
                  kalender.forEach(termin => {
                    const parts = termin.datum.split('.');
                    if (parts.length === 3) {
                      const monatIdx = parseInt(parts[1], 10) - 1;
                      const jahr = parts[2];
                      const key = `${monatsNamen[monatIdx] || 'Unbekannt'} ${jahr}`;
                      if (!gruppiert.has(key)) gruppiert.set(key, []);
                      gruppiert.get(key)!.push(termin);
                    } else {
                      if (!gruppiert.has('Sonstige')) gruppiert.set('Sonstige', []);
                      gruppiert.get('Sonstige')!.push(termin);
                    }
                  });
                  return Array.from(gruppiert.entries()).map(([monat, termine]) => (
                    <div key={monat} className="space-y-3">
                      <h3 className="text-lg font-semibold text-[#1a472a] bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">{monat}</h3>
                      {termine.map((termin) => (
                        <Card key={termin.id || termin.spieltag} className="border-0 shadow-md hover:shadow-lg transition-shadow ml-4">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-[#1a472a] rounded-xl flex flex-col items-center justify-center text-white">
                                <span className="text-xs opacity-80">{termin.datum.split('.')[1]}.</span>
                                <span className="text-2xl font-bold">{termin.datum.split('.')[0]}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{termin.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {termin.datum}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {termin.startzeit}</span>
                                </div>
                              </div>
                              {termin.sponsor && getSponsorLogoUrl(termin.sponsor) && (
                                (() => {
                                  const sponsorObj = sponsoren.find(s => s.name === termin.sponsor);
                                  const logoUrl = getSponsorLogoUrl(termin.sponsor);
                                  const frame = (
                                    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-w-[90px] h-[70px] cursor-pointer hover:shadow-md transition-all">
                                      <span className="text-[10px] text-gray-400 mb-1">Sponsor</span>
                                      <img src={logoUrl!} alt={termin.sponsor} className="h-10 w-auto object-contain" />
                                    </div>
                                  );
                                  return sponsorObj?.url ? (
                                    <a href={sponsorObj.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{frame}</a>
                                  ) : frame;
                                })()
                              )}
                              {termin.bericht && (
                                <button onClick={() => { setActiveTab('berichte'); setSelectedBerichtMenuSpieltag(termin.spieltag); }} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                                  <FileText className="w-4 h-4 inline mr-1" />Bericht
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {activeTab === 'performance' && (
          <PerformanceTab ergebnisse={ergebnisse} birdies={birdies} />
        )}

        {/* ERGEBNISSE */}
        {activeTab === 'ergebnisse' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold">Spieltagsergebnisse</h2>
              <div className="flex gap-2">
                <button onClick={() => exportToExcel(ergebnisse, 'Alle_Ergebnisse')} className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-green-50 transition-all flex items-center gap-1"><Download className="w-4 h-4" />Excel Export</button>
              </div>
              {spieltage.length > 1 && (
                <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-2">
                  <button onClick={() => { const idx = spieltage.findIndex(st => st.spieltag === selectedSpieltag); if (idx > 0) setSelectedSpieltag(spieltage[idx - 1].spieltag); }} disabled={spieltage.findIndex(st => st.spieltag === selectedSpieltag) <= 0} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="text-center min-w-[150px]"><p className="text-sm text-gray-500">Spieltag</p><p className="font-bold text-lg">{selectedSpieltag} <span className="text-gray-400 font-normal">von {spieltage.length}</span></p></div>
                  <button onClick={() => { const idx = spieltage.findIndex(st => st.spieltag === selectedSpieltag); if (idx < spieltage.length - 1) setSelectedSpieltag(spieltage[idx + 1].spieltag); }} disabled={spieltage.findIndex(st => st.spieltag === selectedSpieltag) >= spieltage.length - 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
                </div>
              )}
              <select value={selectedSpieltag} onChange={(e) => setSelectedSpieltag(Number(e.target.value))} className="px-4 py-2 rounded-xl border border-gray-200 bg-white">
                {spieltage.map((st) => (<option key={st.spieltag} value={st.spieltag}>Spieltag {st.spieltag} - {st.datum}</option>))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <ErgebnisCard titel="Brutto" farbe="yellow" daten={getBruttoWertung(selectedSpieltag)} showFull={showFullResults.spieltagBrutto} onToggle={() => setShowFullResults(p => ({ ...p, spieltagBrutto: !p.spieltagBrutto }))} />
              <ErgebnisCard titel="Netto A" farbe="gray" daten={getNettoAWertung(selectedSpieltag)} showFull={showFullResults.spieltagNettoA} onToggle={() => setShowFullResults(p => ({ ...p, spieltagNettoA: !p.spieltagNettoA }))} />
              <ErgebnisCard titel="Netto B" farbe="orange" daten={getNettoBWertung(selectedSpieltag)} showFull={showFullResults.spieltagNettoB} onToggle={() => setShowFullResults(p => ({ ...p, spieltagNettoB: !p.spieltagNettoB }))} />
            </div>

            <SonderpreiseCard spieltag={selectedSpieltag} getSonderpreise={getSonderpreise} />
          </div>
        )}

        {/* BERICHTE */}
        {activeTab === 'berichte' && (
          <BerichteTab kalender={kalender} getBruttoWertung={getBruttoWertung} getNettoAWertung={getNettoAWertung} getNettoBWertung={getNettoBWertung} getSonderpreise={getSonderpreise} selectedBerichtMenuSpieltag={selectedBerichtMenuSpieltag} setSelectedBerichtMenuSpieltag={setSelectedBerichtMenuSpieltag} />
        )}

        {/* SPIELER-PROFIL */}
        {selectedPlayerProfile && (
          <SpielerProfil
            spielerName={selectedPlayerProfile}
            ergebnisse={ergebnisse}
            jahreswertungBrutto={jahreswertungBrutto}
            jahreswertungNetto={jahreswertungNetto}
            onBack={() => setSelectedPlayerProfile(null)}
          />
        )}

        {/* JAHRESWERTUNG */}
        {activeTab === 'jahreswertung' && !selectedPlayerProfile && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold">Jahreswertung</h2>
              <div className="flex gap-2">
                <button onClick={() => setJahreswertungTab('brutto')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${jahreswertungTab === 'brutto' ? 'bg-[#1a472a] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>Brutto</button>
                <button onClick={() => setJahreswertungTab('netto')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${jahreswertungTab === 'netto' ? 'bg-[#1a472a] text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>Netto</button>
                <button onClick={() => exportJahreswertungToExcel(jahreswertungTab === 'brutto' ? jahreswertungBrutto : jahreswertungNetto, jahreswertungTab === 'brutto' ? 'Brutto Jahreswertung' : 'Netto Jahreswertung')} className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-green-50 transition-all flex items-center gap-1"><Download className="w-4 h-4" />Excel</button>
              </div>
            </div>
            <MastersLeaderboard key={jahreswertungTab} data={jahreswertungTab === 'brutto' ? jahreswertungBrutto : jahreswertungNetto} titel={jahreswertungTab === 'brutto' ? 'Brutto Jahreswertung' : 'Netto Jahreswertung'} onPlayerClick={setSelectedPlayerProfile} />
          </div>
        )}

        {/* SPONSORING */}
        {activeTab === 'sponsoring' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sponsoring</h2>
            <div className="grid gap-6">
              {sponsoren.length === 0 ? (
                <Card className="border-0 shadow-md p-12 text-center">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Noch keine Sponsoren vorhanden.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {sponsoren.map((s: any) => (
                    <Card key={s.id} className="border-0 shadow-lg overflow-hidden">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="h-32 flex items-center justify-center mb-4 bg-gray-50 rounded-xl p-4 w-full">
                          {(() => {
                            const logoUrl = getSponsorLogoUrl(s.name);
                            return logoUrl ? (
                              s.url ? (
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="h-full flex items-center justify-center hover:opacity-80 transition-opacity">
                                  <img src={logoUrl} alt={s.name} className="h-full w-auto object-contain" />
                                </a>
                              ) : (
                                <img src={logoUrl} alt={s.name} className="h-full w-auto object-contain" />
                              )
                            ) : (
                              <div className="text-gray-400 text-sm">Kein Logo</div>
                            );
                          })()}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{s.name}</h3>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{s.url.replace(/^https?:\/\//, '')}</a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WETTER */}
        {activeTab === 'wetter' && (
          <WetterDetailPage datum={nextTurnier?.datum || ''} />
        )}

        {/* ADMIN */}
        {activeTab === 'admin' && (
          <AdminTab isAdminAuthenticated={isAdminAuthenticated} setIsAdminAuthenticated={setIsAdminAuthenticated} adminPassword={adminPassword} setAdminPassword={setAdminPassword} adminTab={adminTab} setAdminTab={setAdminTab} ergebnisse={ergebnisse} kalender={kalender} sponsoren={sponsoren} addErgebnis={addErgebnis} updateErgebnis={updateErgebnis} deleteErgebnis={deleteErgebnis} saveBericht={saveBericht} addKalender={addKalender} updateKalender={updateKalender} deleteKalender={deleteKalender} addSponsor={addSponsor} updateSponsor={updateSponsor} deleteSponsor={deleteSponsor} saveSponsorLogo={saveSponsorLogo} sponsorLogos={sponsorLogos} selectedBerichtSpieltag={selectedBerichtSpieltag} setSelectedBerichtSpieltag={setSelectedBerichtSpieltag} berichtText={berichtText} setBerichtText={setBerichtText} fileToBase64={fileToBase64} />
        )}
      </main>
    </div>
  );
}

// ==================== HILFSFUNKTIONEN ====================

function getWetterIcon(code: number, size: 'sm' | 'md' | 'lg' = 'md') {
  const s = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  if (code === 0 || code === 1) return <Sun className={`${s} text-yellow-500`} />;
  if (code === 2 || code === 3) return <Cloud className={`${s} text-gray-400`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${s} text-blue-500`} />;
  if (code >= 71 && code <= 77) return <Snowflake className={`${s} text-blue-300`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${s} text-blue-600`} />;
  if (code >= 95) return <Wind className={`${s} text-gray-500`} />;
  return <Cloud className={`${s} text-gray-400`} />;
}

function WetterWidget({ datum, compact, label }: { datum: string; compact?: boolean; label?: string }) {
  const [wetter, setWetter] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!datum || datum.length < 8) return;
    const parts = datum.split('.');
    if (parts.length !== 3) return;
    const [tag, monat, jahr] = parts.map(Number);
    if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return;

    const terminDatum = new Date(jahr, monat - 1, tag);
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    setLoading(true);
    const fetchWetter = async () => {
      try {
        const isoDatum = `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
        let url: string;
        if (terminDatum >= heute) {
          // Stündliche Vorhersage für 13 Uhr (Spielstart)
          url = `https://api.open-meteo.com/v1/forecast?latitude=51.6424&longitude=6.7717&start_date=${isoDatum}&end_date=${isoDatum}&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m&timezone=Europe/Berlin`;
        } else {
          url = `https://archive-api.open-meteo.com/v1/archive?latitude=51.6424&longitude=6.7717&start_date=${isoDatum}&end_date=${isoDatum}&hourly=temperature_2m,weathercode,precipitation,windspeed_10m&timezone=Europe/Berlin`;
        }
        const res = await fetch(url);
        if (!res.ok) { setWetter(null); setLoading(false); return; }
        const data = await res.json();
        if (data.hourly) {
          // Index für 13:00 Uhr
          const idx13 = data.hourly.time.findIndex((t: string) => t.includes('T13:00'));
          const idx = idx13 >= 0 ? idx13 : 13;
          setWetter({
            temp: data.hourly.temperature_2m?.[idx],
            tempMin: data.hourly.temperature_2m?.[idx] != null ? data.hourly.temperature_2m[idx] - 5 : null,
            precipProb: data.hourly.precipitation_probability?.[idx] ?? (data.hourly.precipitation?.[idx] > 0 ? 100 : 0),
            windSpeed: data.hourly.windspeed_10m?.[idx],
            code: data.hourly.weathercode?.[idx],
            stunde: 13
          });
        }
      } catch (e) { setWetter(null); }
      setLoading(false);
    };
    fetchWetter();
  }, [datum]);

  if (loading) return <div className="text-xs text-gray-400 py-1">Wetter wird geladen...</div>;
  if (!wetter || wetter.temp == null) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getWetterIcon(wetter.code, 'sm')}
        <span className="font-semibold">{Math.round(wetter.temp)}°C</span>
        {wetter.precipProb > 20 && <span className="text-blue-500 text-xs">({wetter.precipProb}%)</span>}
      </div>
    );
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 shadow-sm border border-blue-100">
      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
        <MapPin className="w-3 h-3" />{label || 'Wetter Hünxe'} <span className="text-blue-400 font-normal">(13:00 Uhr)</span>
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWetterIcon(wetter.code)}
          <div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(wetter.temp)}°C</p>
          </div>
        </div>
        <div className="text-right space-y-1">
          {wetter.precipProb > 0 && <p className="text-xs text-blue-600 flex items-center gap-1 justify-end"><CloudRain className="w-3 h-3" />{wetter.precipProb}% Regen</p>}
          <p className="text-xs text-gray-500 flex items-center gap-1 justify-end"><Wind className="w-3 h-3" />{Math.round(wetter.windSpeed)} km/h</p>
        </div>
      </div>
    </div>
  );
}

function exportToExcel(ergebnisse: SpieltagErgebnis[], titel: string) {
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: titel, Subject: "Herrentag 2026", Author: "GCH", CreatedDate: new Date() };
  
  const spieltage = [...new Set(ergebnisse.map(e => e.spieltag))].sort((a, b) => a - b);
  
  // Gesamt-Blatt
  const alleDaten = spieltage.flatMap(st => {
    const stErgebnisse = ergebnisse.filter(e => e.spieltag === st).sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
    return stErgebnisse.map((e, i) => ({
      Spieltag: e.spieltag,
      Datum: e.datum,
      Rang: i + 1,
      Spieler: e.spieler,
      HCP: e.hcp,
      Club: e.club,
      Klasse: e.klasse,
      Punkte: e.punkte,
      Distanz: e.distanz || '',
      Sonderpreis: e.sonderpreis || ''
    }));
  });
  
  if (alleDaten.length > 0) {
    const ws = XLSX.utils.json_to_sheet(alleDaten);
    ws['!cols'] = [{wch:10},{wch:12},{wch:6},{wch:20},{wch:8},{wch:8},{wch:12},{wch:8},{wch:12},{wch:15}];
    XLSX.utils.book_append_sheet(wb, ws, 'Alle Ergebnisse');
  }
  
  // Pro Spieltag
  spieltage.forEach(st => {
    const stData = ergebnisse.filter(e => e.spieltag === st).sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
    const rows = stData.map((e, i) => ({ Rang: i + 1, Spieler: e.spieler, HCP: e.hcp, Club: e.club, Klasse: e.klasse, Punkte: e.punkte, Distanz: e.distanz || '', Sonderpreis: e.sonderpreis || '' }));
    if (rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{wch:6},{wch:20},{wch:8},{wch:8},{wch:12},{wch:8},{wch:12},{wch:15}];
      XLSX.utils.book_append_sheet(wb, ws, `ST ${st}`);
    }
  });
  
  XLSX.writeFile(wb, `${titel.replace(/\s+/g, '_')}_2026.xlsx`);
}

function exportJahreswertungToExcel(data: Jahreswertung[], titel: string) {
  const wb = XLSX.utils.book_new();
  const rows = data.map(p => ({ Rang: p.rang, Spieler: p.spieler, HCP: p.hcp, Spiele: p.spiele, Gewertet: p.spieleGewertet, 'Punkte Gesamt': p.punkteGesamt, 'Punkte Ø': Math.round(p.punkteSchnitt), 'FJ-Swing': p.fjSwing, 'SR-Swing': p.srSwing, 'HT-Swing': p.htSwing }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:6},{wch:20},{wch:8},{wch:8},{wch:10},{wch:14},{wch:10},{wch:10},{wch:10},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws, 'Jahreswertung');
  XLSX.writeFile(wb, `${titel.replace(/\s+/g, '_')}_2026.xlsx`);
}

// ==================== KOMPONENTEN ====================

type SortKey = 'default' | 'name' | 'spiele' | 'spieleGewertet' | 'punkteGesamt' | 'punkteSchnitt' | 'fjSwing' | 'srSwing' | 'htSwing' | `result${number}`;
type SortDir = 'asc' | 'desc';

function MastersLeaderboard({ data, titel, onPlayerClick }: { data: Jahreswertung[]; titel: string; onPlayerClick?: (name: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const mastersGreen = '#1a472a';

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '⇅';
    return sortDir === 'desc' ? '▼' : '▲';
  };

  // Helfer: N-tes bestes Ergebnis eines Spielers holen
  const getNthResult = (player: Jahreswertung, n: number): number => {
    const sorted = [...player.einzelErgebnisse].sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
    return sorted[n]?.punkte ?? -1;
  };

  const sortedData = useMemo(() => {
    if (sortKey === 'default') return data;
    return [...data].sort((a, b) => {
      let cmp = 0;
      if (sortKey.startsWith('result')) {
        const idx = parseInt(sortKey.replace('result', ''));
        cmp = getNthResult(a, idx) - getNthResult(b, idx);
      } else {
        switch (sortKey) {
          case 'name': cmp = a.spieler.localeCompare(b.spieler); break;
          case 'spiele': cmp = a.spiele - b.spiele; break;
          case 'spieleGewertet': cmp = a.spieleGewertet - b.spieleGewertet; break;
          case 'punkteGesamt': cmp = a.punkteGesamt - b.punkteGesamt; break;
          case 'punkteSchnitt': cmp = a.punkteSchnitt - b.punkteSchnitt; break;
          case 'fjSwing': cmp = a.fjSwing - b.fjSwing; break;
          case 'srSwing': cmp = a.srSwing - b.srSwing; break;
          case 'htSwing': cmp = a.htSwing - b.htSwing; break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const displayData = showAll ? sortedData : sortedData.slice(0, 10);

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="py-3" style={{ background: mastersGreen }}>
        <CardTitle className="text-lg text-white flex items-center gap-2"><Trophy className="w-5 h-5" />{titel} <span className="text-sm font-normal opacity-70">({showAll ? data.length : Math.min(10, data.length)} / {data.length})</span></CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-100">
              <th className="px-2 py-2 text-center font-semibold text-gray-700">#</th>
              <th
                className="px-2 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                onClick={() => toggleSort('name')}
              >Name {sortIcon('name')}</th>
              <th
                className="px-1 py-2 text-center font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-200 select-none transition-colors"
                onClick={() => toggleSort('spiele')}
              >Spiele {sortIcon('spiele')}</th>
              <th
                className="px-1 py-2 text-center font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-200 select-none transition-colors"
                onClick={() => toggleSort('spieleGewertet')}
              >Gewertet {sortIcon('spieleGewertet')}</th>
              {[...Array(12)].map((_, i) => (
                <th
                  key={i}
                  className="px-1 py-2 text-center font-semibold text-gray-700 text-xs cursor-pointer hover:bg-gray-200 select-none transition-colors"
                  onClick={() => toggleSort(`result${i}` as SortKey)}
                >{i + 1} {sortIcon(`result${i}` as SortKey)}</th>
              ))}
              <th
                className="px-2 py-2 text-center font-semibold text-white cursor-pointer hover:opacity-80 select-none transition-opacity"
                style={{ backgroundColor: mastersGreen }}
                onClick={() => toggleSort('punkteGesamt')}
              >Gesamt {sortIcon('punkteGesamt')}</th>
              <th
                className="px-2 py-2 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                onClick={() => toggleSort('punkteSchnitt')}
              >Ø {sortIcon('punkteSchnitt')}</th>
              <th
                className="px-2 py-2 text-center font-semibold text-white cursor-pointer hover:opacity-80 select-none transition-opacity"
                style={{ backgroundColor: '#2d6a3d' }}
                onClick={() => toggleSort('fjSwing')}
                title="FJ-Swing: Beste 6 Ergebnisse zwischen 01.04.2026 und 11.06.2026"
              >
                <span className="text-[10px] block opacity-70">FJ-Swing</span>
                <span className="text-xs">{sortIcon('fjSwing')}</span>
              </th>
              <th
                className="px-2 py-2 text-center font-semibold text-white cursor-pointer hover:opacity-80 select-none transition-opacity"
                style={{ backgroundColor: '#3d5a2d' }}
                onClick={() => toggleSort('srSwing')}
                title="SR-Swing: Beste 6 Ergebnisse zwischen 11.06.2026 und 13.08.2026"
              >
                <span className="text-[10px] block opacity-70">SR-Swing</span>
                <span className="text-xs">{sortIcon('srSwing')}</span>
              </th>
              <th
                className="px-2 py-2 text-center font-semibold text-white cursor-pointer hover:opacity-80 select-none transition-opacity"
                style={{ backgroundColor: '#4a4a2d' }}
                onClick={() => toggleSort('htSwing')}
                title="HT-Swing: Beste 6 Ergebnisse zwischen 14.08.2026 und 08.10.2026"
              >
                <span className="text-[10px] block opacity-70">HT-Swing</span>
                <span className="text-xs">{sortIcon('htSwing')}</span>
              </th>
            </tr></thead>
            <tbody>
              {displayData.map((player, index) => (
                <tr key={player.spieler} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2 text-center font-bold text-gray-800">{index + 1}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => onPlayerClick?.(player.spieler)}
                      className="text-left hover:text-[#1a472a] transition-colors group"
                    >
                      <p className="font-semibold text-gray-900 whitespace-nowrap group-hover:underline">{player.spieler}</p>
                      <p className="text-xs text-gray-500">HCP {player.hcp}</p>
                    </button>
                  </td>
                  <td className="px-1 py-2 text-center text-gray-600">{player.spiele}</td>
                  <td className="px-1 py-2 text-center text-gray-600">{player.spieleGewertet}</td>
                  {(() => {
                    const sorted = [...player.einzelErgebnisse].sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
                    return <>
                      {sorted.slice(0, 12).map((e, i) => (<td key={i} className={`px-1 py-2 text-center ${i < player.spieleGewertet ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{Math.round(e.punkte)}</td>))}
                      {Array.from({ length: 12 - sorted.length }).map((_, i) => (<td key={`empty-${i}`} className="px-1 py-2 text-center text-gray-300">-</td>))}
                    </>;
                  })()}
                  <td className="px-2 py-2 text-center font-bold text-white" style={{ backgroundColor: mastersGreen }}>{Math.round(player.punkteGesamt)}</td>
                  <td className="px-2 py-2 text-center font-medium text-gray-700">{player.punkteSchnitt.toFixed(1)}</td>
                  <td className="px-2 py-2 text-center font-bold text-gray-800" style={{ backgroundColor: '#e8f5e9' }}>{player.fjSwing}</td>
                  <td className="px-2 py-2 text-center font-bold text-gray-800" style={{ backgroundColor: '#f0f5e8' }}>{player.srSwing}</td>
                  <td className="px-2 py-2 text-center font-bold text-gray-800" style={{ backgroundColor: '#f5f0e8' }}>{player.htSwing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <button onClick={() => setShowAll(!showAll)} className="w-full py-3 text-sm font-medium text-[#1a472a] hover:bg-green-50 transition-colors border-t border-gray-100">
            {showAll ? 'Nur Top 10 anzeigen' : `Alle ${data.length} anzeigen`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function ErgebnisCard({ titel, farbe, daten, showFull, onToggle }: { titel: string; farbe: string; daten: SpieltagErgebnis[]; showFull: boolean; onToggle: () => void }) {
  const farben: Record<string, { bg: string; text: string }> = {
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' }
  };
  const f = farben[farbe];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className={`bg-gradient-to-r ${f.bg} to-white`}>
        <CardTitle className="flex items-center gap-2"><Award className={`w-5 h-5 ${f.text}`} />{titel}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Spieler</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Pkt.</th></tr></thead>
          <tbody>
            {daten.slice(0, showFull ? undefined : 5).map((e, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td className="px-4 py-3"><p className="font-medium text-sm">{e.spieler}</p><p className="text-xs text-gray-500">HCP {e.hcp}</p></td>
                <td className="px-4 py-3 text-right font-bold text-[#1a472a]">{Math.round(e.punkte || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {daten.length > 5 && (
          <button onClick={onToggle} className="w-full py-3 text-sm font-medium text-[#1a472a] hover:bg-green-50 transition-colors border-t border-gray-100">
            {showFull ? 'Weniger anzeigen' : `Alle ${daten.length} anzeigen`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SonderpreiseCard({ spieltag, getSonderpreise }: { spieltag: number; getSonderpreise: (n: number) => any }) {
  const { longestDrive, nearestPin, nearestPin2Schlag } = getSonderpreise(spieltag);
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />Sonderpreise</CardTitle></CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-8 h-8 text-green-600" /></div>
            <div className="min-w-0"><p className="text-base text-gray-500">Longest Drive</p><p className="font-bold text-lg truncate">{longestDrive?.spieler || '-'}</p>{longestDrive?.distanz && <p className="text-base text-green-600 font-bold">{longestDrive.distanz} m</p>}</div>
          </div>
          <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><MapPin className="w-8 h-8 text-blue-600" /></div>
            <div className="min-w-0"><p className="text-base text-gray-500">Nearest to the Pin</p><p className="font-bold text-lg truncate">{nearestPin?.spieler || '-'}</p>{nearestPin?.distanz && <p className="text-base text-blue-600 font-bold">{nearestPin.distanz} m</p>}</div>
          </div>
          <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><MapPin className="w-8 h-8 text-purple-600" /></div>
            <div className="min-w-0"><p className="text-base text-gray-500">Nearest to the Pin (2. Schlag)</p><p className="font-bold text-lg truncate">{nearestPin2Schlag?.spieler || '-'}</p>{nearestPin2Schlag?.distanz && <p className="text-base text-purple-600 font-bold">{nearestPin2Schlag.distanz} m</p>}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BerichteTab({ kalender, getBruttoWertung, getNettoAWertung, getNettoBWertung, getSonderpreise, selectedBerichtMenuSpieltag, setSelectedBerichtMenuSpieltag }: any) {
  const kalenderMitBerichten = kalender.filter((t: Turnier) => t.bericht && t.bericht.trim().length > 0);
  const spieltageFuerDropdown = kalenderMitBerichten.length > 0 ? kalenderMitBerichten : kalender;
  if (spieltageFuerDropdown.length === 0) return <Card className="border-0 shadow-md p-12 text-center"><FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">Keine Kalender-Daten vorhanden.</p></Card>;
  const aktuellerSpieltag = selectedBerichtMenuSpieltag || spieltageFuerDropdown[0].spieltag;
  const termin = kalender.find((t: Turnier) => t.spieltag === aktuellerSpieltag);
  if (!termin) return null;
  const brutto = getBruttoWertung(termin.spieltag);
  const nettoA = getNettoAWertung(termin.spieltag);
  const nettoB = getNettoBWertung(termin.spieltag);
  const { longestDrive, nearestPin, nearestPin2Schlag } = getSonderpreise(termin.spieltag);
  const hatBericht = termin?.bericht && termin.bericht.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Spieltagsberichte</h2>
        <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-2" />Als PDF exportieren</Button>
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <select value={aktuellerSpieltag} onChange={(e) => setSelectedBerichtMenuSpieltag(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base">
            {spieltageFuerDropdown.sort((a: Turnier, b: Turnier) => a.spieltag - b.spieltag).map((t: Turnier) => (
              <option key={t.spieltag} value={t.spieltag}>Spieltag {t.spieltag} - {t.datum} - {t.name} {t.bericht && t.bericht.trim().length > 0 ? '(✓ Bericht)' : ''}</option>
            ))}
          </select>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#1a472a] to-[#2d5a3d] text-white">
          <div className="flex items-center justify-between">
            <div><p className="text-sm opacity-80">Spieltag {termin.spieltag}</p><CardTitle className="text-xl">{termin.datum}</CardTitle></div>
            <Trophy className="w-10 h-10 opacity-50" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {brutto[0] && (<div className="text-center p-4 bg-yellow-50 rounded-xl"><p className="text-sm text-gray-500 mb-1">Brutto-Sieger</p><p className="font-bold text-lg">{brutto[0].spieler}</p><p className="text-3xl font-bold text-yellow-600">{Math.round(brutto[0].punkte || 0)}</p></div>)}
            {nettoA[0] && (<div className="text-center p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-500 mb-1">Netto A Sieger</p><p className="font-bold text-lg">{nettoA[0].spieler}</p><p className="text-3xl font-bold text-gray-600">{Math.round(nettoA[0].punkte || 0)}</p></div>)}
            {nettoB[0] && (<div className="text-center p-4 bg-orange-50 rounded-xl"><p className="text-sm text-gray-500 mb-1">Netto B Sieger</p><p className="font-bold text-lg">{nettoB[0].spieler}</p><p className="text-3xl font-bold text-orange-600">{Math.round(nettoB[0].punkte || 0)}</p></div>)}
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {longestDrive && (<div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl"><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-500">Longest Drive</p><p className="font-bold">{longestDrive.spieler}</p><p className="text-sm text-green-600 font-bold">{longestDrive.distanz}m</p></div></div>)}
            {nearestPin && (<div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl"><div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><MapPin className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">Nearest to Pin</p><p className="font-bold">{nearestPin.spieler}</p><p className="text-sm text-blue-600 font-bold">{nearestPin.distanz}m</p></div></div>)}
            {nearestPin2Schlag && (<div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl"><div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><MapPin className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">Nearest to Pin (2. Schlag)</p><p className="font-bold">{nearestPin2Schlag.spieler}</p><p className="text-sm text-purple-600 font-bold">{nearestPin2Schlag.distanz}m</p></div></div>)}
          </div>
          <div className="mt-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-gray-700">
            <div className="p-3 bg-gray-800 border-b border-gray-700"><p className="font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4" />Spieltagsbericht</p></div>
            <div className="p-4">
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm min-h-[100px]">
                {hatBericht ? (<pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">{termin.bericht}</pre>) : (<p className="text-gray-400 italic text-center py-8">Für diesen Spieltag ist noch kein Bericht vorhanden.</p>)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WetterDetailPage({ datum }: { datum: string }) {
  const [stundenData, setStundenData] = useState<any[]>([]);
  const [daily, setDaily] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datum) { setLoading(false); return; }
    const parts = datum.split('.');
    if (parts.length !== 3) { setLoading(false); return; }
    const [tag, monat, jahr] = parts.map(Number);
    const isoDatum = `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=51.6424&longitude=6.7717&start_date=${isoDatum}&end_date=${isoDatum}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m,cloudcover&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=Europe/Berlin`;
        const res = await fetch(url);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        if (data.hourly) {
          const stunden = data.hourly.time.map((t: string, i: number) => ({
            zeit: t.slice(11, 16),
            temp: data.hourly.temperature_2m[i],
            precip: data.hourly.precipitation_probability[i],
            code: data.hourly.weathercode[i],
            wind: data.hourly.windspeed_10m[i],
            clouds: data.hourly.cloudcover[i]
          }));
          setStundenData(stunden);
        }
        if (data.daily) {
          setDaily({
            tempMax: data.daily.temperature_2m_max?.[0],
            tempMin: data.daily.temperature_2m_min?.[0],
            precipProb: data.daily.precipitation_probability_max?.[0],
            windSpeed: data.daily.windspeed_10m_max?.[0],
            code: data.daily.weathercode?.[0]
          });
        }
      } catch (e) {}
      setLoading(false);
    };
    fetchDetail();
  }, [datum]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Cloud className="w-6 h-6 text-blue-500" />Wetter Hünxe</h2>
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div><p className="text-gray-500">Lade Wetterdaten...</p></div>
      </div>
    );
  }

  if (!daily) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Cloud className="w-6 h-6 text-blue-500" />Wetter Hünxe</h2>
        <p className="text-gray-500 text-center py-8">Keine Wetterdaten verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Cloud className="w-6 h-6 text-blue-500" />Wetter Hünxe <span className="text-gray-400 text-base font-normal">{datum}</span></h2>

      {/* Tagesübersicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 shadow-sm border border-yellow-100 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Wetter</p>
          <div className="flex justify-center">{getWetterIcon(daily.code, 'lg')}</div>
          <p className="text-sm text-gray-600 mt-1">{getWetterBeschreibung(daily.code)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 shadow-sm border border-red-100 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Temperatur</p>
          <p className="text-3xl font-bold text-gray-900">{Math.round(daily.tempMax)}°C</p>
          <p className="text-sm text-gray-500">min {Math.round(daily.tempMin)}°C</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 shadow-sm border border-blue-100 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Regen</p>
          <p className="text-3xl font-bold text-blue-600">{daily.precipProb}%</p>
          <p className="text-sm text-gray-500">Wahrscheinlichkeit</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase mb-1">Wind</p>
          <p className="text-3xl font-bold text-gray-700">{Math.round(daily.windSpeed)}</p>
          <p className="text-sm text-gray-500">km/h max</p>
        </div>
      </div>

      {/* Stündliche Vorhersage */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800">
          <CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" />Stündliche Vorhersage</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Zeit</th><th className="px-3 py-2 text-center">Wetter</th><th className="px-3 py-2 text-center">Temp.</th><th className="px-3 py-2 text-center">Regen %</th><th className="px-3 py-2 text-center">Wind</th><th className="px-3 py-2 text-center">Wolken</th></tr></thead>
              <tbody>
                {stundenData.filter((_, i) => i % 3 === 0).map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{s.zeit} Uhr</td>
                    <td className="px-3 py-2 text-center">{getWetterIcon(s.code, 'sm')}</td>
                    <td className="px-3 py-2 text-center font-bold">{Math.round(s.temp)}°C</td>
                    <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-1 rounded ${s.precip > 50 ? 'bg-blue-100 text-blue-700' : s.precip > 20 ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>{s.precip}%</span></td>
                    <td className="px-3 py-2 text-center text-gray-600">{Math.round(s.wind)} km/h</td>
                    <td className="px-3 py-2 text-center"><div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden inline-block"><div className="h-full bg-gray-400 rounded-full" style={{ width: `${s.clouds}%` }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Wetter-API Link */}
      <div className="text-center">
        <a href={`https://open-meteo.com/en/docs#latitude=51.6424&longitude=6.7717`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-500 transition-colors">
          Wetterdaten von Open-Meteo API
        </a>
      </div>
    </div>
  );
}

function getWetterBeschreibung(code: number): string {
  if (code === 0) return 'Klarer Himmel';
  if (code === 1) return 'Meist klar';
  if (code === 2) return 'Teilweise bewölkt';
  if (code === 3) return 'Bedeckt';
  if (code >= 45 && code <= 48) return 'Nebel';
  if (code >= 51 && code <= 55) return 'Nieselregen';
  if (code >= 61 && code <= 67) return 'Regen';
  if (code >= 71 && code <= 77) return 'Schnee';
  if (code >= 80 && code <= 82) return 'Schauer';
  if (code >= 85 && code <= 86) return 'Schneeschauer';
  if (code >= 95 && code <= 96) return 'Gewitter';
  if (code >= 99) return 'Schweres Gewitter';
  return 'Unbekannt';
}

function AdminTab({ isAdminAuthenticated, setIsAdminAuthenticated, adminPassword, setAdminPassword, adminTab, setAdminTab, ergebnisse, kalender, sponsoren, addErgebnis, updateErgebnis, deleteErgebnis, saveBericht, addKalender, updateKalender, deleteKalender, addSponsor, updateSponsor, deleteSponsor, saveSponsorLogo, sponsorLogos, selectedBerichtSpieltag, setSelectedBerichtSpieltag, berichtText, setBerichtText, fileToBase64 }: any) {
  const [loginError, setLoginError] = useState('');

  const handleLogin = () => {
    if (adminPassword === 'gch2026') {
      setIsAdminAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Falsches Passwort. Bitte erneut versuchen.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  if (!isAdminAuthenticated) {
    return (
      <Card className="border-0 shadow-lg max-w-md mx-auto">
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Admin-Bereich</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500 text-sm">Bitte geben Sie das Admin-Passwort ein:</p>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="Passwort"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a472a]"
            autoFocus
          />
          {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
          <Button onClick={handleLogin} className="w-full bg-[#1a472a]">Anmelden</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin-Bereich</h2>
        <Button variant="outline" onClick={() => { setIsAdminAuthenticated(false); setAdminPassword(''); }}>Abmelden</Button>
      </div>
      <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ergebnisse">Ergebnisse</TabsTrigger>
          <TabsTrigger value="kalender">Kalender</TabsTrigger>
          <TabsTrigger value="berichte">Berichte</TabsTrigger>
          <TabsTrigger value="sponsoren">Sponsoren</TabsTrigger>
          <TabsTrigger value="birdies">Birdies</TabsTrigger>
        </TabsList>
        <TabsContent value="ergebnisse" className="space-y-4"><ErgebnisCRUD ergebnisse={ergebnisse} onAdd={addErgebnis} onUpdate={updateErgebnis} onDelete={deleteErgebnis} /></TabsContent>
        <TabsContent value="kalender" className="space-y-4"><KalenderCRUD kalender={kalender} sponsoren={sponsoren} onAdd={addKalender} onUpdate={updateKalender} onDelete={deleteKalender} /></TabsContent>
        <TabsContent value="berichte" className="space-y-4"><BerichteAdmin kalender={kalender} saveBericht={saveBericht} selectedSpieltag={selectedBerichtSpieltag} setSelectedSpieltag={setSelectedBerichtSpieltag} berichtText={berichtText} setBerichtText={setBerichtText} /></TabsContent>
        <TabsContent value="sponsoren" className="space-y-4"><SponsorenCRUD sponsoren={sponsoren} sponsorLogos={sponsorLogos} onAdd={addSponsor} onUpdate={updateSponsor} onDelete={deleteSponsor} onSaveLogo={saveSponsorLogo} fileToBase64={fileToBase64} /></TabsContent>
        <TabsContent value="birdies" className="space-y-4"><BirdieCRUD /></TabsContent>
      </Tabs>
    </div>
  );
}

function ExcelUpload({ ergebnisse, onUpload, onUpdate, onDelete }: { ergebnisse: SpieltagErgebnis[]; onUpload: (data: any) => Promise<void>; onUpdate: (id: string, data: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeDatum = (raw: any): string => {
    if (raw === undefined || raw === null || raw === '') return '';

    // Date-Objekt aus xlsx mit cellDates:true
    // WICHTIG: UTC-Methoden verwenden, damit Zeitzone nicht das Datum verschiebt
    if (raw instanceof Date) {
      const day = String(raw.getUTCDate()).padStart(2, '0');
      const month = String(raw.getUTCMonth() + 1).padStart(2, '0');
      const year = raw.getUTCFullYear();
      return `${day}.${month}.${year}`;
    }

    const s = String(raw).trim();
    if (!s) return '';

    // DE-Format "DD.MM.YYYY" — direkt übernehmen
    const de = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
    if (de) {
      let jahr = de[3];
      if (jahr.length === 2) jahr = '20' + jahr;
      return `${de[1].padStart(2, '0')}.${de[2].padStart(2, '0')}.${jahr}`;
    }

    // ISO "YYYY-MM-DD"
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${iso[3].padStart(2, '0')}.${iso[2].padStart(2, '0')}.${iso[1]}`;

    // US "MM/DD/YYYY"
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) return `${us[2].padStart(2, '0')}.${us[1].padStart(2, '0')}.${us[3]}`;

    // Excel-Seriennummer als String
    if (/^\d{5,6}$/.test(s)) {
      const epoch = new Date(1899, 11, 30);
      const d = new Date(epoch.getTime() + (parseInt(s) - (parseInt(s) >= 60 ? 1 : 0)) * 86400000);
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    }

    return s;
  };

  const parseHcpImport = (raw: any): { value: number | null; corrected: boolean } => {
    if (raw === undefined || raw === null || raw === '') return { value: null, corrected: false };
    const str = String(raw).replace(',', '.').trim();
    const val = parseFloat(str);
    if (isNaN(val)) return { value: null, corrected: false };
    // Gültiger HCP-Bereich: -10 bis +54
    if (val >= -10 && val <= 54) {
      return { value: Math.round(val * 10) / 10, corrected: false };
    }
    // Dezimalzeichen verloren? z.B. 157 → 15.7
    if (val > 54 && val < 1000) {
      const corrected = val / 10;
      if (corrected >= -10 && corrected <= 54) {
        return { value: Math.round(corrected * 10) / 10, corrected: true };
      }
    }
    // Nicht korrigierbar
    return { value: null, corrected: false };
  };

  const findExisting = (spieltag: number, spieler: string, klasse: string) => {
    return ergebnisse.find(e => e.spieltag === spieltag && e.spieler === spieler && e.klasse === klasse);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    try {
      const XLSX = await import('xlsx');
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      const processData = async (text: string, useSemicolon: boolean) => {
        let rows: string[][] = [];

        if (useSemicolon) {
          // CSV direkt als Text parsen - mit ; als Trennzeichen
          rows = text.split('\n').map(line => line.split(';').map(c => c.trim()));
        } else {
          // XLSX via xlsx library
          const wb = XLSX.read(text, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
        }

        if (rows.length < 2) {
          setUploadError('Die Datei enthält keine Daten.');
          setUploading(false);
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const colIndex = (names: string[]): number => {
          for (const name of names) {
            const idx = headers.findIndex(h => h.includes(name));
            if (idx >= 0) return idx;
          }
          return -1;
        };

        const cSpieltag = colIndex(['spieltag']);
        const cDatum    = colIndex(['datum']);
        const cKlasse   = colIndex(['klasse', 'class']);
        const cSonder   = colIndex(['sonderpreis']);
        const cBahn     = colIndex(['bahn']);
        const cSpieler  = colIndex(['spieler', 'name', 'player']);
        const cHcp      = colIndex(['hcp', 'handicap', 'hc']);
        const cClub     = colIndex(['club', 'verein', 'golfclub']);
        const cPunkte   = colIndex(['punkte', 'pkt', 'points', 'score']);

        if (cSpieler < 0) {
          setUploadError('Spalte "Spieler" nicht gefunden.');
          setUploading(false);
          return;
        }

        let createdCount = 0, updatedCount = 0, skippedRows = 0;
        let invalidHcpCount = 0;
        const invalidHcpExamples: string[] = [];
        let invalidDateCount = 0;
        const invalidDateExamples: string[] = [];
        const parsedDates: string[] = [];
        const debugCells: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) { skippedRows++; continue; }

          const spieler = cSpieler >= 0 ? String(row[cSpieler] || '').trim() : '';
          if (!spieler) { skippedRows++; continue; }

          // Spieltag
          let spieltag = 1;
          if (cSpieltag >= 0 && row[cSpieltag]) {
            const st = parseInt(String(row[cSpieltag]).trim());
            if (!isNaN(st)) spieltag = st;
          }

          // === DATUM: Einfach den String nehmen wie er ist! ===
          let datum = '';
          if (cDatum >= 0 && row[cDatum]) {
            const raw = String(row[cDatum]).trim();
            // CSV gibt "10.06.2026" direkt als String - EINFACH UEBERNEHMEN!
            const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
            if (m) {
              let jahr = m[3];
              if (jahr.length === 2) jahr = '20' + jahr;
              datum = `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${jahr}`;
            } else {
              datum = normalizeDatum(raw);
            }
            if (debugCells.length < 5) debugCells.push(`Z${i+1}: "${raw}" → "${datum}"`);
            if (!datum) { invalidDateCount++; if (invalidDateExamples.length < 3) invalidDateExamples.push(`Z${i+1}: "${raw}"`); }
          }

          // Klasse
          const klasseMap: Record<string, string> = {
            'brutto': 'Brutto',
            'netto a': 'Netto A', 'netto_a': 'Netto A', 'netto-a': 'Netto A', 'nettoa': 'Netto A',
            'netto b': 'Netto B', 'netto_b': 'Netto B', 'netto-b': 'Netto B', 'nettob': 'Netto B',
            'longest drive': 'Longest Drive',
            'nearest to the pin': 'Nearest to the Pin',
            'nearest to the pin 2': 'Nearest to the Pin 2',
            'nearest to the pin 2. schlag': 'Nearest to the Pin 2',
            'nearest to the pin (2. schlag)': 'Nearest to the Pin 2',
          };
          let klasse = 'Brutto';
          if (cKlasse >= 0 && row[cKlasse]) {
            klasse = klasseMap[String(row[cKlasse]).toLowerCase().trim()] || 'Brutto';
          }

          // Sonderpreis
          let sonderpreis: string | null = null;
          if (cSonder >= 0 && row[cSonder]) { const v = String(row[cSonder]).trim(); if (v) sonderpreis = v; }

          // Bahn
          let bahn: number | null = null;
          if (cBahn >= 0 && row[cBahn]) { const v = parseInt(String(row[cBahn]).trim()); if (!isNaN(v)) bahn = v; }

          // HCP
          let hcp: number | null = null;
          if (cHcp >= 0 && row[cHcp]) {
            const result = parseHcpImport(row[cHcp]);
            if (result.value !== null) { hcp = result.value; if (result.corrected && invalidHcpExamples.length < 3) invalidHcpExamples.push(`${row[cHcp]} → ${hcp}`); }
          }

          // Club
          let club = 'GCH';
          if (cClub >= 0 && row[cClub]) { const v = String(row[cClub]).trim(); if (v) club = v; }

          // Punkte
          let punkte: number | null = null;
          if (cPunkte >= 0 && row[cPunkte]) { const v = parseInt(String(row[cPunkte]).replace(',', '.').trim()); if (!isNaN(v)) punkte = v; }

          // Debug
          if (datum && parsedDates.length < 15 && !parsedDates.includes(datum)) parsedDates.push(datum);

          // Speichern
          const result: any = { spieltag, spieler, klasse, club };
          if (datum) result.datum = datum;
          if (punkte !== null) result.punkte = punkte;
          if (hcp !== null) result.hcp = hcp;
          if (sonderpreis !== null) result.sonderpreis = sonderpreis;
          if (bahn !== null) result.bahn = bahn;

          const existing = findExisting(spieltag, spieler, klasse);
          if (existing?.id) { await onUpdate(existing.id, result); updatedCount++; }
          else { await onUpload(result); createdCount++; }
        }

        let resultMsg = `${createdCount > 0 ? createdCount + ' neu' : ''}${createdCount > 0 && updatedCount > 0 ? ', ' : ''}${updatedCount > 0 ? updatedCount + ' aktualisiert' : ''}${skippedRows > 0 ? ' (' + skippedRows + ' übersprungen)' : ''}.`;
        if (invalidHcpCount > 0) resultMsg += `\n⚠️ ${invalidHcpCount} HCP korrigiert: ${invalidHcpExamples.slice(0, 3).join(', ')}`;
        if (invalidDateCount > 0) resultMsg += `\n⚠️ ${invalidDateCount} Datum fehlerhaft: ${invalidDateExamples.slice(0, 3).join(', ')}`;
        if (debugCells.length > 0) resultMsg += `\n🔍 Datum-Parsing: ${debugCells.join(' | ')}`;
        if (parsedDates.length > 0) resultMsg += `\n📅 Datumswerte: ${parsedDates.join(', ')}`;
        setUploadResult(resultMsg);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploading(false);
      };

      // === CSV ENCODING ===
      // Excel speichert CSV als "CSV (Trennzeichen-getrennt)" = Windows-1252 mit BOM
      // oder "CSV UTF-8" = UTF-8 mit BOM
      const rawBytes = new Uint8Array(await file.arrayBuffer());
      let bytes = rawBytes;
      let csvText = '';
      
      // BOM entfernen
      if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        bytes = bytes.subarray(3);
      }
      
      // Versuch 1: UTF-8
      try {
        csvText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        // Versuch 2: ISO-8859-1 (Latin-1) - jedes Byte = ein Zeichen
        csvText = new TextDecoder('iso-8859-1').decode(bytes);
      }
      
      await processData(csvText, isCsv);
    } catch (err: any) {
      setUploadError('Fehler: ' + err.message);
      setUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('ACHTUNG: Alle Ergebnisse werden unwiderruflich gelöscht!\n\nBist du sicher?')) return;
    if (!confirm('WIRKLICH ALLE ERGEBNISSE LÖSCHEN?\nDies kann nicht rückgängig gemacht werden!')) return;
    try {
      setUploading(true);
      for (const e of ergebnisse) {
        if (e.id) await onDelete(e.id);
      }
      setUploadResult('Alle Ergebnisse wurden gelöscht.');
      setShowDeleteAll(false);
    } catch (err: any) {
      setUploadError('Fehler beim Löschen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" id="excel-upload" />
        <label htmlFor="excel-upload" className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${uploading ? 'bg-gray-300 text-gray-600' : 'bg-[#1a472a] text-white hover:bg-[#143620]'}`}>
          <Upload className="w-4 h-4" /> {uploading ? 'Wird importiert...' : 'Excel Upload'}
        </label>
        <Button variant="outline" size="sm" onClick={() => setShowDeleteAll(!showDeleteAll)} className="text-red-600 border-red-200 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-1" />Alle löschen
        </Button>
      </div>
      {showDeleteAll && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium mb-2">Alle {ergebnisse.length} Ergebnisse unwiderruflich löschen?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleDeleteAll} disabled={uploading}>Ja, alle löschen</Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeleteAll(false)}>Abbrechen</Button>
          </div>
        </div>
      )}
      {uploadResult && <p className="text-green-600 text-sm bg-green-50 p-2 rounded-lg whitespace-pre-line">{uploadResult}</p>}
      {uploadError && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{uploadError}</p>}
      <p className="text-xs text-gray-500">Spalten: Spieltag, Datum, Klasse, Sonderpreis, Bahn, Spieler, HCP, Club, Punkte. Bestehende Einträge werden automatisch aktualisiert.</p>
    </div>
  );
}

function ErgebnisCRUD({ ergebnisse, onAdd, onUpdate, onDelete }: { ergebnisse: SpieltagErgebnis[]; onAdd: any; onUpdate: any; onDelete: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpieltag, setFilterSpieltag] = useState<number | ''>('');
  const [formData, setFormData] = useState({ spieltag: 1, datum: '', klasse: 'Brutto' as const, sonderpreis: '', bahn: '', distanz: '', spieler: '', hcp: '', club: 'GCH', punkte: '' });
  const resetForm = () => { setFormData({ spieltag: 1, datum: '', klasse: 'Brutto', sonderpreis: '', bahn: '', distanz: '', spieler: '', hcp: '', club: 'GCH', punkte: '' }); setEditingId(null); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const data: any = { spieltag: formData.spieltag, datum: excelDateToString(formData.datum), klasse: formData.klasse, spieler: formData.spieler, club: formData.club }; if (formData.sonderpreis) data.sonderpreis = formData.sonderpreis; if (formData.bahn) data.bahn = parseInt(formData.bahn); if (formData.distanz) data.distanz = formData.distanz; if (formData.hcp) data.hcp = parseFloat(formData.hcp.replace(',', '.')); if (formData.punkte) data.punkte = parseInt(formData.punkte); if (editingId) { await onUpdate(editingId, data); } else { await onAdd(data); } resetForm(); setShowForm(false); };
  const excelDateToString = (datum: string): string => {
    // Prüfe ob das Datum ein Excel-Serielldatum ist (z.B. "46134")
    if (/^\d{5,6}$/.test(datum.trim())) {
      const excelEpoch = new Date(1899, 11, 30);
      const days = parseInt(datum.trim());
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      const tag = String(date.getDate()).padStart(2, '0');
      const monat = String(date.getMonth() + 1).padStart(2, '0');
      const jahr = date.getFullYear();
      return `${tag}.${monat}.${jahr}`;
    }
    return datum;
  };

  const handleEdit = (e: SpieltagErgebnis) => { setFormData({ spieltag: e.spieltag, datum: excelDateToString(e.datum), klasse: e.klasse as any, sonderpreis: e.sonderpreis || '', bahn: e.bahn?.toString() || '', distanz: e.distanz?.toString() || '', spieler: e.spieler, hcp: e.hcp?.toString() || '', club: e.club, punkte: e.punkte?.toString() || '' }); setEditingId(e.id || null); setShowForm(true); };
  const filteredErgebnisse = ergebnisse.filter(e => { const matchesSearch = e.spieler.toLowerCase().includes(searchTerm.toLowerCase()) || e.klasse.toLowerCase().includes(searchTerm.toLowerCase()); const matchesSpieltag = filterSpieltag === '' || e.spieltag === filterSpieltag; return matchesSearch && matchesSpieltag; });
  const uniqueSpieltage = Array.from(new Set(ergebnisse.map(e => e.spieltag))).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Ergebnisse verwalten ({ergebnisse.length})</h3>
        <div className="flex gap-2">
          <ExcelUpload ergebnisse={ergebnisse} onUpload={onAdd} onUpdate={onUpdate} onDelete={onDelete} />
          <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-[#1a472a]"><Plus className="w-4 h-4 mr-1" />{showForm ? 'Abbrechen' : 'Neues Ergebnis'}</Button>
        </div>
      </div>
      {ergebnisse.length > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Spieler suchen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          <select value={filterSpieltag} onChange={(e) => setFilterSpieltag(e.target.value === '' ? '' : parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Alle Spieltage</option>{uniqueSpieltage.map(st => (<option key={st} value={st}>Spieltag {st}</option>))}
          </select>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-medium mb-3">{editingId ? 'Ergebnis bearbeiten' : 'Neues Ergebnis'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-xs text-gray-600 mb-1">Spieltag</label><input type="number" min={1} max={30} value={formData.spieltag} onChange={(e) => setFormData({...formData, spieltag: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Datum</label><input type="text" placeholder="TT.MM.JJJJ" value={formData.datum} onChange={(e) => setFormData({...formData, datum: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Klasse</label><select value={formData.klasse} onChange={(e) => setFormData({...formData, klasse: e.target.value as any})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="Brutto">Brutto</option><option value="Netto A">Netto A</option><option value="Netto B">Netto B</option><option value="Longest Drive">Longest Drive</option><option value="Nearest to the Pin">Nearest to the Pin</option><option value="Nearest to the Pin 2. Schlag">Nearest to the Pin (2. Schlag)</option></select></div>
            <div><label className="block text-xs text-gray-600 mb-1">Spieler</label><input type="text" value={formData.spieler} onChange={(e) => setFormData({...formData, spieler: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">HCP</label><input type="text" placeholder="z.B. 12,5" value={formData.hcp} onChange={(e) => setFormData({...formData, hcp: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Club</label><input type="text" value={formData.club} onChange={(e) => setFormData({...formData, club: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Punkte</label><input type="number" value={formData.punkte} onChange={(e) => setFormData({...formData, punkte: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Sonderpreis (Loch)</label><input type="text" placeholder="z.B. Loch 5" value={formData.sonderpreis} onChange={(e) => setFormData({...formData, sonderpreis: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Distanz (m)</label><input type="text" placeholder="z.B. 245m" value={formData.distanz} onChange={(e) => setFormData({...formData, distanz: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="bg-[#1a472a]"><Save className="w-4 h-4 mr-1" />Speichern</Button>
            <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Abbrechen</Button>
          </div>
        </form>
      )}
      {filteredErgebnisse.length > 0 ? (
        <div className="max-h-96 overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">Spieltag</th><th className="px-3 py-2 text-left">Datum</th><th className="px-3 py-2 text-left">Klasse</th><th className="px-3 py-2 text-left">Spieler</th><th className="px-3 py-2 text-left">HCP</th><th className="px-3 py-2 text-left">Club</th><th className="px-3 py-2 text-left">Punkte</th><th className="px-3 py-2 text-left">Sonderpreis</th><th className="px-3 py-2 text-left">Distanz</th><th className="px-3 py-2 text-center">Aktionen</th></tr></thead>
            <tbody>{filteredErgebnisse.slice(0, 100).map((e, idx) => (
              <tr key={e.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">{e.spieltag}</td><td className="px-3 py-2">{e.datum}</td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs ${e.klasse === 'Brutto' ? 'bg-green-100 text-green-700' : e.klasse === 'Netto A' ? 'bg-blue-100 text-blue-700' : e.klasse === 'Netto B' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>{e.klasse}</span></td>
                <td className="px-3 py-2 font-medium">{e.spieler}</td><td className="px-3 py-2">{e.hcp}</td><td className="px-3 py-2">{e.club}</td><td className="px-3 py-2">{e.punkte}</td><td className="px-3 py-2 text-gray-600">{e.sonderpreis || '-'}</td><td className="px-3 py-2 text-gray-600">{e.distanz || '-'}</td>
                <td className="px-3 py-2 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button><button onClick={async () => { if (confirm(`"${e.spieler}" löschen?`)) { if (e.id) await onDelete(e.id); } }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (<p className="text-gray-500 text-center py-4">Noch keine Ergebnisse vorhanden.</p>)}
    </div>
  );
}

function SpielerProfil({ spielerName, ergebnisse, jahreswertungBrutto, jahreswertungNetto: _jNetto, onBack }: { spielerName: string; ergebnisse: SpieltagErgebnis[]; jahreswertungBrutto: Jahreswertung[]; jahreswertungNetto: Jahreswertung[]; onBack: () => void }) {
  void _jNetto;
  const bruttoEntry = jahreswertungBrutto.find(p => p.spieler === spielerName);
  const alleErgebnisse = ergebnisse.filter(e => e.spieler === spielerName).sort((a, b) => a.spieltag - b.spieltag);

  // Nur echte Runden (Brutto/Netto) – keine Sonderpreise
  const spielerErgebnisse = alleErgebnisse.filter(e => e.klasse === 'Brutto' || e.klasse === 'Netto A' || e.klasse === 'Netto B');
  const besteRunde = [...spielerErgebnisse].sort((a, b) => (b.punkte || 0) - (a.punkte || 0))[0];

  // Daten nach Klasse aufteilen
  const bruttoErgebnisse = spielerErgebnisse.filter(e => e.klasse === 'Brutto');
  const nettoAErgebnisse = spielerErgebnisse.filter(e => e.klasse === 'Netto A');
  const nettoBErgebnisse = spielerErgebnisse.filter(e => e.klasse === 'Netto B');
  const nettoErgebnisse = [...nettoAErgebnisse, ...nettoBErgebnisse];

  // Unique Spieltage (keine Doppelzählung bei Brutto+Netto am selben Tag)
  const uniqueSpieltage = Array.from(new Set(spielerErgebnisse.map(e => e.spieltag))).sort((a, b) => a - b);

  // Durchschnittspunkte
  const avgBrutto = bruttoErgebnisse.length > 0
    ? Math.round(bruttoErgebnisse.reduce((s, e) => s + (e.punkte || 0), 0) / bruttoErgebnisse.length)
    : null;
  const avgNetto = nettoErgebnisse.length > 0
    ? Math.round(nettoErgebnisse.reduce((s, e) => s + (e.punkte || 0), 0) / nettoErgebnisse.length)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Zurück</Button>
        <h2 className="text-2xl font-bold flex items-center gap-2"><User className="w-6 h-6 text-[#1a472a]" />{spielerName}</h2>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Runden</p>
          <p className="text-3xl font-bold text-[#1a472a]">{uniqueSpieltage.length}</p>
          <p className="text-xs text-gray-400">{uniqueSpieltage.length} Spieltag{uniqueSpieltage.length !== 1 ? 'e' : ''}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Brutto-Rang</p>
          <p className="text-3xl font-bold text-[#1a472a]">{bruttoEntry?.rang || '-'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Beste Runde</p>
          <p className="text-3xl font-bold text-yellow-600">{besteRunde?.punkte || '-'}</p>
          <p className="text-xs text-gray-500">Spieltag {besteRunde?.spieltag}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 uppercase">Ø Brutto / Ø Netto</p>
          <p className="text-2xl font-bold text-blue-600">{avgBrutto ?? '-'}</p>
          <p className="text-sm font-bold text-purple-600">/ {avgNetto ?? '-'}</p>
        </div>
      </div>

      {/* Punkteverlauf: Brutto + Netto als 2 Frames */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1a472a] to-green-700 py-4">
            <CardTitle className="text-white text-sm flex items-center gap-2 justify-center"><TrendingUp className="w-5 h-5" />Brutto-Verlauf</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {bruttoErgebnisse.length > 0 ? (
              <div className="space-y-2">
                {bruttoErgebnisse.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20">Spieltag {e.spieltag}</span>
                      <span className="text-sm text-gray-400">{e.datum}</span>
                    </div>
                    <span className="font-bold text-[#1a472a] w-10 text-right">{e.punkte}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-4">Keine Brutto-Ergebnisse</p>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1a472a] to-green-700 py-4">
            <CardTitle className="text-white text-sm flex items-center gap-2 justify-center"><TrendingUp className="w-5 h-5" />Netto-Verlauf (A + B)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {nettoErgebnisse.length > 0 ? (
              <div className="space-y-2">
                {nettoErgebnisse.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20">Spieltag {e.spieltag}</span>
                      <span className="text-sm text-gray-400">{e.datum}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${e.klasse === 'Netto A' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{e.klasse}</span>
                      <span className="font-bold text-[#1a472a] w-10 text-right">{e.punkte}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-4">Keine Netto-Ergebnisse</p>}
          </CardContent>
        </Card>
      </div>

      {/* Sonderpreise - 3 Frames */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nearest to the Pin */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1a472a] to-green-700 py-4">
            <CardTitle className="text-white text-sm flex items-center gap-2 justify-center"><Target className="w-5 h-5" />Nearest to the Pin</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-center">
            {(() => {
              const ntp = alleErgebnisse.find(e => (e.klasse?.toLowerCase() || '').includes('nearest') && !(e.klasse?.toLowerCase() || '').includes('2'));
              return ntp ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-[#1a472a]">{ntp.distanz || 'Gewonnen'}</p>
                  {ntp.distanz && <p className="text-xs text-gray-500">Meter</p>}
                  <p className="text-sm text-gray-600">Spieltag {ntp.spieltag}</p>
                  <p className="text-xs text-gray-400">{ntp.datum}</p>
                </div>
              ) : <p className="text-gray-400 text-sm py-4">Kein Gewinn</p>;
            })()}
          </CardContent>
        </Card>

        {/* Longest Drive */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1a472a] to-green-700 py-4">
            <CardTitle className="text-white text-sm flex items-center gap-2 justify-center"><Wind className="w-5 h-5" />Longest Drive</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-center">
            {(() => {
              const ld = alleErgebnisse.find(e => (e.klasse?.toLowerCase() || '').includes('longest'));
              return ld ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-[#1a472a]">{ld.distanz || 'Gewonnen'}</p>
                  {ld.distanz && <p className="text-xs text-gray-500">Meter</p>}
                  <p className="text-sm text-gray-600">Spieltag {ld.spieltag}</p>
                  <p className="text-xs text-gray-400">{ld.datum}</p>
                </div>
              ) : <p className="text-gray-400 text-sm py-4">Kein Gewinn</p>;
            })()}
          </CardContent>
        </Card>

        {/* Nearest to the Pin 2 */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#1a472a] to-green-700 py-4">
            <CardTitle className="text-white text-sm flex items-center gap-2 justify-center"><Target className="w-5 h-5" />Nearest to the Pin 2</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-center">
            {(() => {
              const ntp2 = alleErgebnisse.find(e => (e.klasse?.toLowerCase() || '').includes('nearest') && (e.klasse?.toLowerCase() || '').includes('2'));
              return ntp2 ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-[#1a472a]">{ntp2.distanz || 'Gewonnen'}</p>
                  {ntp2.distanz && <p className="text-xs text-gray-500">Meter</p>}
                  <p className="text-sm text-gray-600">Spieltag {ntp2.spieltag}</p>
                  <p className="text-xs text-gray-400">{ntp2.datum}</p>
                </div>
              ) : <p className="text-gray-400 text-sm py-4">Kein Gewinn</p>;
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BerichteAdmin({ kalender, saveBericht, selectedSpieltag, setSelectedSpieltag, berichtText, setBerichtText }: any) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  useEffect(() => { const termin = kalender.find((t: Turnier) => t.spieltag === selectedSpieltag); if (termin) setBerichtText(termin.bericht || ''); }, [selectedSpieltag, kalender, setBerichtText]);
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Spieltagsberichte</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {kalender.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-yellow-50 rounded-xl"><Calendar className="w-12 h-12 mx-auto mb-4 text-yellow-500" /><p className="font-medium">Keine Kalender-Daten vorhanden</p></div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-gray-700 mb-3">Vorhandene Berichte ({kalender.filter((t: Turnier) => t.bericht && t.bericht.trim().length > 0).length} von {kalender.length})</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{kalender.filter((t: Turnier) => t.bericht && t.bericht.trim().length > 0).sort((a: Turnier, b: Turnier) => a.spieltag - b.spieltag).map((t: Turnier) => (
                <button key={t.spieltag} onClick={() => setSelectedSpieltag(t.spieltag)} className={`p-2 rounded-lg text-left text-sm transition-all ${selectedSpieltag === t.spieltag ? 'bg-[#1a472a] text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}><span className="font-medium">Spieltag {t.spieltag}</span><span className="block text-xs opacity-70">{t.datum}</span></button>
              ))}</div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Spieltag auswählen</label><select value={selectedSpieltag} onChange={(e) => setSelectedSpieltag(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white">{kalender.sort((a: Turnier, b: Turnier) => a.spieltag - b.spieltag).map((t: Turnier) => (<option key={t.spieltag} value={t.spieltag}>Spieltag {t.spieltag} - {t.datum} - {t.name} {t.bericht && t.bericht.trim().length > 0 ? '(✓ Bericht)' : '(kein Bericht)'}</option>))}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Spieltagsbericht bearbeiten</label><textarea value={berichtText} onChange={(e) => setBerichtText(e.target.value)} placeholder="Hier den Spieltagsbericht eingeben..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white min-h-[250px] resize-y font-mono text-sm" /></div>
            <div className="flex items-center gap-4">
              <Button onClick={async () => { setSaveStatus('saving'); const result = await saveBericht(selectedSpieltag, berichtText); if (result.success) { setSaveStatus('success'); setSaveMessage('Bericht erfolgreich gespeichert!'); } else { setSaveStatus('error'); setSaveMessage(result.error || 'Fehler'); } }} disabled={saveStatus === 'saving'} className="bg-[#1a472a]">{saveStatus === 'saving' ? 'Speichern...' : <><Save className="w-4 h-4 mr-2" />Bericht speichern</>}</Button>
              {saveStatus === 'success' && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" />{saveMessage}</span>}
              {saveStatus === 'error' && <span className="text-red-600 text-sm">{saveMessage}</span>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function KalenderCRUD({ kalender, sponsoren, onAdd, onUpdate, onDelete }: { kalender: Turnier[]; sponsoren: any[]; onAdd: any; onUpdate: any; onDelete: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ spieltag: 1, datum: '', name: '', startzeit: '13:00', sponsor: '' });
  const resetForm = () => { setFormData({ spieltag: 1, datum: '', name: '', startzeit: '13:00', sponsor: '' }); setEditingId(null); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); const data = { spieltag: formData.spieltag, datum: formData.datum, name: formData.name, startzeit: formData.startzeit, sponsor: formData.sponsor || undefined }; if (editingId) { await onUpdate(editingId, data); } else { await onAdd(data); } resetForm(); setShowForm(false); };
  const handleEdit = (t: Turnier) => { setFormData({ spieltag: t.spieltag, datum: t.datum, name: t.name, startzeit: t.startzeit, sponsor: t.sponsor || '' }); setEditingId(t.id || null); setShowForm(true); };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Kalender verwalten ({kalender.length})</h3>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-[#1a472a]"><Plus className="w-4 h-4 mr-1" />{showForm ? 'Abbrechen' : 'Neuer Termin'}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-medium mb-3">{editingId ? 'Termin bearbeiten' : 'Neuer Termin'}</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label className="block text-xs text-gray-600 mb-1">Spieltag</label><input type="number" min={1} max={50} value={formData.spieltag} onChange={(e) => setFormData({...formData, spieltag: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Datum</label><input type="text" placeholder="TT.MM.JJJJ" value={formData.datum} onChange={(e) => setFormData({...formData, datum: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Name</label><input type="text" placeholder="Turniername" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Startzeit</label><input type="text" placeholder="13:00" value={formData.startzeit} onChange={(e) => setFormData({...formData, startzeit: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Sponsor</label><select value={formData.sponsor} onChange={(e) => setFormData({...formData, sponsor: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Kein Sponsor</option>{sponsoren.map((s: any) => (<option key={s.id} value={s.name}>{s.name}</option>))}</select></div>
          </div>
          <div className="flex gap-2 mt-4"><Button type="submit" className="bg-[#1a472a]"><Save className="w-4 h-4 mr-1" />Speichern</Button><Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Abbrechen</Button></div>
        </form>
      )}
      {kalender.length > 0 ? (
        <div className="max-h-96 overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">Spieltag</th><th className="px-3 py-2 text-left">Datum</th><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Startzeit</th><th className="px-3 py-2 text-left">Sponsor</th><th className="px-3 py-2 text-center">Aktionen</th></tr></thead>
            <tbody>{kalender.sort((a: Turnier, b: Turnier) => a.spieltag - b.spieltag).map((t: Turnier) => (
              <tr key={t.id || t.spieltag} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{t.spieltag}</td><td className="px-3 py-2">{t.datum}</td><td className="px-3 py-2">{t.name}</td><td className="px-3 py-2">{t.startzeit}</td><td className="px-3 py-2">{t.sponsor || '-'}</td>
                <td className="px-3 py-2 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button><button onClick={async () => { if (confirm(`"${t.name}" löschen?`)) { if (t.id) await onDelete(t.id); } }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : (<p className="text-gray-500 text-center py-4">Noch keine Termine vorhanden.</p>)}
    </div>
  );
}

// Korrekte Birdie-Daten aus der Birdieliste vom 22.04.2026 (Spieltag 2)
// Korrekturen vom Admin: Brand=8, Gehling=10, Poths=7/11/15

function BirdieCRUD() {
  const { birdies, addBirdie, deleteBirdie, deleteAllBirdies } = useData();
  const [spieltag, setSpieltag] = useState('');
  const [datum, setDatum] = useState('');
  const [spieler, setSpieler] = useState('');
  const [selectedLoch, setSelectedLoch] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  
  // Bearbeiten-Modus
  const [editMode, setEditMode] = useState(false);
  const [editSpieltag, setEditSpieltag] = useState('');
  const [editDatum, setEditDatum] = useState('');
  const [editSpieler, setEditSpieler] = useState('');
  const [editLocher, setEditLocher] = useState<number[]>([]);

  // Gruppiere Birdies nach Spieler+Spieltag für Anzeige
  const groupedBirdies = useMemo(() => {
    const map = new Map<string, { spieltag: number; datum: string; locher: number[]; ids: string[] }>();
    birdies.forEach((b: any) => {
      const key = `${b.spieltag}-${b.spieler}`;
      const ex = map.get(key);
      if (ex) { ex.locher.push(b.loch); if (b.id) ex.ids.push(b.id); }
      else { map.set(key, { spieltag: b.spieltag, datum: b.datum, locher: [b.loch], ids: b.id ? [b.id] : [] }); }
    });
    return Array.from(map.entries()).map(([key, data]) => {
      const [, spieler] = key.split('-', 2);
      return { spieler, ...data, locher: data.locher.sort((a, b) => a - b) };
    }).sort((a, b) => a.spieltag - b.spieltag || a.spieler.localeCompare(b.spieler));
  }, [birdies]);

  const handleAdd = async () => {
    if (!spieltag || !datum || !spieler || selectedLoch === null) {
      setError('Bitte Spieltag, Datum, Spieler und Bahn auswählen.');
      return;
    }
    setError(null);
    try {
      await addBirdie({ spieltag: parseInt(spieltag), datum, spieler, loch: selectedLoch });
      setResult(`Birdie gespeichert: ${spieler}, Bahn ${selectedLoch}`);
      setSelectedLoch(null);
      setSpieler('');
    } catch (err: any) { setError('Fehler: ' + err.message); }
  };


  const handleUpdate = async () => {
    if (!editSpieltag || !editDatum || !editSpieler || editLocher.length === 0) {
      setError('Bitte alle Felder ausfüllen und mindestens eine Bahn wählen.');
      return;
    }
    try {
      // Finde alle bestehenden Birdies dieses Spielers am diesem Spieltag
      const existingBirdies = birdies.filter((b: any) => 
        b.spieltag === parseInt(editSpieltag) && b.spieler === editSpieler
      );
      // Lösche alle bestehenden
      for (const b of existingBirdies) {
        if (b.id) await deleteBirdie(b.id);
      }
      // Füge neue für alle gewählten Bahnen hinzu
      for (const loch of editLocher) {
        await addBirdie({ spieltag: parseInt(editSpieltag), datum: editDatum, spieler: editSpieler, loch });
      }
      setResult(`${editLocher.length} Birdie${editLocher.length !== 1 ? 's' : ''} für ${editSpieler} gespeichert.`);
      setEditMode(false);
    } catch (err: any) { setError('Fehler: ' + err.message); }
  };

  const handleDeletePlayer = async (ids: string[]) => {
    if (!confirm('Diese Birdies löschen?')) return;
    for (const id of ids) { await deleteBirdie(id); }
    setResult('Gelöscht.');
  };

  const handleDeleteAll = async () => {
    if (!confirm('ALLE Birdies löschen?')) return;
    if (!confirm('WIRKLICH ALLE?')) return;
    await deleteAllBirdies();
    setShowDeleteAll(false);
    setResult('Alle Birdies gelöscht.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Birdies ({birdies.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setShowDeleteAll(!showDeleteAll)} className="text-red-600 border-red-200 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-1" />Alle löschen
        </Button>
      </div>

      {showDeleteAll && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm font-medium mb-2">Alle {birdies.length} Birdies löschen?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleDeleteAll}>Ja</Button>
            <Button size="sm" variant="outline" onClick={() => setShowDeleteAll(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {/* Bearbeiten-Formular */}
      {editMode && (
        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold text-blue-800">Birdies bearbeiten ({editSpieler})</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Spieltag</label><input type="number" value={editSpieltag} onChange={(e) => setEditSpieltag(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Datum</label><input type="text" value={editDatum} onChange={(e) => setEditDatum(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Spieler</label><input type="text" value={editSpieler} onChange={(e) => setEditSpieler(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bahnen mit Birdies (klicken zum hinzufügen/entfernen)</label>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(loch => (
                  <button 
                    key={loch} 
                    onClick={() => {
                      setEditLocher(prev => prev.includes(loch) ? prev.filter(l => l !== loch) : [...prev, loch].sort((a, b) => a - b));
                    }} 
                    className={`w-9 h-9 rounded text-sm font-medium transition-all ${editLocher.includes(loch) ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >{loch}</button>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-1">Blaue Bahnen = Birdies vorhanden. Klicken toggelt.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} disabled={!editSpieltag || !editDatum || !editSpieler || editLocher.length === 0} className="bg-blue-600">
                {editLocher.length} Birdie{editLocher.length !== 1 ? 's' : ''} speichern
              </Button>
              <Button variant="outline" onClick={() => { setEditMode(false); }}>Abbrechen</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Neues Birdie hinzufügen */}
      {!editMode && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h4 className="font-semibold text-gray-700">Neues Birdie hinzufügen</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Spieltag</label><input type="number" value={spieltag} onChange={(e) => setSpieltag(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="z.B. 2" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Datum</label><input type="text" value={datum} onChange={(e) => setDatum(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="TT.MM.JJJJ" /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Spieler</label><input type="text" value={spieler} onChange={(e) => setSpieler(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Name" /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bahn (Loch)</label>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(loch => (
                  <button key={loch} onClick={() => setSelectedLoch(loch)} className={`w-9 h-9 rounded text-sm font-medium transition-all ${selectedLoch === loch ? 'bg-[#1a472a] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{loch}</button>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!spieltag || !datum || !spieler || selectedLoch === null} className="bg-[#1a472a]">
              <Plus className="w-4 h-4 mr-1" />Birdie hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}

      {result && <p className="text-green-600 text-sm bg-green-50 p-2 rounded-lg">{result}</p>}
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}

      {/* Tabelle */}
      {groupedBirdies.length > 0 ? (
        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">Spieltag</th>
                <th className="px-3 py-2 text-left">Datum</th>
                <th className="px-3 py-2 text-left">Spieler</th>
                {Array.from({ length: 18 }, (_, i) => i + 1).map(loch => (
                  <th key={loch} className="px-1 py-2 text-center w-8">{loch}</th>
                ))}
                <th className="px-3 py-2 text-center">Anz.</th>
                <th className="px-3 py-2 text-center">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {groupedBirdies.map((p, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{p.spieltag}</td>
                  <td className="px-3 py-2 text-gray-500">{p.datum}</td>
                  <td className="px-3 py-2 font-medium">{p.spieler}</td>
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(loch => (
                    <td key={loch} className={`px-1 py-2 text-center text-xs ${p.locher.includes(loch) ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-300'}`}>
                      {p.locher.includes(loch) ? 'B' : ''}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold text-[#1a472a]">{p.locher.length}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Bearbeiten-Button: Zeigt Edit-Formular mit den Daten dieses Spielers */}
                      <button 
                        onClick={() => { 
                          setEditSpieltag(String(p.spieltag));
                          setEditDatum(p.datum);
                          setEditSpieler(p.spieler);
                          setEditLocher([...p.locher]); // Alle Bahnen übernehmen
                          setEditMode(true);
                          setResult(null);
                          setError(null);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePlayer(p.ids)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Alle Birdies dieses Spielers löschen">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">Noch keine Birdies vorhanden.</p>
      )}
    </div>
  );
}

function SponsorenCRUD({ sponsoren, sponsorLogos, onAdd, onUpdate, onDelete, onSaveLogo, fileToBase64 }: { sponsoren: any[]; sponsorLogos: Record<string, string>; onAdd: any; onUpdate: any; onDelete: any; onSaveLogo: any; fileToBase64: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [logoUrl, setLogoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const resetForm = () => { setFormData({ name: '', url: '' }); setLogoUrl(''); setSelectedFile(null); setError(''); setEditingId(null); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setIsSaving(true); try { let finalLogoUrl = logoUrl; if (selectedFile) { try { finalLogoUrl = await fileToBase64(selectedFile); } catch (err: any) { setError(err.message || 'Fehler'); setIsSaving(false); return; } } const data: any = { name: formData.name, url: formData.url || '' }; if (finalLogoUrl && finalLogoUrl.startsWith('data:')) data.logoUrl = finalLogoUrl; if (editingId) { await onUpdate(editingId, data); if (finalLogoUrl) await onSaveLogo(formData.name, finalLogoUrl); } else { await onAdd(data); if (finalLogoUrl) await onSaveLogo(formData.name, finalLogoUrl); } resetForm(); setShowForm(false); } catch (err: any) { setError('Fehler: ' + (err.message || 'Unbekannter Fehler')); } finally { setIsSaving(false); } };
  const handleEdit = (s: any) => { setFormData({ name: s.name, url: s.url || '' }); setLogoUrl(sponsorLogos[s.name] || s.logoUrl || ''); setSelectedFile(null); setError(''); setEditingId(s.id || null); setShowForm(true); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; if (file.size > 500 * 1024) { setError('Datei zu gross! Maximal 500KB.'); return; } setSelectedFile(file); setError(''); const reader = new FileReader(); reader.onload = (event) => { if (event.target?.result) setLogoUrl(event.target.result as string); }; reader.readAsDataURL(file); } };
  const handleDelete = async (s: any) => { if (confirm(`"${s.name}" wirklich loeschen?`)) { if (s.id) await onDelete(s.id); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Sponsoren verwalten ({sponsoren.length})</h3>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bg-[#1a472a]"><Plus className="w-4 h-4 mr-1" />{showForm ? 'Abbrechen' : 'Neuer Sponsor'}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-medium mb-3">{editingId ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}</h4>
          {error && (<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>)}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-600 mb-1">Name *</label><input type="text" placeholder="Sponsor Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Website URL</label><input type="url" placeholder="https://www.beispiel.de" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-600 mb-1">Logo hochladen (max. 500KB)</label><input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" onChange={handleFileChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" /></div>
          </div>
          {logoUrl && (<div className="mt-3 p-3 bg-white rounded-lg border border-gray-200"><p className="text-xs text-gray-500 mb-2">Logo Vorschau:</p><div className="flex items-center gap-4"><img src={logoUrl} alt="Logo Preview" className="h-20 w-auto object-contain" />{selectedFile && (<div className="text-sm text-green-600"><p>Datei: {selectedFile.name}</p><p>{(selectedFile.size / 1024).toFixed(1)} KB</p></div>)}</div></div>)}
          <div className="flex gap-2 mt-4"><Button type="submit" className="bg-[#1a472a]" disabled={isSaving}>{isSaving ? 'Speichern...' : <><Save className="w-4 h-4 mr-1" />Speichern</>}</Button><Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Abbrechen</Button></div>
        </form>
      )}
      {sponsoren.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sponsoren.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="h-24 flex items-center justify-center mb-3 bg-gray-50 rounded-lg p-2">
                {sponsorLogos[s.name] || s.logoUrl ? (
                  s.url ? (<a href={s.url} target="_blank" rel="noopener noreferrer" className="h-full flex items-center justify-center hover:opacity-80 transition-opacity" title={`${s.name} - ${s.url}`}><img src={sponsorLogos[s.name] || s.logoUrl} alt={s.name} className="h-full w-auto object-contain" /></a>) : (<img src={sponsorLogos[s.name] || s.logoUrl} alt={s.name} className="h-full w-auto object-contain" />)
                ) : (<div className="text-gray-400 text-sm">Kein Logo</div>)}
              </div>
              <p className="text-center font-medium text-sm mb-1">{s.name}</p>
              {s.url && (<p className="text-center text-xs text-blue-600 mb-2 truncate px-2"><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{s.url.replace(/^https?:\/\//, '')}</a></p>)}
              <div className="flex justify-center gap-1"><button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(s)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div>
            </div>
          ))}
        </div>
      ) : (<p className="text-gray-500 text-center py-4">Noch keine Sponsoren vorhanden.</p>)}
    </div>
  );
}

export default App;
