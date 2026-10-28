package com.klef.soa.docker.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.klef.soa.docker.entity.RestaurantReview;
import com.klef.soa.docker.repository.RestaurantReviewRepository;
import com.klef.soa.docker.service.RestaurantReviewService;

@Service
public class RestaurantReviewServiceImpl implements RestaurantReviewService {

    @Autowired
    private RestaurantReviewRepository repo;

    @Override
    public RestaurantReview addReview(RestaurantReview review) {
        return repo.save(review);
    }

    @Override
    public RestaurantReview updateReview(Long id, RestaurantReview r) {
        Optional<RestaurantReview> optional = repo.findById(id);

        if (optional.isPresent()) {
            RestaurantReview review = optional.get();

            review.setReviewerName(r.getReviewerName());
            review.setRating(r.getRating());
            review.setComments(r.getComments());
            review.setReviewDate(r.getReviewDate());

            return repo.save(review);
        } else {
            return null;
        }
    }

    @Override
    public List<RestaurantReview> getAllReviews() {
        return repo.findAll();
    }

    @Override
    public RestaurantReview getReviewById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public void deleteReview(Long id) {
        boolean flag = repo.existsById(id);

        if (flag) {
            repo.deleteById(id);
        }
    }
}
