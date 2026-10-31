
package com.hiretrack.hiretrack;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobApplicationRepository
        extends JpaRepository<JobApplication, Long> {

    // Search applications by company name
    List<JobApplication> findByCompanyNameContainingIgnoreCase(
            String companyName);

    // Filter applications by status
    List<JobApplication> findByApplicationStatusIgnoreCase(
            String applicationStatus);
}
