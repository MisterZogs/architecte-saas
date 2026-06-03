import { useState, useRef } from 'react';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';
import { Input } from '../client/components/ui/input';
import { Label } from '../client/components/ui/label';
import { Textarea } from '../client/components/ui/textarea';
import { Progress } from '../client/components/ui/progress';
import { Separator } from '../client/components/ui/separator';
import { useToast } from '../client/hooks/use-toast';
import { Mic, FileText, Download, ChevronDown, ChevronUp, Loader2, CheckCircle2, Upload } from 'lucide-react';

const CR_URL = (import.meta.env as any).REACT_APP_CR_URL || 'http://localhost:8003';

type InputMode = 'audio' | 'text';
type Step = 'input' | 'processing' | 'result';

interface CrPoint {
  description: string;
  decision: string;
  action: string;
  responsable: string;
  delai: string;
}

interface CrLot {
  numero: string;
  nom: string;
  entreprise: string;
  points: CrPoint[];
}

interface CrData {
  numero_cr: number | null;
  date_reunion: string;
  lieu: string;
  presents: { nom: string; qualite: string; entreprise: string }[];
  absents: { nom: string; qualite: string; entreprise: string }[];
  lots: CrLot[];
  divers: string[];
  prochaine_reunion: { date: string; lieu: string };
  diffusion: string[];
}

export default function CrChantierPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('input');
  const [mode, setMode] = useState<InputMode>('audio');
  const [projet, setProjet] = useState('');
  const [transcription, setTranscription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [crData, setCrData] = useState<CrData | null>(null);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLot = (num: string) =>
    setExpandedLots(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setAudioFile(file);
  };

  const handleGenerate = async () => {
    if (!projet.trim()) {
      toast({ title: 'Nom du projet requis', variant: 'destructive' });
      return;
    }
    if (mode === 'audio' && !audioFile) {
      toast({ title: 'Fichier audio requis', variant: 'destructive' });
      return;
    }
    if (mode === 'text' && !transcription.trim()) {
      toast({ title: 'Transcription requise', variant: 'destructive' });
      return;
    }

    setStep('processing');
    setProgress(10);

    try {
      let finalTranscription = transcription;

      if (mode === 'audio' && audioFile) {
        setProgressLabel('Transcription audio en cours…');
        setProgress(20);
        const formData = new FormData();
        formData.append('audio', audioFile);
        const transcribeRes = await fetch(`${CR_URL}/api/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!transcribeRes.ok) throw new Error('Erreur transcription');
        const { transcription: t } = await transcribeRes.json();
        finalTranscription = t;
        setProgress(60);
      }

      setProgressLabel('Structuration du compte rendu…');
      setProgress(70);
      const structureRes = await fetch(`${CR_URL}/api/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: finalTranscription, projet }),
      });
      if (!structureRes.ok) throw new Error('Erreur structuration');
      const cr = await structureRes.json();

      setProgress(100);
      setCrData(cr);
      setExpandedLots(new Set(cr.lots?.map((l: CrLot) => l.numero) ?? []));
      setStep('result');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setStep('input');
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    if (!crData) return;
    try {
      const res = await fetch(`${CR_URL}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cr: crData, projet }),
      });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CR_Chantier_${projet.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: 'Erreur export', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">CR de Chantier</h1>
        <p className="text-muted-foreground mt-1">
          Transformez un enregistrement ou une transcription en compte rendu structuré Word.
        </p>
      </div>

      {step === 'input' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1 — Nom du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="ex. Maison Dupont — 12 rue des Lilas, Lyon"
                value={projet}
                onChange={e => setProjet(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2 — Source</CardTitle>
              <CardDescription>Choisissez entre un fichier audio ou une transcription texte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={mode === 'audio' ? 'default' : 'outline'}
                  onClick={() => setMode('audio')}
                  className="flex gap-2"
                >
                  <Mic className="h-4 w-4" /> Audio
                </Button>
                <Button
                  variant={mode === 'text' ? 'default' : 'outline'}
                  onClick={() => setMode('text')}
                  className="flex gap-2"
                >
                  <FileText className="h-4 w-4" /> Transcription texte
                </Button>
              </div>

              {mode === 'audio' && (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleAudioDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.m4a,.wav,.ogg,.webm"
                    className="hidden"
                    onChange={e => setAudioFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  {audioFile ? (
                    <p className="font-medium text-primary">{audioFile.name}</p>
                  ) : (
                    <>
                      <p className="font-medium">Glissez un fichier audio ici</p>
                      <p className="text-sm text-muted-foreground">MP3, M4A, WAV — jusqu'à 200 Mo</p>
                    </>
                  )}
                </div>
              )}

              {mode === 'text' && (
                <Textarea
                  placeholder="Collez ici la transcription brute de la réunion…"
                  className="min-h-[200px] font-mono text-sm"
                  value={transcription}
                  onChange={e => setTranscription(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleGenerate}>
            Générer le compte rendu →
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium">{progressLabel || 'Traitement en cours…'}</p>
            <Progress value={progress} className="max-w-sm mx-auto" />
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {step === 'result' && crData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Compte rendu généré</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep('input'); setProgress(0); setCrData(null); }}>
                Nouveau CR
              </Button>
              <Button onClick={handleDownload} className="flex gap-2">
                <Download className="h-4 w-4" /> Télécharger Word
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-4 space-y-1 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium">Projet :</span> {projet}</div>
                <div><span className="font-medium">Date :</span> {crData.date_reunion || '—'}</div>
                <div><span className="font-medium">Lieu :</span> {crData.lieu || '—'}</div>
                <div>
                  <span className="font-medium">Prochaine réunion :</span>{' '}
                  {crData.prochaine_reunion?.date || '—'}
                </div>
              </div>
            </CardContent>
          </Card>

          {crData.presents?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Présents</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {crData.presents.map((p, i) => (
                    <li key={i}>• {[p.nom, p.qualite, p.entreprise].filter(Boolean).join(' — ')}</li>
                  ))}
                </ul>
                {crData.absents?.length > 0 && (
                  <>
                    <p className="text-sm font-medium mt-3 text-muted-foreground">Absents excusés</p>
                    <ul className="text-sm space-y-1 mt-1">
                      {crData.absents.map((p, i) => (
                        <li key={i}>• {[p.nom, p.qualite, p.entreprise].filter(Boolean).join(' — ')}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {crData.lots?.map(lot => (
              <Card key={lot.numero}>
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => toggleLot(lot.numero)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      LOT {lot.numero} — {lot.nom}
                      {lot.entreprise && <span className="text-muted-foreground font-normal"> ({lot.entreprise})</span>}
                    </CardTitle>
                    {expandedLots.has(lot.numero) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>
                {expandedLots.has(lot.numero) && (
                  <CardContent className="space-y-3">
                    {lot.points?.map((pt, i) => (
                      <div key={i} className="text-sm border-l-2 border-muted pl-3 space-y-1">
                        <p>{pt.description}</p>
                        {pt.decision && <p><span className="font-medium">Décision :</span> {pt.decision}</p>}
                        {pt.action && <p><span className="font-medium">Action :</span> {pt.action}</p>}
                        {pt.responsable && <p><span className="font-medium">Responsable :</span> {pt.responsable}</p>}
                        {pt.delai && <p><span className="font-medium">Délai :</span> {pt.delai}</p>}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {crData.divers?.filter(Boolean).length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Questions / Divers</CardTitle></CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {crData.divers.filter(Boolean).map((d, i) => <li key={i}>• {d}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
