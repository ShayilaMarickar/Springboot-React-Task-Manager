package com.taskmanager.taskmanager_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*", allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT,
               RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class TaskController {

    @Autowired private TaskRepository taskRepository;
    @Autowired private SubtaskRepository subtaskRepository;
    @Autowired private UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping
    public List<Task> getTasks() {
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

    @PatchMapping("/{id}")
    public Task updateTask(@PathVariable Long id,
                            @RequestBody Map<String, String> body) {
        Task task = taskRepository.findById(id).orElseThrow();
        if (body.containsKey("title")) task.setTitle(body.get("title"));
        return taskRepository.save(task);
    }

    @PutMapping("/{id}/notes")
    public Task updateNotes(@PathVariable Long id,
                             @RequestBody Map<String, String> body) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setNotes(body.get("notes"));
        return taskRepository.save(task);
    }

    @Transactional
    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }

    @PostMapping("/{taskId}/subtasks")
    public Subtask addSubtask(@PathVariable Long taskId,
                               @RequestBody Subtask subtask) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        subtask.setTask(task);
        return subtaskRepository.save(subtask);
    }

    @PutMapping("/{taskId}/subtasks/{subtaskId}")
    public Subtask toggleSubtask(@PathVariable Long taskId,
                                  @PathVariable Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId).orElseThrow();
        subtask.setCompleted(!subtask.isCompleted());
        return subtaskRepository.save(subtask);
    }

    @PatchMapping("/{taskId}/subtasks/{subtaskId}")
    public Subtask updateSubtask(@PathVariable Long taskId,
                                  @PathVariable Long subtaskId,
                                  @RequestBody Map<String, String> body) {
        Subtask subtask = subtaskRepository.findById(subtaskId).orElseThrow();
        if (body.containsKey("title") && body.get("title") != null)
            subtask.setTitle(body.get("title"));
        if (body.containsKey("priority") && body.get("priority") != null)
            subtask.setPriority(body.get("priority"));
        if (body.containsKey("dueDate")) {
            String dateVal = body.get("dueDate");
            if (dateVal == null || dateVal.isEmpty()) {
                subtask.setDueDate(null);
            } else {
                try {
                    String cleaned = dateVal.replace("Z", "").replace(".000", "");
                    if (cleaned.length() == 10) cleaned = cleaned + "T00:00:00";
                    subtask.setDueDate(LocalDateTime.parse(cleaned));
                } catch (Exception e) {
                    subtask.setDueDate(null);
                }
            }
        }
        return subtaskRepository.save(subtask);
    }

    @Transactional
    @DeleteMapping("/{taskId}/subtasks/{subtaskId}")
    public void deleteSubtask(@PathVariable Long taskId,
                               @PathVariable Long subtaskId) {
        subtaskRepository.deleteSubtaskById(subtaskId);
    }
}
