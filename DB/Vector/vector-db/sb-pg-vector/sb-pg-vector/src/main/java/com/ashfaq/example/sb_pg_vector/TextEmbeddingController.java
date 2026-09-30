package com.ashfaq.example.sb_pg_vector;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/files")
public class TextEmbeddingController {
    private final TextEmbeddingService service;

    public TextEmbeddingController(TextEmbeddingService service) {
        this.service = service;
    }

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) throws Exception {
        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"));
        Path filePath = Files.createTempFile(tempDir, "upload-", file.getOriginalFilename());
        Files.write(filePath, file.getBytes());

        // Generate embedding (stub for now)
        String content = Files.readString(filePath);
        float[] embedding = generateEmbedding(content); // Replace with real embedding generation

        service.save(file.getOriginalFilename(), content, embedding);
        return "File uploaded and processed successfully.";
    }

    @GetMapping
    public List<TextEmbedding> getAllFiles() {
        return service.getAll();
    }

    private float[] generateEmbedding(String text) {
        // Mock embedding generation (e.g., random numbers)
        float[] embedding = new float[512];
        for (int i = 0; i < 512; i++) {
            embedding[i] = (float) Math.random();
        }
        return embedding;
    }
}
