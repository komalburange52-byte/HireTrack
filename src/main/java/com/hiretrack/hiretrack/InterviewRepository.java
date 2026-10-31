
package com.hiretrack.hiretrack;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByInterviewStatusIgnoreCase(String interviewStatus);

    List<Interview> findByCompanyNameContainingIgnoreCase(String companyName);

    List<Interview> findByPreparationCompleted(Boolean preparationCompleted);
}
