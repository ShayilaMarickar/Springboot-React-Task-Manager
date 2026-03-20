package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "mindmap_nodes")
public class MindMapNode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;
    private double x = 0.0;
    private double y = 0.0;
    private String priority = "normal";
    private boolean root = false;
    private boolean completed = false;
    private Long subtaskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canvas_id")
    @JsonIgnore
    private MindMapCanvas canvas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore
    private MindMapNode parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MindMapNode> children = new ArrayList<>();
}
