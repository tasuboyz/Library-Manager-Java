package com.digitallibrary.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Loan {
    private String id;
    private String bookId;
    private String userId;
    private LocalDateTime loanedAt;
    private LocalDateTime dueAt;
    private LocalDateTime returnedAt;

    public Loan() {
        this.loanedAt = LocalDateTime.now();
    }

    public Loan(String id, String bookId, String userId, LocalDateTime dueAt) {
        this.id = id;
        this.bookId = bookId;
        this.userId = userId;
        this.loanedAt = LocalDateTime.now();
        this.dueAt = dueAt;
    }

    public String getId() { return id; }
    public String getBookId() { return bookId; }
    public String getUserId() { return userId; }
    public LocalDateTime getLoanedAt() { return loanedAt; }
    public LocalDateTime getDueAt() { return dueAt; }
    public LocalDateTime getReturnedAt() { return returnedAt; }

    public void setId(String id) { this.id = id; }
    public void setBookId(String bookId) { this.bookId = bookId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setLoanedAt(LocalDateTime loanedAt) { this.loanedAt = loanedAt; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
    public void setReturnedAt(LocalDateTime returnedAt) { this.returnedAt = returnedAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Loan loan = (Loan) o;
        return Objects.equals(id, loan.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Loan{id='%s', bookId='%s', userId='%s', loanedAt=%s, dueAt=%s, returnedAt=%s}", id, bookId, userId, loanedAt, dueAt, returnedAt);
    }
}
