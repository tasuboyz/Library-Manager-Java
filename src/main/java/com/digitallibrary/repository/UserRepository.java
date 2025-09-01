package com.digitallibrary.repository;

import com.digitallibrary.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);
    Optional<User> findById(String id);
    List<User> findAll();
    boolean deleteById(String id);
}
