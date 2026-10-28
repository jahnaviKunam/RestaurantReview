
package com.klef.soa.docker.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.klef.soa.docker.entity.RestaurantReview;
import com.klef.soa.docker.service.RestaurantReviewService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/restaurantreview")
@CrossOrigin(origins = "*")
public class RestaurantReviewController {

    @Autowired
    private RestaurantReviewService service;

    @GetMapping("/")
    public String demo() {
        return "Restaurant Review Spring Boot Project";
    }

    // Add Review
    @PostMapping("/add")
    public ResponseEntity<RestaurantReview> addReview(
            @Valid @RequestBody RestaurantReview review) {

        RestaurantReview r = service.addReview(review);
        return ResponseEntity.status(201).body(r);
    }

    // Display All Reviews
    @GetMapping("/displayall")
    public ResponseEntity<List<RestaurantReview>> getAllReviews() {

        List<RestaurantReview> reviews = service.getAllReviews();
        return ResponseEntity.status(200).body(reviews);
    }

    // Display Review By ID
    @GetMapping("/display")
    public ResponseEntity<?> getReviewById(@RequestParam Long id) {

        RestaurantReview review = service.getReviewById(id);

        if (review != null) {
            return ResponseEntity.status(200).body(review);
        } else {
            return ResponseEntity.status(404)
                    .body("Restaurant Review ID Not Found");
        }
    }

    // Update Review
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody RestaurantReview review) {

        RestaurantReview r = service.updateReview(id, review);

        if (r != null) {
            return ResponseEntity.ok(r);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Restaurant Review ID Not Found");
        }
    }

    // Delete Review By ID
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteReview(@PathVariable Long id) {

        if (service.getReviewById(id) != null) {
            service.deleteReview(id);
            return ResponseEntity.ok("Review Deleted Successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Restaurant Review ID Not Found");
        }
    }
}
