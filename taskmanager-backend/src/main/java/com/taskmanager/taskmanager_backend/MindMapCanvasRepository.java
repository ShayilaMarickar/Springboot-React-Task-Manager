package com.taskmanager.taskmanager_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MindMapCanvasRepository extends JpaRepository<MindMapCanvas, Long> {
    List<MindMapCanvas> findByOwnerOrderByCreatedAtDesc(User owner);
    List<MindMapCanvas> findByOwnerAndTaskIsNullOrderByCreatedAtDesc(User owner);
    List<MindMapCanvas> findByOwnerAndTaskIdOrderByCreatedAtDesc(User owner, Long taskId);
}
