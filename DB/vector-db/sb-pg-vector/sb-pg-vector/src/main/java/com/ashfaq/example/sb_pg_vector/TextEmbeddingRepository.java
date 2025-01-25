package com.ashfaq.example.sb_pg_vector;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TextEmbeddingRepository extends JpaRepository<TextEmbedding, Long> {
}
