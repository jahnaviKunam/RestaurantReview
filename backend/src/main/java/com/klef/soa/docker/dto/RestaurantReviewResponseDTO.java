package com.klef.soa.docker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantReviewResponseDTO {

    private Long id;
    private String reviewerName;
    private Integer rating;
    private String comments;
    private String reviewDate;
}
