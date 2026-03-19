package com.taskmanager.taskmanager_backend;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private boolean completed = false;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User owner;

    @JsonManagedReference
    @OneToMany(mappedBy = "parentTask", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Subtask> subtasks = new ArrayList<>();
}