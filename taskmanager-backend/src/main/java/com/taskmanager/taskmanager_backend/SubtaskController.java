package com.taskmanager.taskmanager_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/subtasks")
@CrossOrigin(origins = "http://localhost:3000")
public class SubtaskController {

    @Autowired
    private SubtaskRepository subtaskRepository;

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Subtask> getSubtasks(@PathVariable Long taskId) {
        return subtaskRepository.findByParentTaskId(taskId);
    }

    @PostMapping
    public Subtask createSubtask(@PathVariable Long taskId, @RequestBody Subtask subtask) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        subtask.setParentTask(task);
        return subtaskRepository.save(subtask);
    }

    @PutMapping("/{subtaskId}")
    public Subtask toggleSubtask(@PathVariable Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId).orElseThrow();
        subtask.setCompleted(!subtask.isCompleted());
        return subtaskRepository.save(subtask);
    }

    @DeleteMapping("/{subtaskId}")
    public void deleteSubtask(@PathVariable Long subtaskId) {
        subtaskRepository.deleteById(subtaskId);
    }
}