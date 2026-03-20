package com.taskmanager.taskmanager_backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByTaskId(Long taskId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Subtask s WHERE s.id = :id")
    void deleteSubtaskById(Long id);
}
