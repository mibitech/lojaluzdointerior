import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ImageItem = File | string;

export interface ExistingImage {
  id: string;
  url: string;
}

interface ImageUploadProps {
  images: ImageItem[];
  onImagesChange: (files: ImageItem[]) => void;
  existingImages?: ExistingImage[];
  onDeleteExisting?: (imageId: string, imageUrl: string) => Promise<void>;
  maxImages?: number;
  maxSizeMB?: number;
  accept?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  existingImages = [],
  onDeleteExisting,
  maxImages = 8,
  maxSizeMB = 10,
  accept = 'image/png,image/jpeg,image/jpg'
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const totalImages = images.length + existingImages.length;

  const validateFile = (file: File): boolean => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
      setError(`Tipo de arquivo não aceito. Use: ${accept}`);
      return false;
    }

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    setError('');
    const fileArray = Array.from(files);
    
    // Check max images
    if (totalImages + fileArray.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens permitido`);
      return;
    }

    // Validate all files
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
  }, [images, totalImages, maxImages, onImagesChange]);

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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError('');
  };

  const removeExistingImage = async (imageId: string, imageUrl: string) => {
    if (!onDeleteExisting) return;
    
    setDeletingIds(prev => new Set(prev).add(imageId));
    try {
      await onDeleteExisting(imageId, imageUrl);
    } catch (error) {
      console.error('Error deleting image:', error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const getImageUrl = (image: ImageItem): string => {
    if (typeof image === 'string') {
      return image;
    }
    return URL.createObjectURL(image);
  };

  const getImageName = (image: ImageItem): string => {
    if (typeof image === 'string') {
      return image.split('/').pop() || 'Imagem';
    }
    return image.name;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Imagens ({totalImages}/{maxImages})</h4>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border",
          totalImages >= maxImages && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={totalImages >= maxImages}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        
        <p className="text-sm text-muted-foreground mb-2">
          Arraste e solte imagens aqui ou clique para selecionar
        </p>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={totalImages >= maxImages}
        >
          Selecionar Imagens
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3">
          PNG, JPG, JPEG até {maxSizeMB}MB • Máximo {maxImages} imagens
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Preview Grid */}
      {(existingImages.length > 0 || images.length > 0) ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {existingImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={image.url}
                  alt="Imagem existente"
                  className="w-full h-full object-cover"
                />
              </div>
              {onDeleteExisting && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingImage(image.id, image.url)}
                  disabled={deletingIds.has(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded">
                Salva
              </div>
            </div>
          ))}
          
          {/* New Images */}
          {images.map((image, index) => (
            <div key={`new-${index}`} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={getImageUrl(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded">
                Nova
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {getImageName(image)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma imagem adicionada</p>
        </div>
      )}
    </div>
  );
};
