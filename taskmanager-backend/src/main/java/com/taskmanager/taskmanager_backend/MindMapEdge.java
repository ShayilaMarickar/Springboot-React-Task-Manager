package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Entity
@Table(name = "mindmap_edges")
public class MindMapEdge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sourceNodeId;
    private String targetNodeId;
    private String color = "#667eea";

    @ManyToOne
    @JoinColumn(name = "canvas_id")
    @JsonIgnore
    private MindMapCanvas canvas;
}
