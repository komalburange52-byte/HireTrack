
package com.hiretrack.hiretrack;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Welcome to HireTrack! Your Java backend is running successfully.";
    }

    @GetMapping("/api/health")
    public String health() {
        return "HireTrack API is healthy!";
    }
}
