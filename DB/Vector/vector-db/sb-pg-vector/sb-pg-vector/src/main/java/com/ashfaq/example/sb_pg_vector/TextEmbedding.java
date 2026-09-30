package com.ashfaq.example.sb_pg_vector;

import java.util.Arrays;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "text_embeddings")
public class TextEmbedding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;

    @Lob
    private String content;

    @Column(columnDefinition = "vector(512)")
    private float[] embedding;

    public TextEmbedding() {
    }

    public TextEmbedding(Long id, String fileName, String content, float[] embedding) {
        this.id = id;
        this.fileName = fileName;
        this.content = content;
        this.embedding = embedding;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public float[] getEmbedding() {
        return embedding;
    }

    public void setEmbedding(float[] embedding) {
        this.embedding = embedding;
    }

    @Override
    public String toString() {
        return "TextEmbedding [id=" + id + ", fileName=" + fileName + ", content=" + content + ", embedding="
                + Arrays.toString(embedding) + "]";
    }

    
}
