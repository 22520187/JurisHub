package com.example.jurisHub.controller;

import com.example.jurisHub.dto.forum.PostLabelDto;
import com.example.jurisHub.service.PostLabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/labels")
@RequiredArgsConstructor
public class PostLabelController {

    private final PostLabelService postLabelService;

    @GetMapping
    public ResponseEntity<List<PostLabelDto>> getAllLabels() {
        return ResponseEntity.ok(postLabelService.getAllLabels());
    }

    @GetMapping("/active")
    public ResponseEntity<List<PostLabelDto>> getActiveLabels() {
        return ResponseEntity.ok(postLabelService.getActiveLabels());
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<PostLabelDto>> getLabelsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(postLabelService.getLabelsByCategory(categoryId));
    }

    @GetMapping("/global")
    public ResponseEntity<List<PostLabelDto>> getGlobalLabels() {
        return ResponseEntity.ok(postLabelService.getGlobalLabels());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostLabelDto> getLabelById(@PathVariable Long id) {
        return ResponseEntity.ok(postLabelService.getLabelById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostLabelDto> getLabelBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(postLabelService.getLabelBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<PostLabelDto> createLabel(@RequestBody PostLabelDto labelDto) {
        return ResponseEntity.ok(postLabelService.createLabel(labelDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostLabelDto> updateLabel(
            @PathVariable Long id,
            @RequestBody PostLabelDto labelDto) {
        return ResponseEntity.ok(postLabelService.updateLabel(id, labelDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id) {
        postLabelService.deleteLabel(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleLabelStatus(@PathVariable Long id) {
        postLabelService.toggleLabelStatus(id);
        return ResponseEntity.ok().build();
    }
}
