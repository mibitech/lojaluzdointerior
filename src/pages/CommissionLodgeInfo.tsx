import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface LodgeInfo {
  id: string;
  name: string;
  description: string | null;
  mission: string | null;
  vision: string | null;
  values: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
}

const CommissionLodgeInfo: React.FC = () => {
  const [lodgeInfo, setLodgeInfo] = useState<LodgeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoImages, setLogoImages] = useState<File[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    mission: "",
    vision: "",
    values: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
  });

  useEffect(() => {
    loadLodgeInfo();
  }, []);

  const loadLodgeInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("lodge_info")
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLodgeInfo(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          mission: data.mission || "",
          vision: data.vision || "",
          values: data.values || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          logo_url: data.logo_url || "",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar informações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload logo if a new one was selected
      let logoUrl = formData.logo_url;
      if (logoImages.length > 0) {
        const file = logoImages[0];
        const fileExt = file.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profiles")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profiles")
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const dataToSave = { ...formData, logo_url: logoUrl };

      if (lodgeInfo) {
        // Update existing record
        const { error } = await supabase
          .from("lodge_info")
          .update(dataToSave)
          .eq("id", lodgeInfo.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("lodge_info")
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Informações salvas com sucesso!",
      });

      setLogoImages([]);
      loadLodgeInfo();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Informações da Loja</CardTitle>
              <CardDescription>
                Gerencie as informações institucionais da loja maçônica
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo da Loja</Label>
              {formData.logo_url && logoImages.length === 0 && (
                <div className="mb-4">
                  <img
                    src={formData.logo_url}
                    alt="Logo da Loja"
                    className="h-32 w-32 object-cover rounded-lg border"
                  />
                </div>
              )}
              <ImageUpload
                images={logoImages}
                onImagesChange={(files) => setLogoImages(files as File[])}
                maxImages={1}
                maxSizeMB={5}
              />
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: A∴R∴L∴S∴ Luz do Interior"
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição sobre a loja..."
                rows={3}
              />
            </div>

            {/* Missão, Visão e Valores */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mission">Missão</Label>
                <Textarea
                  id="mission"
                  value={formData.mission}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  placeholder="Nossa missão..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision">Visão</Label>
                <Textarea
                  id="vision"
                  value={formData.vision}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  placeholder="Nossa visão..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="values">Valores</Label>
                <Textarea
                  id="values"
                  value={formData.values}
                  onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                  placeholder="Nossos valores..."
                  rows={4}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, estado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@loja.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.loja.com.br"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Informações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionLodgeInfo;
