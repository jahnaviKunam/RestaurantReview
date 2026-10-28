package com.klef.soa.docker.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReviewRequestDTO {

    @NotBlank(message = "Reviewer name is required")
    @Size(min = 2, max = 60, message = "Name must be between 2 and 60 characters")
    private String reviewerName;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @NotBlank(message = "Comments are required")
    @Size(max = 1000, message = "Comments cannot exceed 1000 characters")
    private String comments;

    @NotBlank(message = "Review date is required")
    private String reviewDate;
}