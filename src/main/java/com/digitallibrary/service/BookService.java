package com.digitallibrary.service;

import com.digitallibrary.model.Book;
import com.digitallibrary.repository.BookRepository;

import java.util.*;
import java.util.stream.Collectors;

public class BookService {

    private final BookRepository repository;

    public BookService(BookRepository repository) {
        this.repository = repository;
    }

    public Book addBook(Book book) {
        Objects.requireNonNull(book, "book non può essere null");
        return repository.save(book);
    }

    public Optional<Book> getBookById(String id) {
        return repository.findById(id);
    }

    public List<Book> listAll() {
        return repository.findAll();
    }

    public Book updateBook(Book book) {
        return repository.update(book);
    }

    public boolean deleteBook(String id) {
        return repository.deleteById(id);
    }

    // Ricerca semplice per titolo (case-insensitive)
    public List<Book> searchByTitle(String q) {
        if (q == null || q.trim().isEmpty()) return Collections.emptyList();
        String term = q.trim().toLowerCase();
        return repository.findAll().stream()
            .filter(b -> b.getTitle() != null && b.getTitle().toLowerCase().contains(term))
            .collect(Collectors.toList());
    }

    // Filtri combinati
    public List<Book> filter(Optional<String> author, Optional<String> genre, Optional<Integer> year) {
        return repository.findAll().stream().filter(b -> {
            if (author.isPresent() && (b.getAuthor() == null || !b.getAuthor().equalsIgnoreCase(author.get()))) return false;
            if (genre.isPresent() && (b.getGenre() == null || !b.getGenre().getDisplayName().equalsIgnoreCase(genre.get()))) return false;
            if (year.isPresent() && b.getPublicationYear() != year.get()) return false;
            return true;
        }).collect(Collectors.toList());
    }
}
