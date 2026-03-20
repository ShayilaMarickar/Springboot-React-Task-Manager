package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "subtasks")
public class Subtask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private boolean completed = false;
    private LocalDateTime dueDate;
    private String priority = "normal";

    @ManyToOne
    @JoinColumn(name = "task_id")
    @JsonBackReference
    private Task task;
}
