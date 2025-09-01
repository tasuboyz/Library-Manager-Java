package com.digitallibrary.service;

import com.digitallibrary.model.Loan;
import com.digitallibrary.repository.LoanRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public class LoanService {
    private final LoanRepository repo;

    public LoanService(LoanRepository repo) {
        this.repo = repo;
    }

    public Loan createLoan(Loan loan) {
        loan.setLoanedAt(LocalDateTime.now());
        return repo.save(loan);
    }

    public Optional<Loan> findById(String id) { return repo.findById(id); }
    public List<Loan> listAll() { return repo.findAll(); }
    public List<Loan> findByUserId(String userId) { return repo.findByUserId(userId); }
    public List<Loan> findByBookId(String bookId) { return repo.findByBookId(bookId); }
    public boolean delete(String id) { return repo.deleteById(id); }

    public Loan markReturned(String loanId) {
        Optional<Loan> opt = repo.findById(loanId);
        if (!opt.isPresent()) throw new IllegalArgumentException("Prestito non trovato");
        Loan l = opt.get();
        l.setReturnedAt(LocalDateTime.now());
        repo.save(l);
        return l;
    }
}
