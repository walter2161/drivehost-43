import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  storage_path: string;
}

export const HtmlRenderer = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [file, setFile] = useState<FileItem | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fileId) {
      fetchFileAndContent();
    }
  }, [fileId]);

  const fetchFileAndContent = async () => {
    try {
      // Buscar informações do arquivo
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError) throw fileError;
      if (!fileData) {
        toast.error("Arquivo não encontrado");
        return;
      }

      setFile(fileData);

      // Buscar conteúdo do arquivo
      const { data: contentData, error: contentError } = await supabase.storage
        .from('uploads')
        .download(fileData.storage_path);

      if (contentError) throw contentError;

      const text = await contentData.text();
      setHtmlContent(text);

    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      toast.error("Erro ao carregar arquivo");
    } finally {
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    if (file) {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Carregando arquivo...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Arquivo não encontrado</div>
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title={file.original_name}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};