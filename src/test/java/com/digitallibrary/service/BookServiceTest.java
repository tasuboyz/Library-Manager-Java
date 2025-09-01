package com.digitallibrary.service;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Genre;
import com.digitallibrary.repository.InMemoryBookRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class BookServiceTest {

    @Test
    public void testAddAndList() {
        InMemoryBookRepository repo = new InMemoryBookRepository();
        BookService service = new BookService(repo);

        String id = UUID.randomUUID().toString();
        Book b = new Book(id, "T", "A", Genre.FICTION, 2000, "1234567890");
        service.addBook(b);

        List<Book> all = service.listAll();
        assertEquals(1, all.size());
        assertEquals(id, all.get(0).getId());
    }

    @Test
    public void testSearchByTitle() {
        InMemoryBookRepository repo = new InMemoryBookRepository();
        BookService service = new BookService(repo);

        Book b1 = new Book(UUID.randomUUID().toString(), "Java Programming", "X", Genre.TECHNOLOGY, 2020, "1234567890");
        Book b2 = new Book(UUID.randomUUID().toString(), "Cooking 101", "Y", Genre.COOKING, 2018, "1234567890");
        service.addBook(b1);
        service.addBook(b2);

        List<Book> res = service.searchByTitle("java");
        assertEquals(1, res.size());
        assertTrue(res.get(0).getTitle().contains("Java"));
    }
}
