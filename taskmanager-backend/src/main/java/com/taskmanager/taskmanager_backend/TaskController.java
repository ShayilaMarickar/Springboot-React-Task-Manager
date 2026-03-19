package com.taskmanager.taskmanager_backend;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:3000")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findByOwner(getCurrentUser());
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setOwner(getCurrentUser());
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public Task toggleTask(@PathVariable Long id) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }
}