package com.digitallibrary.service;

import com.digitallibrary.model.User;
import com.digitallibrary.repository.UserRepository;

import java.util.List;
import java.util.Optional;

public class UserService {
    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User register(User user) {
        return repo.save(user);
    }

    public Optional<User> findById(String id) {
        return repo.findById(id);
    }

    public List<User> listAll() {
        return repo.findAll();
    }

    public boolean delete(String id) {
        return repo.deleteById(id);
    }
}
