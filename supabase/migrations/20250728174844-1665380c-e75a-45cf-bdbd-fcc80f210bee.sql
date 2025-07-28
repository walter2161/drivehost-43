-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Create files table to store file metadata
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  download_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no login required)
CREATE POLICY "Files are viewable by everyone" 
ON public.files 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert files" 
ON public.files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update download count" 
ON public.files 
FOR UPDATE 
USING (true);

-- Create storage policies for uploads bucket
CREATE POLICY "Anyone can view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads');

-- Create index for better performance
CREATE INDEX idx_files_upload_date ON public.files(upload_date DESC);