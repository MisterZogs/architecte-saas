import { useState, useRef } from 'react';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';
import { Input } from '../client/components/ui/input';
import { Textarea } from '../client/components/ui/textarea';
import { Progress } from '../client/components/ui/progress';
import { useToast } from '../client/hooks/use-toast';
import {
  Mic, FileText, Download, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Upload, Pencil, Plus, X, Check,
} from 'lucide-react';

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

interface Participant {
  nom: string;
  qualite: string;
  entreprise: string;
}

interface CrData {
  numero_cr: number | null;
  date_reunion: string;
  lieu: string;
  presents: Participant[];
  absents: Participant[];
  lots: CrLot[];
  divers: string[];
  prochaine_reunion: { date: string; lieu: string };
  diffusion: string[];
}

// Inline editable field — renders plain text or an input/textarea depending on `editing`
function EF({
  value, onChange, editing, placeholder = '', multiline = false, className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  if (!editing) {
    return <span className={className}>{value || <span className="text-muted-foreground">—</span>}</span>;
  }
  if (multiline) {
    return (
      <textarea
        className={`w-full bg-muted/30 border border-input rounded px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        rows={2}
      />
    );
  }
  return (
    <input
      type="text"
      className={`bg-muted/30 border-b border-input focus:outline-none focus:border-primary w-full px-1 ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
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
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLot = (num: string) =>
    setExpandedLots(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });

  // Generic deep-clone update via dotted path
  const update = (path: (string | number)[], value: any) => {
    setCrData(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      let obj: any = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const addParticipant = (key: 'presents' | 'absents') =>
    setCrData(prev => prev ? { ...prev, [key]: [...prev[key], { nom: '', qualite: '', entreprise: '' }] } : prev);

  const removeParticipant = (key: 'presents' | 'absents', idx: number) =>
    setCrData(prev => prev ? { ...prev, [key]: prev[key].filter((_, i) => i !== idx) } : prev);

  const addPoint = (lotIdx: number) =>
    setCrData(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.lots[lotIdx].points.push({ description: '', decision: '', action: '', responsable: '', delai: '' });
      return next;
    });

  const removePoint = (lotIdx: number, ptIdx: number) =>
    setCrData(prev => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.lots[lotIdx].points.splice(ptIdx, 1);
      return next;
    });

  const addDivers = () =>
    setCrData(prev => prev ? { ...prev, divers: [...prev.divers, ''] } : prev);

  const removeDivers = (idx: number) =>
    setCrData(prev => prev ? { ...prev, divers: prev.divers.filter((_, i) => i !== idx) } : prev);

  const addDiffusion = () =>
    setCrData(prev => prev ? { ...prev, diffusion: [...prev.diffusion, ''] } : prev);

  const removeDiffusion = (idx: number) =>
    setCrData(prev => prev ? { ...prev, diffusion: prev.diffusion.filter((_, i) => i !== idx) } : prev);

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
      setIsEditing(false);
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

      {/* ── Étape 1 : saisie ── */}
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

      {/* ── Étape 2 : traitement ── */}
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

      {/* ── Étape 3 : résultat + édition inline ── */}
      {step === 'result' && crData && (
        <div className="space-y-4">

          {/* Barre d'actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Compte rendu généré</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setStep('input'); setProgress(0); setCrData(null); setIsEditing(false); }}
              >
                Nouveau CR
              </Button>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={() => setIsEditing(prev => !prev)}
                className="flex gap-2"
              >
                {isEditing
                  ? <><Check className="h-4 w-4" /> Terminer</>
                  : <><Pencil className="h-4 w-4" /> Éditer</>}
              </Button>
              <Button onClick={handleDownload} className="flex gap-2">
                <Download className="h-4 w-4" /> Télécharger Word
              </Button>
            </div>
          </div>

          {/* En-tête du CR */}
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">N° CR :</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="bg-muted/30 border-b border-input focus:outline-none focus:border-primary w-20 px-1"
                      value={crData.numero_cr ?? ''}
                      placeholder="—"
                      onChange={e => update(['numero_cr'], e.target.value ? Number(e.target.value) : null)}
                    />
                  ) : (
                    <span>{crData.numero_cr ?? '—'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">Projet :</span>
                  <span>{projet}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">Date :</span>
                  <EF
                    value={crData.date_reunion || ''}
                    onChange={v => update(['date_reunion'], v)}
                    editing={isEditing}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">Lieu :</span>
                  <EF
                    value={crData.lieu || ''}
                    onChange={v => update(['lieu'], v)}
                    editing={isEditing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">Prochaine réunion :</span>
                  <EF
                    value={crData.prochaine_reunion?.date || ''}
                    onChange={v => update(['prochaine_reunion', 'date'], v)}
                    editing={isEditing}
                    placeholder="date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium shrink-0">Lieu suivant :</span>
                  <EF
                    value={crData.prochaine_reunion?.lieu || ''}
                    onChange={v => update(['prochaine_reunion', 'lieu'], v)}
                    editing={isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Présents / Absents */}
          {(crData.presents?.length > 0 || isEditing) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Présents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {crData.presents.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {isEditing ? (
                      <>
                        <EF value={p.nom} onChange={v => update(['presents', i, 'nom'], v)} editing placeholder="Nom" className="flex-1" />
                        <EF value={p.qualite} onChange={v => update(['presents', i, 'qualite'], v)} editing placeholder="Qualité" className="flex-1" />
                        <EF value={p.entreprise} onChange={v => update(['presents', i, 'entreprise'], v)} editing placeholder="Entreprise" className="flex-1" />
                        <button onClick={() => removeParticipant('presents', i)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span>• {[p.nom, p.qualite, p.entreprise].filter(Boolean).join(' — ')}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button onClick={() => addParticipant('presents')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                    <Plus className="h-3 w-3" /> Ajouter un présent
                  </button>
                )}

                {(crData.absents?.length > 0 || isEditing) && (
                  <>
                    <p className="text-sm font-medium mt-4 text-muted-foreground">Absents excusés</p>
                    {crData.absents.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {isEditing ? (
                          <>
                            <EF value={p.nom} onChange={v => update(['absents', i, 'nom'], v)} editing placeholder="Nom" className="flex-1" />
                            <EF value={p.qualite} onChange={v => update(['absents', i, 'qualite'], v)} editing placeholder="Qualité" className="flex-1" />
                            <EF value={p.entreprise} onChange={v => update(['absents', i, 'entreprise'], v)} editing placeholder="Entreprise" className="flex-1" />
                            <button onClick={() => removeParticipant('absents', i)} className="text-muted-foreground hover:text-destructive shrink-0">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span>• {[p.nom, p.qualite, p.entreprise].filter(Boolean).join(' — ')}</span>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button onClick={() => addParticipant('absents')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                        <Plus className="h-3 w-3" /> Ajouter un absent
                      </button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lots */}
          <div className="space-y-2">
            {crData.lots?.map((lot, lotIdx) => (
              <Card key={lot.numero}>
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => !isEditing && toggleLot(lot.numero)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      LOT {lot.numero} — {lot.nom}
                      {isEditing ? (
                        <EF
                          value={lot.entreprise}
                          onChange={v => update(['lots', lotIdx, 'entreprise'], v)}
                          editing
                          placeholder="Entreprise"
                          className="font-normal text-muted-foreground text-sm"
                        />
                      ) : (
                        lot.entreprise && (
                          <span className="text-muted-foreground font-normal">({lot.entreprise})</span>
                        )
                      )}
                    </CardTitle>
                    {!isEditing && (
                      expandedLots.has(lot.numero)
                        ? <ChevronUp className="h-4 w-4 shrink-0" />
                        : <ChevronDown className="h-4 w-4 shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {(isEditing || expandedLots.has(lot.numero)) && (
                  <CardContent className="space-y-4">
                    {lot.points?.map((pt, ptIdx) => (
                      <div key={ptIdx} className="text-sm border-l-2 border-muted pl-3 space-y-1">
                        {isEditing ? (
                          <>
                            <div className="flex items-start gap-2">
                              <EF
                                value={pt.description}
                                onChange={v => update(['lots', lotIdx, 'points', ptIdx, 'description'], v)}
                                editing
                                multiline
                                placeholder="Description du point"
                                className="flex-1"
                              />
                              <button
                                onClick={() => removePoint(lotIdx, ptIdx)}
                                className="text-muted-foreground hover:text-destructive mt-1 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {(['decision', 'action', 'responsable', 'delai'] as const).map(field => (
                              <div key={field} className="flex items-center gap-2">
                                <span className="font-medium shrink-0 w-24 text-xs text-muted-foreground">
                                  {field === 'delai' ? 'Délai' : field.charAt(0).toUpperCase() + field.slice(1)} :
                                </span>
                                <EF
                                  value={pt[field]}
                                  onChange={v => update(['lots', lotIdx, 'points', ptIdx, field], v)}
                                  editing
                                  placeholder="—"
                                  className="flex-1"
                                />
                              </div>
                            ))}
                          </>
                        ) : (
                          <>
                            <p>{pt.description}</p>
                            {pt.decision && <p><span className="font-medium">Décision :</span> {pt.decision}</p>}
                            {pt.action && <p><span className="font-medium">Action :</span> {pt.action}</p>}
                            {pt.responsable && <p><span className="font-medium">Responsable :</span> {pt.responsable}</p>}
                            {pt.delai && <p><span className="font-medium">Délai :</span> {pt.delai}</p>}
                          </>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        onClick={() => addPoint(lotIdx)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-3 w-3" /> Ajouter un point
                      </button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Divers */}
          {(crData.divers?.filter(Boolean).length > 0 || isEditing) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Questions / Divers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {crData.divers.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {isEditing ? (
                      <>
                        <EF
                          value={d}
                          onChange={v => update(['divers', i], v)}
                          editing
                          multiline
                          placeholder="Point divers…"
                          className="flex-1"
                        />
                        <button onClick={() => removeDivers(i)} className="text-muted-foreground hover:text-destructive shrink-0 mt-1">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span>• {d}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button onClick={addDivers} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                    <Plus className="h-3 w-3" /> Ajouter
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Diffusion */}
          {(crData.diffusion?.filter(Boolean).length > 0 || isEditing) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Diffusion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {crData.diffusion.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {isEditing ? (
                      <>
                        <EF
                          value={d}
                          onChange={v => update(['diffusion', i], v)}
                          editing
                          placeholder="Nom — Entreprise"
                          className="flex-1"
                        />
                        <button onClick={() => removeDiffusion(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span>• {d}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button onClick={addDiffusion} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                    <Plus className="h-3 w-3" /> Ajouter
                  </button>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </div>
  );
}
