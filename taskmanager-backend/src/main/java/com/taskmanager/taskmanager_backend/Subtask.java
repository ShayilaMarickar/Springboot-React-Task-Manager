package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

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

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task parentTask;
}