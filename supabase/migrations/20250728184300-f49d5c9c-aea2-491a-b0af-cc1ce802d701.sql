-- Create storage bucket for file uploads
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

-- Create policy to allow public access to files (since this is a public file hosting service)
CREATE POLICY "Public access to files" ON public.files FOR ALL USING (true);

-- Create storage policies for the uploads bucket
CREATE POLICY "Public access to uploads bucket" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Anyone can upload to uploads bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Anyone can update uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');
CREATE POLICY "Anyone can delete uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');