package com.taskmanager.taskmanager_backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mindmaps")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class MindMapController {

    @Autowired private MindMapNodeRepository mindMapNodeRepository;
    @Autowired private MindMapCanvasRepository canvasRepository;
    @Autowired private MindMapEdgeRepository edgeRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private SubtaskRepository subtaskRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    // ── Canvas endpoints ──────────────────────────────────────────

    @GetMapping("/canvases")
    public List<MindMapCanvas> getAllCanvases() {
        return canvasRepository.findByOwnerOrderByCreatedAtDesc(getCurrentUser());
    }

    @GetMapping("/canvases/standalone")
    public List<MindMapCanvas> getStandaloneCanvases() {
        return canvasRepository
            .findByOwnerAndTaskIsNullOrderByCreatedAtDesc(getCurrentUser());
    }

    @GetMapping("/canvases/task/{taskId}")
    public List<MindMapCanvas> getTaskCanvases(@PathVariable Long taskId) {
        return canvasRepository
            .findByOwnerAndTaskIdOrderByCreatedAtDesc(getCurrentUser(), taskId);
    }

    @Transactional
    @PostMapping("/canvases")
    public MindMapCanvas createCanvas(@RequestBody MindMapCanvas canvas) {
        canvas.setOwner(getCurrentUser());
        MindMapCanvas saved = canvasRepository.save(canvas);
        canvasRepository.flush();
        return saved;
    }

    @Transactional
    @PostMapping("/canvases/task/{taskId}")
    public MindMapCanvas createTaskCanvas(@PathVariable Long taskId,
                                           @RequestBody MindMapCanvas canvas) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        canvas.setOwner(getCurrentUser());
        canvas.setTask(task);
        MindMapCanvas saved = canvasRepository.save(canvas);
        canvasRepository.flush();
        return saved;
    }

    @Transactional
    @PutMapping("/canvases/{id}")
    public MindMapCanvas updateCanvas(@PathVariable Long id,
                                       @RequestBody MindMapCanvas updated) {
        MindMapCanvas canvas = canvasRepository.findById(id).orElseThrow();
        canvas.setTitle(updated.getTitle());
        canvas.setLabel(updated.getLabel());
        canvas.setLabelColor(updated.getLabelColor());
        return canvasRepository.save(canvas);
    }

    @Transactional
    @DeleteMapping("/canvases/{id}")
    public void deleteCanvas(@PathVariable Long id) {
        // 1. Delete edges first
        edgeRepository.deleteByCanvasId(id);
        edgeRepository.flush();

        // 2. Get all nodes for this canvas
        List<MindMapNode> allNodes = mindMapNodeRepository.findByCanvasId(id);

        // 3. Delete leaf nodes first (nodes with no children)
        List<MindMapNode> leafNodes = allNodes.stream()
            .filter(n -> n.getChildren() == null || n.getChildren().isEmpty())
            .collect(Collectors.toList());
        leafNodes.forEach(n -> mindMapNodeRepository.deleteById(n.getId()));
        mindMapNodeRepository.flush();

        // 4. Delete remaining nodes
        mindMapNodeRepository.deleteByCanvasId(id);
        mindMapNodeRepository.flush();

        // 5. Finally delete the canvas
        canvasRepository.deleteById(id);
    }

    // ── Node endpoints ────────────────────────────────────────────

    @GetMapping("/canvas/{canvasId}/nodes")
    public List<MindMapNode> getCanvasNodes(@PathVariable Long canvasId) {
        return mindMapNodeRepository.findByCanvasId(canvasId);
    }

    @Transactional
    @PostMapping("/canvas/{canvasId}/root")
    public MindMapNode createRootNode(@PathVariable Long canvasId,
                                       @RequestBody MindMapNode node) {
        MindMapCanvas canvas = canvasRepository.findById(canvasId)
            .orElseThrow(() -> new RuntimeException("Canvas not found: " + canvasId));
        node.setCanvas(canvas);
        node.setRoot(true);
        node.setX(300);
        node.setY(200);
        MindMapNode saved = mindMapNodeRepository.save(node);
        mindMapNodeRepository.flush();
        return saved;
    }

    @Transactional
    @PostMapping("/{parentId}/child")
    public MindMapNode addChild(@PathVariable Long parentId,
                                 @RequestBody MindMapNode node) {
        MindMapNode parent = mindMapNodeRepository.findById(parentId)
            .orElseThrow(() -> new RuntimeException("Parent not found: " + parentId));
        node.setParent(parent);
        node.setCanvas(parent.getCanvas());
        MindMapNode saved = mindMapNodeRepository.save(node);
        mindMapNodeRepository.flush();
        return saved;
    }

    @Transactional
    @PutMapping("/{id}/position")
    public MindMapNode updatePosition(@PathVariable Long id,
                                       @RequestBody Map<String, Double> position) {
        MindMapNode node = mindMapNodeRepository.findById(id).orElseThrow();
        node.setX(position.get("x"));
        node.setY(position.get("y"));
        return mindMapNodeRepository.save(node);
    }

    @Transactional
    @PutMapping("/{id}/label")
    public MindMapNode updateLabel(@PathVariable Long id,
                                    @RequestBody Map<String, String> body) {
        MindMapNode node = mindMapNodeRepository.findById(id).orElseThrow();
        node.setLabel(body.get("label"));
        return mindMapNodeRepository.save(node);
    }

    @Transactional
    @PutMapping("/{id}/priority")
    public MindMapNode updatePriority(@PathVariable Long id,
                                       @RequestBody Map<String, String> body) {
        MindMapNode node = mindMapNodeRepository.findById(id).orElseThrow();
        node.setPriority(body.get("priority"));
        return mindMapNodeRepository.save(node);
    }

    @Transactional
    @PutMapping("/{id}/toggle")
    public Map<String, Object> toggleNode(@PathVariable Long id) {
        MindMapNode node = mindMapNodeRepository.findById(id).orElseThrow();
        node.setCompleted(!node.isCompleted());
        mindMapNodeRepository.save(node);

        Map<String, Object> result = new HashMap<>();
        result.put("completed", node.isCompleted());

        if (node.getSubtaskId() != null) {
            subtaskRepository.findById(node.getSubtaskId()).ifPresent(subtask -> {
                subtask.setCompleted(node.isCompleted());
                subtaskRepository.save(subtask);
                result.put("subtaskSynced", true);
            });
        }
        return result;
    }

    @Transactional
    @DeleteMapping("/{id}")
    public void deleteNode(@PathVariable Long id) {
        mindMapNodeRepository.deleteById(id);
    }

    // ── Edge endpoints ────────────────────────────────────────────

    @GetMapping("/canvas/{canvasId}/edges")
    public List<MindMapEdge> getCanvasEdges(@PathVariable Long canvasId) {
        return edgeRepository.findByCanvasId(canvasId);
    }

    @Transactional
    @PostMapping("/canvas/{canvasId}/edges")
    public MindMapEdge saveEdge(@PathVariable Long canvasId,
                                 @RequestBody MindMapEdge edge) {
        MindMapCanvas canvas = canvasRepository.findById(canvasId).orElseThrow();
        edge.setCanvas(canvas);
        return edgeRepository.save(edge);
    }

    @Transactional
    @DeleteMapping("/canvas/{canvasId}/edges")
    public void deleteAllEdges(@PathVariable Long canvasId) {
        edgeRepository.deleteByCanvasId(canvasId);
    }

    @Transactional
    @DeleteMapping("/edges/{id}")
    public void deleteEdge(@PathVariable Long id) {
        edgeRepository.deleteById(id);
    }
}