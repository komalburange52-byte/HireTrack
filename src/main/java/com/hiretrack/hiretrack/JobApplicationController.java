
package com.hiretrack.hiretrack;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationRepository repository;

    public JobApplicationController(JobApplicationRepository repository) {
        this.repository = repository;
    }

    // Get all job applications
    
    @GetMapping
    public List<JobApplication> getAllApplications() {
        return repository.findAll();
    }

    // Create a new job application
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
  public JobApplication createApplication(
        @Valid @RequestBody JobApplication application) {

        if (application.getCompanyName() == null
                || application.getCompanyName().isBlank()) {
            throw new IllegalArgumentException("Company name is required.");
        }

        if (application.getJobTitle() == null
                || application.getJobTitle().isBlank()) {
            throw new IllegalArgumentException("Job title is required.");
        }

        if (application.getApplicationStatus() == null
                || application.getApplicationStatus().isBlank()) {
            application.setApplicationStatus("APPLIED");
        }

        if (application.getAppliedDate() == null) {
            application.setAppliedDate(java.time.LocalDate.now());
        }

        return repository.save(application);
    }
   
// Search applications by company name
@GetMapping("/search")
public List<JobApplication> searchApplications(
        @RequestParam String company) {

    return repository.findByCompanyNameContainingIgnoreCase(company);
}

// Filter applications by application status
@GetMapping("/status")
public List<JobApplication> filterApplicationsByStatus(
        @RequestParam String status) {

    return repository.findByApplicationStatusIgnoreCase(status);
}

    // Get a single application by ID
    @GetMapping("/{id}")
    public ResponseEntity<JobApplication> getApplicationById(
            @PathVariable Long id) {

        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update the status of an application
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        return repository.findById(id)
                .map(application -> {

                    String status = request.get("applicationStatus");

                    if (status == null || status.isBlank()) {
                        return ResponseEntity.badRequest()
                                .body("Application status is required.");
                    }

                    application.setApplicationStatus(status.toUpperCase());

                    JobApplication updatedApplication =
                            repository.save(application);

                    return ResponseEntity.ok(updatedApplication);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete an application by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable Long id) {

        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}