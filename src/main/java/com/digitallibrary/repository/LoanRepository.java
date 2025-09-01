package com.digitallibrary.repository;

import com.digitallibrary.model.Loan;

import java.util.List;
import java.util.Optional;

public interface LoanRepository {
    Loan save(Loan loan);
    Optional<Loan> findById(String id);
    List<Loan> findAll();
    List<Loan> findByUserId(String userId);
    List<Loan> findByBookId(String bookId);
    boolean deleteById(String id);
}
