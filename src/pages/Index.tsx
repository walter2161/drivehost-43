import React, { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { HtmlViewer } from "@/components/HtmlViewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudUpload } from "lucide-react";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-3 text-3xl">
              <CloudUpload className="h-8 w-8" />
              DriveHost - Hospedagem de Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Envie e compartilhe seus arquivos de até 5MB. Imagens, vídeos, planilhas, documentos e arquivos HTML.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">Gerenciar Arquivos</TabsTrigger>
            <TabsTrigger value="viewer">Visualizar HTML</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>

              {/* Files List */}
              <div>
                <FileList refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="viewer">
            <HtmlViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
