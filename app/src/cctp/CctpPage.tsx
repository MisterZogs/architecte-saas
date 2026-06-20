import { useState, useEffect } from 'react';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';
import { Input } from '../client/components/ui/input';
import { Label } from '../client/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../client/components/ui/select';
import { Checkbox } from '../client/components/ui/checkbox';
import { Textarea } from '../client/components/ui/textarea';
import { Progress } from '../client/components/ui/progress';
import { Separator } from '../client/components/ui/separator';
import { useToast } from '../client/hooks/use-toast';
import { Switch } from '../client/components/ui/switch';
import { Download, Loader2, CheckCircle2, FileDown, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';

const CCTP_URL = (import.meta.env as any).REACT_APP_CCTP_URL || 'http://localhost:8001';

const LOTS = [
  { key: 'gros_oeuvre', num: '02', label: 'Gros Œuvre / Maçonnerie' },
  { key: 'charpente_bois', num: '03', label: 'Charpente Bois' },
  { key: 'couverture', num: '04', label: 'Couverture / Étanchéité' },
  { key: 'menuiseries_ext', num: '05', label: 'Menuiseries Extérieures' },
  { key: 'menuiseries_int', num: '06', label: 'Menuiseries Intérieures' },
  { key: 'isolation', num: '07', label: 'Isolation' },
  { key: 'cloisons', num: '08', label: 'Cloisons / Doublages / Faux-plafonds' },
  { key: 'revetements_sol', num: '09', label: 'Revêtements de Sol' },
  { key: 'carrelage', num: '10', label: 'Carrelage / Faïence' },
  { key: 'peinture', num: '11', label: 'Peinture / Enduits' },
  { key: 'plomberie', num: '12', label: 'Plomberie / Sanitaires' },
  { key: 'chauffage_cvc', num: '13', label: 'Chauffage / VMC / Climatisation' },
  { key: 'electricite', num: '14', label: 'Électricité CFO/CFA' },
  { key: 'vrd', num: '15', label: 'VRD / Espaces Extérieurs' },
] as const;

type LotKey = (typeof LOTS)[number]['key'];
type Step = 'form' | 'generating' | 'result';

interface CctpResult {
  id: string;
  lot_numero: string;
  lot_nom: string;
  content: string;
}

interface ProjectForm {
  name: string;
  type_projet: string;
  usage: string;
  type_erp: string;
  zone_climatique: string;
  zone_sismique: string;
  pmr: boolean;
  specificites: string;
}

export default function CctpPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<ProjectForm>({
    name: '',
    type_projet: 'neuf',
    usage: 'logement',
    type_erp: '',
    zone_climatique: 'H2b',
    zone_sismique: '2',
    pmr: false,
    specificites: '',
  });
  const [selectedLots, setSelectedLots] = useState<Set<LotKey>>(new Set());
  const [results, setResults] = useState<CctpResult[]>([]);
  const [expandedLot, setExpandedLot] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingLot, setSavingLot] = useState<string | null>(null);
  const [generatingLot, setGeneratingLot] = useState<string>('');
  const [doneCount, setDoneCount] = useState(0);

  const toggleLot = (key: LotKey) =>
    setSelectedLots(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleGenerate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nom du projet requis', variant: 'destructive' });
      return;
    }
    if (selectedLots.size === 0) {
      toast({ title: 'Sélectionnez au moins un lot', variant: 'destructive' });
      return;
    }

    setStep('generating');
    setDoneCount(0);
    setResults([]);

    try {
      const projRes = await fetch(`${CCTP_URL}/api/v1/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!projRes.ok) throw new Error('Erreur création projet');
      const project = await projRes.json();

      const lotsList = LOTS.filter(l => selectedLots.has(l.key));
      const generated: CctpResult[] = [];

      for (const lot of lotsList) {
        setGeneratingLot(lot.label);
        const res = await fetch(`${CCTP_URL}/api/v1/projects/${project.id}/cctp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lot_key: lot.key, lot_numero: lot.num }),
        });
        if (!res.ok) {
          toast({ title: `Erreur lot ${lot.label}`, variant: 'destructive' });
          continue;
        }
        generated.push(await res.json());
        setDoneCount(prev => prev + 1);
      }

      setResults(generated);
      setStep('result');
      if (generated.length > 0) setExpandedLot(generated[0].id);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setStep('form');
    }
  };

  const downloadLot = async (cctp: CctpResult) => {
    const res = await fetch(`${CCTP_URL}/api/v1/cctp/${cctp.id}/export`);
    if (!res.ok) return toast({ title: 'Erreur export', variant: 'destructive' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCTP_Lot${cctp.lot_numero}_${cctp.lot_nom.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => results.forEach(downloadLot);

  const startEdit = (cctp: CctpResult) => {
    setEditingLot(cctp.id);
    setEditContent(cctp.content);
    setExpandedLot(cctp.id);
  };

  const cancelEdit = () => {
    setEditingLot(null);
    setEditContent('');
  };

  const saveEdit = async (cctp: CctpResult) => {
    setSavingLot(cctp.id);
    try {
      const res = await fetch(`${CCTP_URL}/api/v1/cctp/${cctp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      const updated = await res.json();
      setResults(prev => prev.map(r => r.id === cctp.id ? { ...r, content: updated.content } : r));
      setEditingLot(null);
      setEditContent('');
      toast({ title: 'CCTP sauvegardé' });
    } catch (err: any) {
      toast({ title: 'Erreur sauvegarde', description: err.message, variant: 'destructive' });
    } finally {
      setSavingLot(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Générateur de CCTP</h1>
        <p className="text-muted-foreground mt-1">
          Générez automatiquement un CCTP complet et à jour réglementairement pour chaque lot.
        </p>
      </div>

      {step === 'form' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1 — Projet</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nom du projet</Label>
                <Input
                  placeholder="ex. Rénovation Villa Beaumont"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type de projet</Label>
                <Select value={form.type_projet} onValueChange={v => setForm(f => ({ ...f, type_projet: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Construction neuve</SelectItem>
                    <SelectItem value="renovation">Rénovation</SelectItem>
                    <SelectItem value="extension">Extension</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Usage</Label>
                <Select value={form.usage} onValueChange={v => setForm(f => ({ ...f, usage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logement">Logement</SelectItem>
                    <SelectItem value="tertiaire">Tertiaire</SelectItem>
                    <SelectItem value="erp">ERP</SelectItem>
                    <SelectItem value="industrie">Industrie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zone climatique</Label>
                <Select value={form.zone_climatique} onValueChange={v => setForm(f => ({ ...f, zone_climatique: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['H1a', 'H1b', 'H1c', 'H2a', 'H2b', 'H2c', 'H3'].map(z => (
                      <SelectItem key={z} value={z}>{z}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Zone sismique</Label>
                <Select value={form.zone_sismique} onValueChange={v => setForm(f => ({ ...f, zone_sismique: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['0', '1', '2', '3', '4'].map(z => (
                      <SelectItem key={z} value={z}>Zone {z}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <Switch
                  checked={form.pmr}
                  onCheckedChange={v => setForm(f => ({ ...f, pmr: v }))}
                />
                <Label>Accessibilité PMR</Label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Spécificités particulières <span className="text-muted-foreground">(optionnel)</span></Label>
                <Textarea
                  placeholder="ex. Bâtiment en zone inondable, présence d'amiante, site classé…"
                  value={form.specificites}
                  onChange={e => setForm(f => ({ ...f, specificites: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2 — Lots à traiter</CardTitle>
              <CardDescription>Sélectionnez les lots pour lesquels générer un CCTP.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {LOTS.map(lot => (
                  <div key={lot.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedLots.has(lot.key)}
                      onCheckedChange={() => toggleLot(lot.key)}
                    />
                    <label
                      className="text-sm cursor-pointer select-none"
                      onClick={() => toggleLot(lot.key)}
                    >
                      <span className="font-mono text-muted-foreground mr-1">{lot.num}</span>
                      {lot.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {selectedLots.size} lot{selectedLots.size > 1 ? 's' : ''} sélectionné{selectedLots.size > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleGenerate} disabled={selectedLots.size === 0}>
            Générer les CCTP ({selectedLots.size} lot{selectedLots.size > 1 ? 's' : ''}) →
          </Button>
        </div>
      )}

      {step === 'generating' && (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">Génération en cours…</p>
            <p className="text-sm text-muted-foreground">{generatingLot}</p>
            <Progress value={(doneCount / selectedLots.size) * 100} className="max-w-sm mx-auto" />
            <p className="text-sm text-muted-foreground">{doneCount} / {selectedLots.size} lots</p>
          </CardContent>
        </Card>
      )}

      {step === 'result' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">{results.length} CCTP générés</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep('form'); setResults([]); }}>
                Nouveau projet
              </Button>
              <Button onClick={downloadAll} className="flex gap-2">
                <Download className="h-4 w-4" /> Tout télécharger
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {results.map(cctp => (
              <Card key={cctp.id}>
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => editingLot !== cctp.id && setExpandedLot(expandedLot === cctp.id ? null : cctp.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      LOT {cctp.lot_numero} — {cctp.lot_nom}
                    </CardTitle>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {editingLot === cctp.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => saveEdit(cctp)}
                            disabled={savingLot === cctp.id}
                            className="flex gap-1"
                          >
                            {savingLot === cctp.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Check className="h-3 w-3" />}
                            Sauvegarder
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="flex gap-1">
                            <X className="h-3 w-3" /> Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(cctp)} className="flex gap-1">
                            <Pencil className="h-3 w-3" /> Éditer
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadLot(cctp)} className="flex gap-1">
                            <FileDown className="h-4 w-4" /> .docx
                          </Button>
                        </>
                      )}
                      {expandedLot === cctp.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
                {expandedLot === cctp.id && (
                  <CardContent>
                    {editingLot === cctp.id ? (
                      <textarea
                        className="w-full min-h-[400px] font-mono text-sm leading-relaxed bg-muted/30 border border-input rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        spellCheck={false}
                      />
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-[500px] overflow-y-auto">
                        {cctp.content}
                      </pre>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
