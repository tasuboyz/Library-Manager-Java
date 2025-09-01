package com.digitallibrary.repository;

import com.digitallibrary.model.Book;
import java.util.List;
import java.util.Optional;

public interface BookRepository {
    Book save(Book book);
    Optional<Book> findById(String id);
    List<Book> findAll();
    Book update(Book book);
    boolean deleteById(String id);
    void saveAll(List<Book> books);
    List<Book> loadAll();
}
