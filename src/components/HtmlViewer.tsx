import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  storage_path: string;
}

export const HtmlViewer = () => {
  const [htmlFiles, setHtmlFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const fetchHtmlFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .or('file_type.eq.text/html,original_name.ilike.%.html,original_name.ilike.%.htm')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setHtmlFiles(data || []);
      
      // Auto-select first file if none selected
      if (data && data.length > 0 && !selectedFile) {
        setSelectedFile(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching HTML files:', error);
      toast.error("Erro ao carregar arquivos HTML");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHtmlFiles();
  }, []);

  const getFileUrl = (file: FileItem) => {
    // Gera URL da aplicação React para renderizar o HTML
    return `${window.location.origin}/view/${file.id}`;
  };

  const refreshViewer = () => {
    setIframeKey(prev => prev + 1);
    toast.success("Visualizador atualizado!");
  };

  const openInNewTab = () => {
    const file = htmlFiles.find(f => f.id === selectedFile);
    if (file) {
      const url = getFileUrl(file);
      window.open(url, '_blank');
    }
  };

  const selectedFileData = htmlFiles.find(f => f.id === selectedFile);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando arquivos HTML...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Visualizador de HTML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {htmlFiles.length === 0 ? (
            <div className="text-center text-muted-foreground">
              Nenhum arquivo HTML encontrado
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um arquivo HTML" />
                  </SelectTrigger>
                  <SelectContent>
                    {htmlFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id}>
                        {file.original_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={refreshViewer} title="Atualizar">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={openInNewTab} title="Abrir em nova aba">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {selectedFileData && (
                <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                  <iframe
                    key={iframeKey}
                    src={getFileUrl(selectedFileData)}
                    className="w-full h-full border-0"
                    title={selectedFileData.original_name}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};