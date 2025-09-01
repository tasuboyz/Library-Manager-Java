package com.digitallibrary.repository;

import com.digitallibrary.model.Loan;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class InMemoryLoanRepository implements LoanRepository {
    private final Map<String, Loan> store = new ConcurrentHashMap<>();

    @Override
    public Loan save(Loan loan) {
        store.put(loan.getId(), loan);
        return loan;
    }

    @Override
    public Optional<Loan> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Loan> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public List<Loan> findByUserId(String userId) {
        return store.values().stream().filter(l -> l.getUserId().equals(userId)).collect(Collectors.toList());
    }

    @Override
    public List<Loan> findByBookId(String bookId) {
        return store.values().stream().filter(l -> l.getBookId().equals(bookId)).collect(Collectors.toList());
    }

    @Override
    public boolean deleteById(String id) {
        return store.remove(id) != null;
    }
}
