import { useState, useRef, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getCabinetSettings, saveCabinetSettings } from 'wasp/client/operations';
import { Button } from '../client/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../client/components/ui/card';
import { Input } from '../client/components/ui/input';
import { useToast } from '../client/hooks/use-toast';
import { Loader2, Check, Upload, X } from 'lucide-react';

const MAX_LOGO_BYTES = 500 * 1024; // 500 KB

export default function CabinetSettingsPage() {
  const { toast } = useToast();
  const { data: settings, refetch } = useQuery(getCabinetSettings);
  const [isSaving, setIsSaving] = useState(false);

  const [nomCabinet, setNomCabinet] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [siteWeb, setSiteWeb] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoMime, setLogoMime] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) return;
    setNomCabinet(settings.nomCabinet ?? '');
    setAdresse(settings.adresse ?? '');
    setTelephone(settings.telephone ?? '');
    setEmail(settings.email ?? '');
    setSiteWeb(settings.siteWeb ?? '');
    if (settings.logo && settings.logoMime) {
      setLogo(settings.logo);
      setLogoMime(settings.logoMime);
      setLogoPreview(`data:${settings.logoMime};base64,${settings.logo}`);
    }
  }, [settings]);

  const handleLogoFile = (file: File) => {
    if (file.size > MAX_LOGO_BYTES) {
      toast({ title: 'Logo trop volumineux', description: 'Maximum 500 Ko.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setLogo(base64);
      setLogoMime(file.type || 'image/png');
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoMime(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCabinetSettings({
        nomCabinet,
        adresse,
        telephone,
        email,
        siteWeb,
        logo: logo ?? undefined,
        logoMime: logoMime ?? undefined,
      });
      refetch();
      toast({ title: 'Paramètres sauvegardés' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Paramètres du cabinet</h1>
        <p className="text-muted-foreground mt-1">
          Ces informations apparaîtront dans l'entête de tous vos exports Word et PDF.
        </p>
      </div>

      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>PNG ou JPEG, max 500 Ko. Il sera placé en haut de chaque export.</CardDescription>
          </CardHeader>
          <CardContent>
            {logoPreview ? (
              <div className="flex items-start gap-4">
                <img
                  src={logoPreview}
                  alt="Logo cabinet"
                  className="h-16 w-auto max-w-[200px] object-contain border border-border rounded"
                />
                <Button variant="ghost" size="sm" onClick={removeLogo} className="text-destructive hover:text-destructive flex gap-1">
                  <X className="h-4 w-4" /> Supprimer
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleLogoFile(f); }}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Glissez votre logo ici</p>
                <p className="text-sm text-muted-foreground">PNG, JPEG — max 500 Ko</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Informations du cabinet</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nom du cabinet</label>
              <Input
                placeholder="Aubert & Associés Architectes"
                value={nomCabinet}
                onChange={e => setNomCabinet(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Adresse</label>
              <Input
                placeholder="12 rue de la Paix, 75001 Paris"
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  placeholder="01 23 45 67 89"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="contact@cabinet.fr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Site web</label>
              <Input
                placeholder="www.cabinet-architecture.fr"
                value={siteWeb}
                onChange={e => setSiteWeb(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full flex gap-2" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
