import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, GitMerge, Loader2, Save, RotateCcw } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useAttendances } from "@/hooks/useAttendances";
import { useProfiles } from "@/hooks/useProfiles";
import { ImageUpload, ImageItem } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface OcrEntry {
  name: string | null
  cim: string | null
}

interface MatchedEntry {
  name: string
  cim: string | null
}

interface OcrResult {
  matched: MatchedEntry[]
  unmatched: OcrEntry[]
}

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const PARTICLES = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const MASONIC_POSITIONS = [
  "Venerável Mestre",
  "1º Vigilante",
  "2º Vigilante",
  "Orador",
  "Secretário",
  "Tesoureiro",
  "Chanceler",
  "Mestre de Cerimônias",
  "Hospitaleiro",
  "1º Diácono",
  "2º Diácono",
  "1º Experto",
  "2º Experto",
  "Porta-Estandarte",
  "Porta-Espada",
  "Mestre de Harmonia",
  "Bibliotecário",
  "Cobrador Interno",
  "Cobrador Externo",
  "Guarda do Templo",
];

const CommissionAttendances: React.FC = () => {
  const { sessions } = useSessions();
  const { profiles } = useProfiles();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Presença local — só vai para o banco ao clicar em Gravar
  const [localPresence, setLocalPresence] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Livro — estado local, nunca persistido
  const [livroChecked, setLivroChecked] = useState<Record<string, boolean>>({});

  // OCR / Conciliar
  const [conciliarOpen, setConciliarOpen] = useState(false);
  const [conciliarImages, setConciliarImages] = useState<ImageItem[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [pendingLivro, setPendingLivro] = useState<Record<string, boolean>>({});

  const { attendances, loading, saveAllPresence, updatePosition, removeAttendance, clearAllAttendances } =
    useAttendances(selectedSessionId);

  const now = new Date();
  const sessionsDoMes = sessions.filter(s => {
    const d = new Date(s.session_datetime);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const selectedSession = sessionsDoMes.find(s => s.id === selectedSessionId);

  // Seleciona automaticamente a sessão mais próxima da data atual
  useEffect(() => {
    if (sessionsDoMes.length === 0 || selectedSessionId) return;
    const nowMs = now.getTime();
    const closest = sessionsDoMes.reduce((prev, curr) => {
      const diffPrev = Math.abs(new Date(prev.session_datetime).getTime() - nowMs);
      const diffCurr = Math.abs(new Date(curr.session_datetime).getTime() - nowMs);
      return diffCurr < diffPrev ? curr : prev;
    });
    setSelectedSessionId(closest.id);
  }, [sessions]);

  // Inicializa localPresence a partir dos dados do banco sempre que attendances mudar
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    profiles.forEach(p => {
      const att = attendances.find(a => a.profile_id === p.id);
      initial[p.id] = att?.is_present ?? false;
    });
    setLocalPresence(initial);
  }, [attendances, profiles]);

  // Detecta alterações não salvas
  const isDirty = profiles.some(p => {
    const dbState = attendances.find(a => a.profile_id === p.id)?.is_present ?? false;
    return (localPresence[p.id] ?? false) !== dbState;
  });

  // Contadores baseados no estado local
  const totalPresentes = profiles.filter(p => localPresence[p.id]).length;
  const totalLivro = Object.values(livroChecked).filter(Boolean).length;

  // Cabeçalho — Presente
  const allPresent = profiles.length > 0 && profiles.every(p => localPresence[p.id]);
  const somePresent = profiles.some(p => localPresence[p.id]);
  const presenteHeaderState = allPresent ? true : somePresent ? "indeterminate" : false;

  // Cabeçalho — Livro
  const allLivro = profiles.length > 0 && profiles.every(p => livroChecked[p.id]);
  const someLivro = profiles.some(p => livroChecked[p.id]);
  const livroHeaderState = allLivro ? true : someLivro ? "indeterminate" : false;

  const handleTogglePresence = (profileId: string) => {
    setLocalPresence(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  };

  const handleToggleAllPresence = () => {
    const next = !allPresent;
    const updated: Record<string, boolean> = {};
    profiles.forEach(p => { updated[p.id] = next; });
    setLocalPresence(updated);
  };

  const handleToggleAllLivro = () => {
    const next = !allLivro;
    const updated: Record<string, boolean> = {};
    profiles.forEach(p => { updated[p.id] = next; });
    setLivroChecked(updated);
  };

  const handleSave = async () => {
    if (!selectedSessionId) return;
    setIsSaving(true);
    try {
      const defaults: Record<string, string | null> = {};
      profiles.forEach(p => { defaults[p.id] = p.position ?? null; });
      await saveAllPresence(selectedSessionId, localPresence, defaults);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAttendance = async (attendanceId: string) => {
    await removeAttendance(attendanceId);
  };

  const handleUpdatePosition = async (attendanceId: string, position: string) => {
    await updatePosition(attendanceId, position);
  };

  const getDisplayPosition = (profileId: string) => {
    const attendance = attendances.find(a => a.profile_id === profileId);
    if (attendance?.position_override) return attendance.position_override;
    return profiles.find(p => p.id === profileId)?.position ?? "";
  };

  // OCR
  const handleValidar = async () => {
    const file = conciliarImages[0];
    if (!(file instanceof File)) {
      toast.error('Selecione uma foto do livro de presenças');
      return;
    }

    setOcrLoading(true);
    setOcrResult(null);
    setPendingLivro({});

    try {
      const imageBase64 = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

      const { data, error } = await supabase.functions.invoke('ocr-attendance', {
        body: { imageBase64, mediaType },
      });

      if (error) {
        let detail = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx) {
            const body = await ctx.json();
            detail = body?.error ?? detail;
          }
        } catch { /* ignora */ }
        throw new Error(detail);
      }

      const entries: OcrEntry[] = data?.entries ?? [];
      if (entries.length === 0) {
        toast.warning('Nenhum registro identificado na imagem');
        return;
      }

      const pending: Record<string, boolean> = {};
      const matched: MatchedEntry[] = [];
      const unmatched: OcrEntry[] = [];

      entries.forEach((entry) => {
        // 1. CIM match — normaliza zeros à esquerda (ex: "12345" == "012345")
        let profileMatch = profiles.find(p => {
          if (!entry.cim || !p.cim) return false;
          return entry.cim.replace(/^0+/, '') === p.cim.replace(/^0+/, '');
        });

        // 2. Matching por palavras do nome (exact, sem partículas, palavras > 3 chars)
        if (!profileMatch && entry.name) {
          const ocrWords = normalize(entry.name)
            .split(/\s+/)
            .filter(w => w.length > 3 && !PARTICLES.has(w));

          if (ocrWords.length > 0) {
            profileMatch = profiles.find(p => {
              if (!p.full_name) return false;
              const profileWords = normalize(p.full_name).split(/\s+/);
              const hits = ocrWords.filter(w => profileWords.includes(w)).length;
              return hits >= 2 || (ocrWords.length === 1 && profileWords.includes(ocrWords[0]));
            });
          }
        }

        if (profileMatch) {
          pending[profileMatch.id] = true;
          matched.push({ name: profileMatch.full_name || profileMatch.id, cim: profileMatch.cim ?? null });
        } else {
          unmatched.push(entry);
        }
      });

      setPendingLivro(pending);
      setOcrResult({ matched, unmatched });
    } catch (err: unknown) {
      console.error('Erro OCR:', err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(`Erro ao analisar a imagem: ${msg}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleClearPresence = async () => {
    if (!selectedSessionId) return;
    await clearAllAttendances(selectedSessionId);
    setLivroChecked({});
    toast.info('Lista de presenças zerada');
  };

  const handleConciliar = () => {
    setLivroChecked(prev => ({ ...prev, ...pendingLivro }));
    setConciliarOpen(false);
    const count = Object.keys(pendingLivro).length;
    if (count > 0) toast.success(`${count} membro(s) marcado(s) no Livro`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Presenças</h2>
        <p className="text-muted-foreground">Gerencie as presenças dos membros nas sessões</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session">Selecione a Sessão</Label>
            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sessão" />
              </SelectTrigger>
              <SelectContent>
                {sessionsDoMes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma sessão neste mês
                  </div>
                ) : (
                  sessionsDoMes.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {format(new Date(session.session_datetime), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {session.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedSession && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <span className="font-medium">Data de Início:</span>{" "}
                {format(new Date(selectedSession.session_datetime), "dd/MM/yyyy", { locale: ptBR })}
              </div>
              <div>
                <span className="font-medium">Horário:</span>{" "}
                {format(new Date(selectedSession.session_datetime), "HH:mm", { locale: ptBR })}
              </div>
              <div>
                <span className="font-medium">Grau da Sessão:</span> {selectedSession.session_degree}
              </div>
              <div>
                <span className="font-medium">Título:</span> {selectedSession.title}
              </div>
              {selectedSession.description && (
                <div className="md:col-span-2">
                  <span className="font-medium">Descrição:</span> {selectedSession.description}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSessionId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Lista de presença:</h3>
                <Button size="sm" onClick={() => setConciliarOpen(true)} className="gap-2">
                  <GitMerge className="w-4 h-4" />
                  Conciliar
                </Button>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
                  Presentes: <strong>{totalPresentes}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 bg-primary" />
                  Livro: <strong>{totalLivro}</strong>
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum membro cadastrado.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">
                          <div className="flex flex-col items-start gap-1">
                            <span>Presente</span>
                            <Checkbox
                              checked={presenteHeaderState}
                              onCheckedChange={handleToggleAllPresence}
                              title={allPresent ? "Desmarcar todos" : "Marcar todos"}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px]">
                          <div className="flex flex-col items-start gap-1">
                            <span>Livro</span>
                            <Checkbox
                              checked={livroHeaderState}
                              onCheckedChange={handleToggleAllLivro}
                              className="rounded-none"
                              title={allLivro ? "Desmarcar todos" : "Marcar todos"}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="w-[100px]">CIM</TableHead>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Cargo / Posição</TableHead>
                        <TableHead className="w-[60px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => {
                        const isPresent = localPresence[profile.id] ?? false;
                        const attendance = attendances.find(a => a.profile_id === profile.id);
                        const displayPosition = getDisplayPosition(profile.id);

                        return (
                          <TableRow key={profile.id}>
                            <TableCell>
                              <Checkbox
                                checked={isPresent}
                                onCheckedChange={() => handleTogglePresence(profile.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={livroChecked[profile.id] ?? false}
                                onCheckedChange={(checked) =>
                                  setLivroChecked((prev) => ({ ...prev, [profile.id]: !!checked }))
                                }
                                className="rounded-none"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">{profile.cim || "-"}</TableCell>
                            <TableCell>{profile.full_name || "-"}</TableCell>
                            <TableCell>
                              <Select
                                value={displayPosition}
                                onValueChange={(value) =>
                                  attendance && handleUpdatePosition(attendance.id, value)
                                }
                                disabled={!attendance}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione a posição" />
                                </SelectTrigger>
                                <SelectContent className="bg-background z-50">
                                  {MASONIC_POSITIONS.map((position) => (
                                    <SelectItem key={position} value={position}>
                                      {position}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              {attendance && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAttendance(attendance.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between pt-4 border-t mt-4">
                  <Button
                    variant="outline"
                    onClick={handleClearPresence}
                    className="gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Zerar Lista
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className="gap-2"
                  >
                    {isSaving
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />
                    }
                    {isSaving ? "Gravando..." : "Gravar Presenças"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={conciliarOpen} onOpenChange={(open) => {
        if (!open) { setOcrResult(null); setPendingLivro({}); setConciliarImages([]); }
        setConciliarOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="w-5 h-5" />
              Conciliar Presenças
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Label className="mb-3 block">Foto do Livro de Presenças</Label>
            <ImageUpload
              images={conciliarImages}
              onImagesChange={setConciliarImages}
              maxImages={1}
              maxSizeMB={10}
            />
          </div>

          {ocrResult && (
            <div className="space-y-3 text-sm max-h-72 overflow-y-auto pr-1">
              {ocrResult.matched.length > 0 && (
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                    {ocrResult.matched.length} identificado(s)
                  </p>
                  <div className="rounded-md border border-green-500/20 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-green-500/10">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium w-[90px]">CIM</th>
                          <th className="text-left px-3 py-1.5 font-medium">Nome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrResult.matched.map((entry, i) => (
                          <tr key={i} className="border-t border-green-500/10">
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{entry.cim ?? "—"}</td>
                            <td className="px-3 py-1.5">{entry.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {ocrResult.unmatched.length > 0 && (
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                    {ocrResult.unmatched.length} não encontrado(s) no cadastro
                  </p>
                  <div className="rounded-md border border-yellow-500/20 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-yellow-500/10">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium w-[90px]">CIM</th>
                          <th className="text-left px-3 py-1.5 font-medium">Nome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ocrResult.unmatched.map((entry, i) => (
                          <tr key={i} className="border-t border-yellow-500/10">
                            <td className="px-3 py-1.5 font-mono text-muted-foreground">{entry.cim ?? "—"}</td>
                            <td className="px-3 py-1.5">{entry.name ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConciliarOpen(false)} disabled={ocrLoading}>
              Sair
            </Button>
            <Button variant="secondary" onClick={handleValidar} disabled={ocrLoading} className="gap-2">
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {ocrLoading ? "Analisando..." : "Validar"}
            </Button>
            <Button
              onClick={handleConciliar}
              disabled={ocrLoading || !ocrResult || ocrResult.matched.length === 0}
              className="gap-2"
            >
              <GitMerge className="w-4 h-4" />
              Conciliar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionAttendances;
