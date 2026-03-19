package com.taskmanager.taskmanager_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByParentTaskId(Long taskId);
}