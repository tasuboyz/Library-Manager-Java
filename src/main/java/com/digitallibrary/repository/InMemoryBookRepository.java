package com.digitallibrary.repository;

import com.digitallibrary.model.Book;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class InMemoryBookRepository implements BookRepository {

    private final Map<String, Book> store = new ConcurrentHashMap<>();

    @Override
    public Book save(Book book) {
        store.put(book.getId(), book);
        return book;
    }

    @Override
    public Optional<Book> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    @Override
    public List<Book> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public Book update(Book book) {
        store.put(book.getId(), book);
        return book;
    }

    @Override
    public boolean deleteById(String id) {
        return store.remove(id) != null;
    }

    @Override
    public void saveAll(List<Book> books) {
        for (Book b : books) store.put(b.getId(), b);
    }

    @Override
    public List<Book> loadAll() {
        return findAll();
    }
}
