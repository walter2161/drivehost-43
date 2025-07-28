import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image, Video, FileSpreadsheet, Copy, Check, Eye, Globe } from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  upload_date: string;
  download_count: number;
}

interface FileListProps {
  refreshTrigger: number;
}

export const FileList = ({ refreshTrigger }: FileListProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error("Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5" />;
    if (fileType === 'text/html' || fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) 
      return <Globe className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileUrl = (file: FileItem, forSharing: boolean = false) => {
    const isHtml = isHtmlFile(file);
    
    if (isHtml && !forSharing) {
      // Para visualização de HTML, usa rota interna da aplicação
      return `${window.location.origin}/view/${file.id}`;
    } else {
      // Para download ou arquivos não-HTML, usa URL direta do Supabase
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(file.storage_path);
      return data.publicUrl;
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // Update download count
      await supabase
        .from('files')
        .update({ download_count: file.download_count + 1 })
        .eq('id', file.id);

      // Download file
      const { data } = supabase.storage.from('uploads').getPublicUrl(file.storage_path);
      const url = data.publicUrl;
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh the list to show updated download count
      fetchFiles();
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const copyToClipboard = async (file: FileItem) => {
    try {
      const url = getFileUrl(file, true); // true = para compartilhamento
      await navigator.clipboard.writeText(url);
      setCopiedUrl(file.id);
      toast.success("URL copiada!");
      
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar URL");
    }
  };

  const isHtmlFile = (file: FileItem) => {
    return file.file_type === 'text/html' || 
           file.original_name.toLowerCase().endsWith('.html') || 
           file.original_name.toLowerCase().endsWith('.htm');
  };

  const viewHtmlFile = (file: FileItem) => {
    const url = getFileUrl(file, false); // false = para visualização interna
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Carregando arquivos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Arquivos Hospedados ({files.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {files.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhum arquivo encontrado
          </div>
        ) : (
          <div className="divide-y">
            {files.map((file) => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.file_type, file.original_name)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(file.upload_date).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>{file.download_count} downloads</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {file.file_type.split('/')[0]}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {isHtmlFile(file) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewHtmlFile(file)}
                      title="Visualizar HTML"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(file)}
                    title="Copiar URL"
                  >
                    {copiedUrl === file.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};