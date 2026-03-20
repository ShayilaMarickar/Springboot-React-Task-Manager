package com.taskmanager.taskmanager_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface MindMapNodeRepository extends JpaRepository<MindMapNode, Long> {
    List<MindMapNode> findByCanvasId(Long canvasId);

    @Transactional
    void deleteByCanvasId(Long canvasId);
}
