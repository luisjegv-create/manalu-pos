/**
 * Compresses an image file using Canvas to a maximum dimension and specific quality.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - Maximum width or height of the resulting image.
 * @param {number} quality - JPEG compression quality (0.1 to 1.0).
 * @returns {Promise<string>} - A promise that resolves to a base64 string of the compressed image.
 */
export const compressImage = (file, maxWidth = 400, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File is not an image or is missing.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions keeping aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Clear and draw image on canvas
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as JPEG with given quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = () => reject(new Error('Failed to load image for compression.'));
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
    });
};

/**
 * Compresses an image from a URL or Base64 string.
 */
export const compressImageFromUrl = (url, maxWidth = 400, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('URL is missing.'));
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxWidth) {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image from URL for compression.'));
    });
};
