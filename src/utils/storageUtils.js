import { supabase } from './supabaseClient';

/**
 * Compresses an image before uploading
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, quality);
            };
        };
    });
};

/**
 * Uploads a file to Supabase Storage and returns the public URL
 * @param {File|Blob} file 
 * @param {string} bucket 
 * @param {string} folder 
 * @returns {Promise<string>}
 */
export const uploadImage = async (file, bucket = 'product-images', folder = 'items') => {
    const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data.publicUrl;
};
