
package com.hiretrack.hiretrack;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/interviews")
@CrossOrigin(origins = "http://localhost:5173")
public class InterviewController {

    private final InterviewRepository interviewRepository;

    public InterviewController(InterviewRepository interviewRepository) {
        this.interviewRepository = interviewRepository;
    }

    // Get all interviews
    @GetMapping
    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    // Get one interview by ID
    @GetMapping("/{id}")
    public ResponseEntity<Interview> getInterviewById(@PathVariable Long id) {
        Optional<Interview> interview = interviewRepository.findById(id);

        return interview.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Create an interview
    @PostMapping
    public ResponseEntity<?> createInterview(@RequestBody Interview interview) {
        if (interview.getCompanyName() == null ||
                interview.getCompanyName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Company name is required.");
        }

        if (interview.getJobTitle() == null ||
                interview.getJobTitle().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Job title is required.");
        }

        interview.setId(null);

        if (interview.getInterviewStatus() == null ||
                interview.getInterviewStatus().isBlank()) {
            interview.setInterviewStatus("SCHEDULED");
        }

        if (interview.getPreparationCompleted() == null) {
            interview.setPreparationCompleted(false);
        }

        Interview savedInterview = interviewRepository.save(interview);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedInterview);
    }

    // Update an interview
    @PutMapping("/{id}")
    public ResponseEntity<?> updateInterview(
            @PathVariable Long id,
            @RequestBody Interview updatedInterview) {

        return interviewRepository.findById(id)
                .map(existingInterview -> {
                    if (updatedInterview.getCompanyName() == null ||
                            updatedInterview.getCompanyName().isBlank()) {
                        return ResponseEntity.badRequest()
                                .body("Company name is required.");
                    }

                    if (updatedInterview.getJobTitle() == null ||
                            updatedInterview.getJobTitle().isBlank()) {
                        return ResponseEntity.badRequest()
                                .body("Job title is required.");
                    }

                    existingInterview.setCompanyName(
                            updatedInterview.getCompanyName());
                    existingInterview.setJobTitle(
                            updatedInterview.getJobTitle());
                    existingInterview.setInterviewDate(
                            updatedInterview.getInterviewDate());
                    existingInterview.setInterviewType(
                            updatedInterview.getInterviewType());
                    existingInterview.setInterviewStatus(
                            updatedInterview.getInterviewStatus() == null ||
                                    updatedInterview.getInterviewStatus().isBlank()
                                    ? "SCHEDULED"
                                    : updatedInterview.getInterviewStatus());
                    existingInterview.setPreparationNotes(
                            updatedInterview.getPreparationNotes());
                    existingInterview.setPreparationCompleted(
                            updatedInterview.getPreparationCompleted() == null
                                    ? false
                                    : updatedInterview.getPreparationCompleted());

                    Interview savedInterview =
                            interviewRepository.save(existingInterview);

                    return ResponseEntity.ok(savedInterview);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete an interview
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInterview(@PathVariable Long id) {
        if (!interviewRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        interviewRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Filter interviews by status
    @GetMapping("/status")
    public List<Interview> getInterviewsByStatus(
            @RequestParam String status) {
        return interviewRepository
                .findByInterviewStatusIgnoreCase(status);
    }

    // Search interviews by company
    @GetMapping("/search")
    public List<Interview> searchInterviews(
            @RequestParam String company) {
        return interviewRepository
                .findByCompanyNameContainingIgnoreCase(company);
    }

    // Filter interviews by preparation progress
    @GetMapping("/preparation")
    public List<Interview> getInterviewsByPreparation(
            @RequestParam Boolean completed) {
        return interviewRepository
                .findByPreparationCompleted(completed);
    }
}
