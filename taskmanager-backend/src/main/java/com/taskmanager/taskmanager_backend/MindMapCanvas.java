package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "mindmap_canvases")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MindMapCanvas {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String label = "none";
    private String labelColor = "#667eea";
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnore
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @JsonIgnoreProperties({"subtasks", "owner", "hibernateLazyInitializer"})
    private Task task;

    @OneToMany(mappedBy = "canvas", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MindMapNode> nodes = new ArrayList<>();
}
