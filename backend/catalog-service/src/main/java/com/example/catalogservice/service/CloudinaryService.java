package com.example.catalogservice.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map uploadImage(MultipartFile file) throws IOException {
        return cloudinary.uploader().upload(file.getBytes(), 
            ObjectUtils.asMap("resource_type", "image", "folder", "mcmusic/images"));
    }

    public Map uploadAudio(MultipartFile file) throws IOException {
        // Cloudinary uses "video" as resource_type for both video and audio (mp3, wav, etc.)
        return cloudinary.uploader().upload(file.getBytes(), 
            ObjectUtils.asMap("resource_type", "video", "folder", "mcmusic/audio")); 
    }

    public Map deleteFile(String publicId, String resourceType) throws IOException {
        return cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
    }
}
