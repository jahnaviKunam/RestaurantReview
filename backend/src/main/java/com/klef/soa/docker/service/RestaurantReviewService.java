package com.klef.soa.docker.service;

import java.util.List;

import com.klef.soa.docker.entity.RestaurantReview;

public interface RestaurantReviewService {

    public RestaurantReview addReview(RestaurantReview review);

    public List<RestaurantReview> getAllReviews();

    public RestaurantReview getReviewById(Long id);

    public RestaurantReview updateReview(Long id, RestaurantReview review);

    public void deleteReview(Long id);
}
