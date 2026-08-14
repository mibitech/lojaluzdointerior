import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Download } from "lucide-react";
import { useSessions, Session } from "@/hooks/useSessions";
import { useCopoDagua } from "@/hooks/useCopoDagua";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const CommissionSessions: React.FC = () => {
  const { sessions, loading, createSession, updateSession, deleteSession } = useSessions();
  const { events: copoDaguaEvents } = useCopoDagua();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    session_degree: "",
    show_description: false,
    description: "",
    session_datetime: "",
  });

  // Preencher automaticamente baseado no Copo D'água quando a data mudar
  useEffect(() => {
    if (!editingSession && formData.session_datetime && copoDaguaEvents.length > 0) {
      const selectedDate = formData.session_datetime.split('T')[0];
      
      // Buscar evento do Copo D'água do mesmo dia
      const copoDaguaEvent = copoDaguaEvents.find(event => 
        event.event_date === selectedDate
      );

      if (copoDaguaEvent) {
        // Preencher título e grau baseado no evento do Copo D'água
        setFormData(prev => ({
          ...prev,
          title: copoDaguaEvent.session_type,
          session_degree: copoDaguaEvent.session_degree || '',
        }));
      }
    }
  }, [formData.session_datetime, copoDaguaEvents, editingSession]);

  const resetForm = () => {
    setFormData({
      title: "",
      session_degree: "",
      show_description: false,
      description: "",
      session_datetime: "",
    });
    setEditingSession(null);
  };

  const handleOpenDialog = (session?: Session) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        title: session.title,
        session_degree: session.session_degree,
        show_description: session.show_description,
        description: session.description || "",
        session_datetime: session.session_datetime.slice(0, 16),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        title: formData.title,
        session_degree: formData.session_degree,
        show_description: formData.show_description,
        description: formData.show_description ? formData.description : null,
        session_datetime: new Date(formData.session_datetime).toISOString(),
      };

      if (editingSession) {
        await updateSession(editingSession.id, sessionData);
      } else {
        await createSession(sessionData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleDelete = async () => {
    if (deleteSessionId) {
      await deleteSession(deleteSessionId);
      setDeleteSessionId(null);
    }
  };

  // Filtrar eventos futuros do Copo D'água que ainda não foram importados como sessão
  const futureImportableEvents = copoDaguaEvents.filter(event => {
    const eventDate = startOfDay(parseISO(event.event_date));
    const today = startOfDay(new Date());
    if (isBefore(eventDate, today)) return false;
    // Verificar se já existe sessão nesta data
    const alreadyExists = sessions.some(s => {
      const sessionDate = s.session_datetime.split('T')[0];
      return sessionDate === event.event_date;
    });
    return !alreadyExists;
  });

  const handleImportFromCopoDagua = async () => {
    if (futureImportableEvents.length === 0) {
      toast.info("Não há eventos futuros do Copo D'água para importar.");
      return;
    }

    setImporting(true);
    try {
      let imported = 0;
      for (const event of futureImportableEvents) {
        // Normalizar o horário para HH:mm formato válido
        let time = (event.start_time || '19:30').trim();
        // Se já tem segundos (HH:mm:ss), usar direto; senão adicionar :00
        if (/^\d{2}:\d{2}$/.test(time)) {
          time = `${time}:00`;
        }
        const sessionDatetime = `${event.event_date}T${time}`;
        const dateObj = new Date(sessionDatetime);
        // Fallback se a data ainda for inválida
        const isoString = isNaN(dateObj.getTime())
          ? new Date(`${event.event_date}T19:30:00`).toISOString()
          : dateObj.toISOString();
        await createSession({
          title: event.session_type,
          session_degree: event.session_degree || 'Qualquer Grau',
          show_description: false,
          description: event.study_time ? `Tempo de Estudos: ${event.study_time}` : null,
          session_datetime: isoString,
        });
        imported++;
      }
      toast.success(`${imported} sessão(ões) importada(s) com sucesso!`);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error("Error importing sessions:", error);
      toast.error("Erro ao importar sessões");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sessões</h2>
          <p className="text-muted-foreground">Gerencie as sessões da loja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Importar do Copo D'água
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma sessão cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="shadow-soft hover:shadow-elegant transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{session.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {session.session_degree}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(session.session_datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {session.show_description && session.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {session.description}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(session)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteSessionId(session.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Editar Sessão" : "Nova Sessão"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session_datetime">Data e Hora da Sessão *</Label>
              <Input
                id="session_datetime"
                type="datetime-local"
                value={formData.session_datetime}
                onChange={(e) => setFormData({ ...formData, session_datetime: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Título e grau serão preenchidos automaticamente com base no Copo D'água
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_degree">Grau da Sessão</Label>
              <Select
                value={formData.session_degree}
                onValueChange={(value) => setFormData({ ...formData, session_degree: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualquer Grau">Qualquer Grau</SelectItem>
                  <SelectItem value="Sessão Pública (Sem Grau)">Sessão Pública (Sem Grau)</SelectItem>
                  <SelectItem value="Aprendiz Maçom (A∴M∴)">Aprendiz Maçom (A∴M∴)</SelectItem>
                  <SelectItem value="Companheiro Maçom (C∴M∴)">Companheiro Maçom (C∴M∴)</SelectItem>
                  <SelectItem value="Mestre Maçom (M∴M∴)">Mestre Maçom (M∴M∴)</SelectItem>
                  <SelectItem value="Mestre Instalado (M∴I∴)">Mestre Instalado (M∴I∴)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_description"
                checked={formData.show_description}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_description: checked as boolean })
                }
              />
              <Label htmlFor="show_description" className="cursor-pointer">
                Exibir Descrição da Sessão
              </Label>
            </div>

            {formData.show_description && (
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Sessão</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSession ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar Sessões do Copo D'água</AlertDialogTitle>
            <AlertDialogDescription>
              {futureImportableEvents.length === 0 ? (
                "Não há eventos futuros do Copo D'água disponíveis para importar. Todos já foram importados ou não existem eventos futuros cadastrados."
              ) : (
                <>
                  Serão importadas <strong>{futureImportableEvents.length}</strong> sessão(ões) futuras do Copo D'água que ainda não foram cadastradas:
                  <ul className="mt-2 space-y-1 text-left max-h-48 overflow-y-auto">
                    {futureImportableEvents.map(event => (
                      <li key={event.id} className="text-sm">
                        • {format(parseISO(event.event_date), "dd/MM/yyyy", { locale: ptBR })} — {event.session_type} {event.session_degree ? `(${event.session_degree})` : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Cancelar</AlertDialogCancel>
            {futureImportableEvents.length > 0 && (
              <AlertDialogAction onClick={handleImportFromCopoDagua} disabled={importing}>
                {importing ? "Importando..." : "Importar"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionSessions;
