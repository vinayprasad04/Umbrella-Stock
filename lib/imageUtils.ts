export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export const resizeAndCompressImage = (
  file: File,
  options: ImageResizeOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 300,
      maxHeight = 300,
      quality = 0.8,
      maxSizeKB = 10
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const tryCompress = (currentQuality: number): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            const sizeKB = blob.size / 1024;
            
            if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
              resolve(blob);
            } else {
              // Reduce quality and try again
              tryCompress(currentQuality - 0.1);
            }
          },
          'image/jpeg',
          currentQuality
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
    reader.readAsDataURL(blob);
  });
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB original file limit

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file is too large. Please select an image smaller than 10MB'
    };
  }

  return { isValid: true };
};