package com.digitallibrary.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Rappresenta un libro nel catalogo della libreria digitale.
 * Questa classe incapsula tutte le informazioni relative a un libro
 * e fornisce metodi per accedere e modificare tali informazioni.
 * 
 * @author Digital Library Team
 * @version 1.0
 */
public class Book {
    
    // Attributi privati - incapsulamento
    private String id;
    private String title;
    private String author;
    private Genre genre;
    private int publicationYear;
    private String isbn;
    private boolean available;
    private LocalDateTime addedDate;
    
    /**
     * Costruttore completo per creare un nuovo libro
     * 
     * @param id identificatore univoco del libro
     * @param title titolo del libro
     * @param author autore del libro
     * @param genre genere letterario
     * @param publicationYear anno di pubblicazione
     * @param isbn codice ISBN
     */
    public Book(String id, String title, String author, Genre genre, 
                int publicationYear, String isbn) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.publicationYear = publicationYear;
        this.isbn = isbn;
        this.available = true; // Default: disponibile
        this.addedDate = LocalDateTime.now();
    }
    
    // Costruttore di default per operazioni speciali
    public Book() {
        this.available = true;
        this.addedDate = LocalDateTime.now();
    }
    
    // Getter methods
    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public Genre getGenre() { return genre; }
    public int getPublicationYear() { return publicationYear; }
    public String getIsbn() { return isbn; }
    public boolean isAvailable() { return available; }
    public LocalDateTime getAddedDate() { return addedDate; }
    
    // Setter methods con validazione
    public void setId(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("ID non può essere null o vuoto");
        }
        this.id = id;
    }
    
    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Titolo non può essere null o vuoto");
        }
        this.title = title;
    }
    
    public void setAuthor(String author) {
        if (author == null || author.trim().isEmpty()) {
            throw new IllegalArgumentException("Autore non può essere null o vuoto");
        }
        this.author = author;
    }
    
    public void setGenre(Genre genre) {
        if (genre == null) {
            throw new IllegalArgumentException("Genere non può essere null");
        }
        this.genre = genre;
    }
    
    public void setPublicationYear(int publicationYear) {
        int currentYear = LocalDateTime.now().getYear();
        if (publicationYear < 1450 || publicationYear > currentYear) {
            throw new IllegalArgumentException(
                "Anno di pubblicazione deve essere tra 1450 e " + currentYear);
        }
        this.publicationYear = publicationYear;
    }
    
    public void setIsbn(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN non può essere null o vuoto");
        }
        String cleaned = isbn.replaceAll("[-\\s]", "");
        if (!isValidIsbn(cleaned)) {
            throw new IllegalArgumentException("ISBN non valido: " + isbn);
        }
        this.isbn = isbn;
    }

    private boolean isValidIsbn(String s) {
        // Accetta ISBN-10 o ISBN-13 basico: 10 o 13 cifre (non esegue checksum per semplicità)
        if (s == null) return false;
        return s.matches("\\d{10}") || s.matches("\\d{13}");
    }

    /**
     * Metodo statico helper per validare un ISBN senza creare un'istanza
     * Utilizzato dalla UI per controllare l'input prima di costruire l'oggetto
     */
    public static void validateIsbnStatic(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) throw new IllegalArgumentException("ISBN non può essere vuoto");
        String cleaned = isbn.replaceAll("[-\\s]", "");
        if (!(cleaned.matches("\\d{10}") || cleaned.matches("\\d{13}"))) {
            throw new IllegalArgumentException("ISBN non valido: deve essere 10 o 13 cifre (opzionali '-' o spazi)");
        }
    }
    
    public void setAvailable(boolean available) {
        this.available = available;
    }
    
    public void setAddedDate(LocalDateTime addedDate) {
        this.addedDate = addedDate;
    }
    
    /**
     * Override del metodo equals per confrontare libri
     * Due libri sono considerati uguali se hanno lo stesso ID
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Book book = (Book) obj;
        return Objects.equals(id, book.id);
    }
    
    /**
     * Override del metodo hashCode
     */
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    /**
     * Rappresentazione string del libro per visualizzazione
     */
    @Override
    public String toString() {
        return String.format(
            "Book{id='%s', title='%s', author='%s', genre=%s, year=%d, isbn='%s', available=%s}",
            id, title, author, genre, publicationYear, isbn, available
        );
    }
    
    /**
     * Metodo di utilità per ottenere una rappresentazione formattata del libro
     */
    public String getFormattedInfo() {
        return String.format(
            "📚 [%s] %s\n" +
            "   👤 Autore: %s\n" +
            "   🏷️  Genere: %s\n" +
            "   📅 Anno: %d\n" +
            "   📖 ISBN: %s\n" +
            "   ✅ Disponibile: %s",
            id, title, author, genre.getDisplayName(), 
            publicationYear, isbn, available ? "Sì" : "No"
        );
    }
}
