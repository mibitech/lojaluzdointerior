import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useVisitors, Visitor } from "@/hooks/useVisitors";
import { useSessions } from "@/hooks/useSessions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const CommissionVisitors: React.FC = () => {
  const { visitors, loading, createVisitor, updateVisitor, deleteVisitor } = useVisitors();
  const { sessions } = useSessions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [deleteVisitorId, setDeleteVisitorId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    session_id: "",
    visitor_name: "",
    visit_date: new Date().toISOString().slice(0, 10),
    birth_date: "",
    cim: "",
    visitor_lodge: "",
    city: "",
    state: "",
    potencia: "",
    masonic_degree: "",
    email: "",
    mobile_phone: "",
    landline_phone: "",
  });

  const resetForm = () => {
    setFormData({
      session_id: "",
      visitor_name: "",
      visit_date: new Date().toISOString().slice(0, 10),
      birth_date: "",
      cim: "",
      visitor_lodge: "",
      city: "",
      state: "",
      potencia: "",
      masonic_degree: "",
      email: "",
      mobile_phone: "",
      landline_phone: "",
    });
    setEditingVisitor(null);
  };

  const handleOpenDialog = (visitor?: Visitor) => {
    if (visitor) {
      setEditingVisitor(visitor);
      setFormData({
        session_id: visitor.session_id,
        visitor_name: visitor.visitor_name,
        visit_date: visitor.visit_date || new Date().toISOString().slice(0, 10),
        birth_date: visitor.birth_date || "",
        cim: visitor.cim || "",
        visitor_lodge: visitor.visitor_lodge || "",
        city: visitor.city || "",
        state: visitor.state || "",
        potencia: visitor.potencia || "",
        masonic_degree: visitor.masonic_degree || "",
        email: visitor.email || "",
        mobile_phone: visitor.mobile_phone || "",
        landline_phone: visitor.landline_phone || "",
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
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, formData);
      } else {
        await createVisitor(formData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving visitor:", error);
    }
  };

  const handleDelete = async () => {
    if (deleteVisitorId) {
      await deleteVisitor(deleteVisitorId);
      setDeleteVisitorId(null);
    }
  };

  const getSessionInfo = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return "Sessão não encontrada";
    return `${format(new Date(session.session_datetime), "dd/MM/yyyy", { locale: ptBR })} - ${session.title}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visitantes</h2>
          <p className="text-muted-foreground">Gerencie os visitantes das sessões</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Visitante
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : visitors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum visitante cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visitors.map((visitor) => (
            <Card key={visitor.id} className="shadow-soft hover:shadow-elegant transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{visitor.visitor_name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Sessão:</span> {getSessionInfo(visitor.session_id)}
                      </div>
                      {visitor.cim && (
                        <div>
                          <span className="font-medium">CIM:</span> {visitor.cim}
                        </div>
                      )}
                      {visitor.visitor_lodge && (
                        <div>
                          <span className="font-medium">Loja:</span> {visitor.visitor_lodge}
                        </div>
                      )}
                      {visitor.city && visitor.state && (
                        <div>
                          <span className="font-medium">Cidade/UF:</span> {visitor.city} - {visitor.state}
                        </div>
                      )}
                      {visitor.masonic_degree && (
                        <div>
                          <span className="font-medium">Graduação:</span> {visitor.masonic_degree}
                        </div>
                      )}
                      {visitor.email && (
                        <div>
                          <span className="font-medium">Email:</span> {visitor.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(visitor)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteVisitorId(visitor.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVisitor ? "Editar Visitante" : "Novo Visitante"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session_id">Sessão *</Label>
              <Select
                value={formData.session_id}
                onValueChange={(value) => setFormData({ ...formData, session_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sessão" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {format(new Date(session.session_datetime), "dd/MM/yyyy", { locale: ptBR })} - {session.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitor_name">Nome do Visitante *</Label>
              <Input
                id="visitor_name"
                value={formData.visitor_name}
                onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Data da Visita</Label>
                <Input
                  id="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Celular</Label>
                <Input
                  id="mobile_phone"
                  value={formData.mobile_phone}
                  onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landline_phone">Telefone Fixo</Label>
                <Input
                  id="landline_phone"
                  value={formData.landline_phone}
                  onChange={(e) => setFormData({ ...formData, landline_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cim">CIM (Nº do cadastro Maçônico)</Label>
              <Input
                id="cim"
                value={formData.cim}
                onChange={(e) => setFormData({ ...formData, cim: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitor_lodge">Loja do Visitante</Label>
              <Input
                id="visitor_lodge"
                value={formData.visitor_lodge}
                onChange={(e) => setFormData({ ...formData, visitor_lodge: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="potencia">Potência</Label>
              <Input
                id="potencia"
                value={formData.potencia}
                onChange={(e) => setFormData({ ...formData, potencia: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masonic_degree">Graduação do Visitante</Label>
              <Select
                value={formData.masonic_degree}
                onValueChange={(value) => setFormData({ ...formData, masonic_degree: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprendiz Maçom (A∴M∴)">Aprendiz Maçom (A∴M∴)</SelectItem>
                  <SelectItem value="Companheiro Maçom (C∴M∴)">Companheiro Maçom (C∴M∴)</SelectItem>
                  <SelectItem value="Mestre Maçom (M∴M∴)">Mestre Maçom (M∴M∴)</SelectItem>
                  <SelectItem value="Mestre Instalado (M∴I∴)">Mestre Instalado (M∴I∴)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingVisitor ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteVisitorId} onOpenChange={() => setDeleteVisitorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este visitante? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommissionVisitors;
