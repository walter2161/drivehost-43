import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload = ({ onUploadSuccess }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathQuestion, setMathQuestion] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, result: a + b };
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateNewMathQuestion = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setMathQuestion({ a, b, result: a + b });
    setMathAnswer("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate math answer
    if (parseInt(mathAnswer) !== mathQuestion.result) {
      toast.error("Resposta da soma está incorreta!");
      generateNewMathQuestion();
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande! Máximo 5MB.");
      return;
    }

    // Validate file type - incluindo HTML
    const allowedTypes = [
      'image/', 'video/', 'text/', 'application/pdf', 
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const isValidType = allowedTypes.some(type => file.type.startsWith(type)) || 
                       file.type === 'text/html' || 
                       file.name.toLowerCase().endsWith('.html') ||
                       file.name.toLowerCase().endsWith('.htm');
    if (!isValidType) {
      toast.error("Tipo de arquivo não permitido!");
      return;
    }

    setIsUploading(true);

    try {
      const isHtmlFile = file.type === 'text/html' || 
                        file.name.toLowerCase().endsWith('.html') || 
                        file.name.toLowerCase().endsWith('.htm');

      let fileName, filePath;
      
      if (isHtmlFile) {
        // Para arquivos HTML: criar pasta única e renomear para index.html
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
        fileName = 'index.html';
        filePath = `sites/${uniqueId}/index.html`;
      } else {
        // Para outros arquivos: manter estrutura original
        const fileExt = file.name.split('.').pop();
        fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        filePath = `uploads/${fileName}`;
      }

      // Upload file to Supabase Storage with correct content type for HTML files
      const uploadOptions: any = {};
      
      if (isHtmlFile) {
        uploadOptions.contentType = 'text/html; charset=utf-8';
      }
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, uploadOptions);

      if (uploadError) {
        throw uploadError;
      }

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath
        });

      if (dbError) {
        throw dbError;
      }

      toast.success("Arquivo enviado com sucesso!");
      onUploadSuccess();
      generateNewMathQuestion();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao enviar arquivo!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6" />
          Enviar Arquivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          Máximo 5MB • Imagens, vídeos, planilhas, textos e HTML
        </div>
        
        {/* Math verification */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Verificação anti-robô:</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">
              {mathQuestion.a} + {mathQuestion.b} = ?
            </p>
            <Input
              type="number"
              placeholder="Digite a resposta"
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading || !mathAnswer}
          accept="image/*,video/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.html,.htm"
        />

        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !mathAnswer || parseInt(mathAnswer) !== mathQuestion.result}
          className="w-full"
        >
          {isUploading ? "Enviando..." : "Escolher Arquivo"}
        </Button>
      </CardContent>
    </Card>
  );
};