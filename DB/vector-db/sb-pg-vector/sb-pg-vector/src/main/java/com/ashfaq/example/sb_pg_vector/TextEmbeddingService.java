package com.ashfaq.example.sb_pg_vector;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class TextEmbeddingService {
    private final TextEmbeddingRepository repository;

    public TextEmbeddingService(TextEmbeddingRepository repository) {
        this.repository = repository;
    }

    public TextEmbedding save(String fileName, String content, float[] embedding) {
        TextEmbedding textEmbedding = new TextEmbedding();
        textEmbedding.setFileName(fileName);
        textEmbedding.setContent(content);
        textEmbedding.setEmbedding(embedding);
        return repository.save(textEmbedding);
    }

    public List<TextEmbedding> getAll() {
        return repository.findAll();
    }
}
