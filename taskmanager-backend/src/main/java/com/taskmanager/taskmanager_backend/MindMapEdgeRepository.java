package com.taskmanager.taskmanager_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface MindMapEdgeRepository extends JpaRepository<MindMapEdge, Long> {
    List<MindMapEdge> findByCanvasId(Long canvasId);

    @Transactional
    void deleteByCanvasId(Long canvasId);
}
