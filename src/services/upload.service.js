import apiClient from './api';

class ImageUploadService {
  async uploadImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data?.data?.fileUrl || response.data?.data?.url;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Upload failed');
    }
  }

  async deleteImage(fileUrl) {
    try {
      await apiClient.delete('/upload', {
        data: { fileUrl },
      });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Delete failed');
    }
  }

  getImageUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}${filePath}`;
  }
}

export default new ImageUploadService();
