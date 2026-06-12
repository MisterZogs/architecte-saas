import { useState } from 'react';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../client/components/ui/card';
import { Input } from '../client/components/ui/input';
import { Label } from '../client/components/ui/label';
import { Progress } from '../client/components/ui/progress';
import { useToast } from '../client/hooks/use-toast';
import { Download, Loader2, CheckCircle2, XCircle, AlertCircle, MapPin, Search } from 'lucide-react';

const PLU_URL = (import.meta.env as any).REACT_APP_PLU_URL || 'http://localhost:8002';

type Step = 'adresse' | 'projet' | 'verifying' | 'rapport';

interface ZoneInfo {
  zone: string;
  type_zone: string;
  commune: string;
  id_urba: string;
  date_document: string;
  lat?: number;
  lon?: number;
}

interface Verif {
  article: string;
  statut: 'CONFORME' | 'NON_CONFORME' | 'A_VERIFIER' | 'NON_APPLICABLE';
  valeur_projet: string;
  valeur_reglementaire: string;
  commentaire: string;
}

interface Rapport {
  commune: string;
  zone: string;
  date_document_plu: string;
  adresse: string;
  verifications: Verif[];
}

interface ProjetForm {
  surface_plancher: string;
  emprise_sol: string;
  surface_parcelle: string;
  hauteur_egout: string;
  hauteur_faitage: string;
  recul_voie: string;
  recul_nord: string;
  recul_sud: string;
  recul_est: string;
  recul_ouest: string;
  nb_logements: string;
  nb_places: string;
}


const statutConfig = {
  CONFORME: { label: 'Conforme', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  NON_CONFORME: { label: 'Non conforme', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  A_VERIFIER: { label: 'À vérifier', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  NON_APPLICABLE: { label: 'Non applicable', icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200' },
};

export default function PluPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('adresse');
  const [adresse, setAdresse] = useState('');
  const [adresseNormalisee, setAdresseNormalisee] = useState('');
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | null>(null);
  const [loadingZone, setLoadingZone] = useState(false);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [projet, setProjet] = useState<ProjetForm>({
    surface_plancher: '',
    emprise_sol: '',
    surface_parcelle: '',
    hauteur_egout: '',
    hauteur_faitage: '',
    recul_voie: '',
    recul_nord: '',
    recul_sud: '',
    recul_est: '',
    recul_ouest: '',
    nb_logements: '1',
    nb_places: '0',
  });

  const checkZone = async () => {
    if (!adresse.trim()) return;
    setLoadingZone(true);
    try {
      const res = await fetch(`${PLU_URL}/api/zone?adresse=${encodeURIComponent(adresse)}`);
      if (!res.ok) throw new Error('Adresse introuvable ou PLU non disponible');
      const data = await res.json();
      setAdresseNormalisee(data.adresse_normalisee || adresse);
      setZoneInfo({
        zone: data.zone,
        type_zone: data.type_zone,
        commune: data.commune,
        id_urba: data.id_urba,
        date_document: data.nom_fichier_reglement || '—',
        lat: data.lat,
        lon: data.lon,
      });
      setStep('projet');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingZone(false);
    }
  };

  const handleVerify = async () => {
    setStep('verifying');
    try {
      const body = {
        adresse,
        projet: {
          surface_plancher: parseFloat(projet.surface_plancher) || 0,
          emprise_sol: parseFloat(projet.emprise_sol) || 0,
          surface_parcelle: parseFloat(projet.surface_parcelle) || 0,
          hauteur_egout: parseFloat(projet.hauteur_egout) || 0,
          hauteur_faitage: parseFloat(projet.hauteur_faitage) || 0,
          recul_voie: parseFloat(projet.recul_voie) || 0,
          recul_nord: parseFloat(projet.recul_nord) || 0,
          recul_sud: parseFloat(projet.recul_sud) || 0,
          recul_est: parseFloat(projet.recul_est) || 0,
          recul_ouest: parseFloat(projet.recul_ouest) || 0,
          nb_logements: parseInt(projet.nb_logements) || 1,
          nb_places: parseInt(projet.nb_places) || 0,
        },
      };

      const res = await fetch(`${PLU_URL}/api/verifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur vérification');
      }
      const data = await res.json();
      setRapport(data.rapport);
      setStep('rapport');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setStep('projet');
    }
  };

  const downloadPdf = async () => {
    if (!rapport) return;
    try {
      const res = await fetch(`${PLU_URL}/api/rapport/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rapport),
      });
      if (!res.ok) throw new Error('Erreur export PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rapport_PLU_${rapport.commune}_${rapport.zone}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    }
  };

  const numField = (key: keyof ProjetForm, label: string, unit: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.1"
          value={projet[key]}
          onChange={e => setProjet(p => ({ ...p, [key]: e.target.value }))}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );

  const verifications = rapport?.verifications ?? [];
  const nbConformes = verifications.filter(v => v.statut === 'CONFORME').length;
  const nbNonConformes = verifications.filter(v => v.statut === 'NON_CONFORME').length;
  const nbAVerifier = verifications.filter(v => v.statut === 'A_VERIFIER').length;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Assistant PLU</h1>
        <p className="text-muted-foreground mt-1">
          Vérifiez la conformité de votre projet au Plan Local d'Urbanisme en quelques minutes.
        </p>
      </div>

      {step === 'adresse' && (
        <Card>
          <CardHeader>
            <CardTitle>Adresse du terrain</CardTitle>
            <CardDescription>Entrez l'adresse pour identifier automatiquement la zone PLU.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ex. 24 rue de la Paix, 75002 Paris"
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkZone()}
                className="flex-1"
              />
              <Button onClick={checkZone} disabled={loadingZone || !adresse.trim()} className="flex gap-2">
                {loadingZone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Identifier la zone
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(step === 'projet' || step === 'verifying') && zoneInfo && (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-blue-900">{adresseNormalisee}</p>
                  {adresseNormalisee.toLowerCase() !== adresse.toLowerCase() && (
                    <p className="text-xs text-blue-600 italic">Saisie originale : « {adresse} »</p>
                  )}
                  <p>
                    Zone <span className="font-bold">{zoneInfo.zone}</span>{' '}
                    <span className="text-muted-foreground">({zoneInfo.type_zone})</span>
                    {' — '}{zoneInfo.commune}
                  </p>
                  <p className="text-xs text-muted-foreground">ID document : {zoneInfo.id_urba}</p>
                </div>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={() => { setStep('adresse'); setZoneInfo(null); setAdresseNormalisee(''); }}>
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">SURFACES</p>
                <div className="grid grid-cols-3 gap-4">
                  {numField('surface_plancher', 'Surface de plancher', 'm²')}
                  {numField('emprise_sol', 'Emprise au sol', 'm²')}
                  {numField('surface_parcelle', 'Surface parcelle', 'm²')}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">HAUTEURS</p>
                <div className="grid grid-cols-2 gap-4">
                  {numField('hauteur_egout', 'Hauteur à l\'égout', 'm')}
                  {numField('hauteur_faitage', 'Hauteur au faîtage', 'm')}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">RECULS</p>
                <div className="grid grid-cols-2 gap-4">
                  {numField('recul_voie', 'Recul front de rue', 'm')}
                  {numField('recul_nord', 'Recul Nord', 'm')}
                  {numField('recul_sud', 'Recul Sud', 'm')}
                  {numField('recul_est', 'Recul Est', 'm')}
                  {numField('recul_ouest', 'Recul Ouest', 'm')}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3 text-muted-foreground">STATIONNEMENT</p>
                <div className="grid grid-cols-2 gap-4">
                  {numField('nb_logements', 'Nombre de logements', '')}
                  {numField('nb_places', 'Places de stationnement', '')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleVerify}
            disabled={step === 'verifying'}
          >
            {step === 'verifying' ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Vérification en cours…</>
            ) : (
              'Vérifier la conformité PLU →'
            )}
          </Button>
        </div>
      )}

      {step === 'rapport' && rapport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Rapport de conformité</h2>
              <p className="text-sm text-muted-foreground">
                Zone {rapport.zone} — {rapport.commune} — PLU du {rapport.date_document_plu || '—'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep('adresse'); setZoneInfo(null); setRapport(null); }}>
                Nouvelle vérification
              </Button>
              <Button onClick={downloadPdf} className="flex gap-2">
                <Download className="h-4 w-4" /> Rapport PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-700">{nbConformes}</p>
                <p className="text-sm text-green-600">Conforme{nbConformes > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-red-700">{nbNonConformes}</p>
                <p className="text-sm text-red-600">Non conforme{nbNonConformes > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{nbAVerifier}</p>
                <p className="text-sm text-amber-600">À vérifier</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            {verifications.map((verif, idx) => {
              const config = statutConfig[verif.statut] ?? statutConfig.A_VERIFIER;
              const Icon = config.icon;
              return (
                <Card key={idx} className={`border ${config.bg}`}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{verif.article}</p>
                          <span className={`text-xs font-semibold shrink-0 ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        {verif.valeur_projet && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Projet : {verif.valeur_projet}
                            {verif.valeur_reglementaire && ` — Réglementaire : ${verif.valeur_reglementaire}`}
                          </p>
                        )}
                        {verif.commentaire && (
                          <p className="text-xs mt-1">{verif.commentaire}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Rapport indicatif. L'architecte reste seul responsable de la vérification finale de conformité au PLU.
          </p>
        </div>
      )}
    </div>
  );
}
