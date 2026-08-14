import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FileItem = File | string;

interface FileUploadProps {
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  acceptLabel?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = 'image/*,.pdf,.doc,.docx',
  acceptLabel = 'Imagens, PDF, DOC'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    setError('');
    const fileArray = Array.from(fileList);
    
    // Check max files
    if (files.length + fileArray.length > maxFiles) {
      setError(`Máximo de ${maxFiles} arquivos permitido`);
      return;
    }

    // Validate all files
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles]);
    }
  }, [files, maxFiles, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
    setError('');
  };

  const getFileName = (file: FileItem): string => {
    if (typeof file === 'string') {
      return file.split('/').pop() || 'Arquivo';
    }
    return file.name;
  };

  const getFileIcon = (file: FileItem) => {
    const fileName = getFileName(file);
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (ext === 'doc' || ext === 'docx') return <FileIcon className="w-8 h-8 text-blue-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-8 h-8 text-green-500" />;
    }
    return <FileIcon className="w-8 h-8 text-muted-foreground" />;
  };

  const getFilePreview = (file: FileItem) => {
    if (typeof file === 'string') {
      const ext = file.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        return <img src={file} alt="Preview" className="w-full h-full object-cover" />;
      }
      return getFileIcon(file);
    }
    
    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />;
    }
    
    return getFileIcon(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Arquivos ({files.length}/{maxFiles})</h4>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={files.length >= maxFiles}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        
        <p className="text-sm text-muted-foreground mb-2">
          Arraste e solte arquivos aqui ou clique para selecionar
        </p>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={files.length >= maxFiles}
        >
          Selecionar Arquivos
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3">
          {acceptLabel} até {maxSizeMB}MB • Máximo {maxFiles} arquivos
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Preview Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => {
            const isFile = file instanceof File;
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                  {getFilePreview(file)}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {getFileName(file)}
                  </p>
                  {isFile && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <FileIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum arquivo adicionado</p>
        </div>
      )}
    </div>
  );
};
