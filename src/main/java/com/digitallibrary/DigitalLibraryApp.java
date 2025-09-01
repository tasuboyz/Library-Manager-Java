package com.digitallibrary;

import com.digitallibrary.model.Book;
import com.digitallibrary.model.Genre;
import com.digitallibrary.repository.CsvBookRepository;
import com.digitallibrary.repository.InMemoryBookRepository;
import com.digitallibrary.repository.BookRepository;
import com.digitallibrary.repository.JsonBookRepository;
import com.digitallibrary.service.BookService;
import com.digitallibrary.util.IdGenerator;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDate;

/**
 * Classe principale per l'applicazione console. Questo esempio è volutamente
 * semplice per facilitare la compilazione su compilatori online.
 */
public class DigitalLibraryApp {

    private final BookService service;
    private com.digitallibrary.service.UserService userService;
    private com.digitallibrary.service.LoanService loanService;
    private final Scanner scanner;

    public DigitalLibraryApp(BookService service) {
        this.service = service;
        this.scanner = new Scanner(System.in);
    }

    public void setUserService(com.digitallibrary.service.UserService us) { this.userService = us; }
    public void setLoanService(com.digitallibrary.service.LoanService ls) { this.loanService = ls; }

    private void run() {
        boolean running = true;
        while (running) {
            printMenu();
            String choice;
            try {
                if (!scanner.hasNextLine()) break;
                choice = scanner.nextLine().trim();
            } catch (NoSuchElementException ne) {
                break;
            }
            switch (choice) {
                case "1": handleAdd(); break;
                case "2": handleList(); break;
                case "3": handleSearch(); break;
                case "4": handleDelete(); break;
                case "5": handleRegisterUser(); break;
                case "6": handleListUsers(); break;
                case "7": handleCreateLoan(); break;
                case "8": handleListLoans(); break;
                case "9": handleReturnLoan(); break;
                case "0": running = false; break;
                default: System.out.println("Scelta non valida");
            }
        }
        System.out.println("Arrivederci!");
    }

    private void handleRegisterUser() {
        if (userService == null) { System.out.println("Servizio utenti non inizializzato."); return; }
        System.out.println("--- Registra Utente ---");
        String name = com.digitallibrary.util.InputHelper.readNonEmptyString(scanner, "Nome: ");
        String email = com.digitallibrary.util.InputHelper.readNonEmptyString(scanner, "Email: ");
        String id = com.digitallibrary.util.IdGenerator.generate();
        com.digitallibrary.model.User u = new com.digitallibrary.model.User(id, name, email);
        userService.register(u);
        System.out.println("Utente registrato con ID: " + id);
    }

    private void handleListUsers() {
        if (userService == null) { System.out.println("Servizio utenti non inizializzato."); return; }
        System.out.println("--- Lista Utenti ---");
        java.util.List<com.digitallibrary.model.User> users = userService.listAll();
        if (users.isEmpty()) { System.out.println("Nessun utente registrato."); return; }
        users.forEach(u -> System.out.println(u.toString()));
    }

    private void handleCreateLoan() {
        if (loanService == null || userService == null) { System.out.println("Servizi prestiti/utenti non inizializzati."); return; }
        System.out.println("--- Crea Prestito ---");
        System.out.print("ID libro: ");
        String bookId = scanner.nextLine().trim();
        java.util.Optional<com.digitallibrary.model.Book> opt = service.getBookById(bookId);
        if (!opt.isPresent()) { System.out.println("Libro non trovato."); return; }
        com.digitallibrary.model.Book book = opt.get();
        if (!book.isAvailable()) {
            System.out.println("Impossibile creare prestito: il libro non è disponibile (probabilmente è già in prestito).");
            return;
        }
        System.out.print("ID utente: ");
        String userId = scanner.nextLine().trim();
        if (!userService.findById(userId).isPresent()) { System.out.println("Utente non trovato."); return; }
        int days = com.digitallibrary.util.InputHelper.readInt(scanner, "Giorni di prestito: ", 14);
        java.time.LocalDateTime due = java.time.LocalDateTime.now().plusDays(days);
        String id = com.digitallibrary.util.IdGenerator.generate();
        com.digitallibrary.model.Loan loan = new com.digitallibrary.model.Loan(id, bookId, userId, due);
        loanService.createLoan(loan);
        // mark book as not available and persist update
        try {
            book.setAvailable(false);
            service.updateBook(book);
        } catch (Exception ex) {
            System.out.println("Warning: non è stato possibile aggiornare lo stato del libro: " + ex.getMessage());
        }
        System.out.println("Prestito creato con ID: " + id);
    }

    private void handleListLoans() {
        if (loanService == null) { System.out.println("Servizio prestiti non inizializzato."); return; }
        System.out.println("--- Lista Prestiti ---");
        java.util.List<com.digitallibrary.model.Loan> loans = loanService.listAll();
        if (loans.isEmpty()) { System.out.println("Nessun prestito."); return; }
        for (com.digitallibrary.model.Loan l : loans) {
            String bookTitle = service.getBookById(l.getBookId()).map(b -> b.getTitle()).orElse("[sconosciuto]");
            String userName = userService.findById(l.getUserId()).map(u -> u.getName()).orElse("[sconosciuto]");
            String returned = l.getReturnedAt() == null ? "In prestito (non restituito)" : "Restituito il " + l.getReturnedAt().toString();
            System.out.println(String.format("Prestito ID: %s - Libro: %s - Utente: %s - Scad.: %s - %s",
                l.getId(), bookTitle, userName, l.getDueAt(), returned));
        }
    }

    private void handleReturnLoan() {
        if (loanService == null) { System.out.println("Servizio prestiti non inizializzato."); return; }
        System.out.print("ID prestito da restituire: ");
        String id = scanner.nextLine().trim();
        try {
            com.digitallibrary.model.Loan l = loanService.markReturned(id);
            // mark book available again
            try {
                service.getBookById(l.getBookId()).ifPresent(b -> { b.setAvailable(true); service.updateBook(b); });
            } catch (Exception ex) {
                System.out.println("Warning: non è stato possibile aggiornare lo stato del libro: " + ex.getMessage());
            }
            System.out.println("Prestito restituito: " + l.getId());
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }

    private void printMenu() {
        System.out.println("\n=== Gestore Libreria Digitale ===");
        System.out.println("1) Aggiungi libro");
        System.out.println("2) Lista libri");
        System.out.println("3) Cerca per titolo");
        System.out.println("4) Elimina libro per ID");
        System.out.println("5) Registra utente");
        System.out.println("6) Lista utenti");
        System.out.println("7) Crea prestito");
        System.out.println("8) Lista prestiti");
        System.out.println("9) Restituisci prestito (per ID)");
        System.out.println("0) Esci");
        System.out.print("Seleziona: ");
    }

    private void handleAdd() {
        System.out.println("--- Aggiungi Libro ---");
        String title = com.digitallibrary.util.InputHelper.readNonEmptyString(scanner, "Titolo: ");
        String author = com.digitallibrary.util.InputHelper.readNonEmptyString(scanner, "Autore: ");
        System.out.println("Seleziona genere:\n" + Genre.getFormattedList());
        int gidx = com.digitallibrary.util.InputHelper.readInt(scanner, "Numero genere: ", 1);
        Genre genre = Genre.fromIndex(gidx);
        int year = com.digitallibrary.util.InputHelper.readInt(scanner, "Anno pubblicazione: ", LocalDate.now().getYear());

        String isbn;
        while (true) {
            isbn = com.digitallibrary.util.InputHelper.readNonEmptyString(scanner, "ISBN: ");
            try {
                // temporary book to validate isbn using Book's setter
                Book.validateIsbnStatic(isbn);
                break;
            } catch (IllegalArgumentException e) {
                System.out.println(e.getMessage());
            }
        }

        String id = IdGenerator.generate();
        Book b = new Book(id, title, author, genre, year, isbn);
        service.addBook(b);
        System.out.println("Libro aggiunto: " + b.getId());
    }

    private void handleList() {
        System.out.println("--- Catalogo Libri ---");
        List<Book> books = service.listAll();
        if (books.isEmpty()) {
            System.out.println("Nessun libro presente.");
            return;
        }
        for (Book b : books) {
            System.out.println(b.getFormattedInfo());
            System.out.println("----------------------");
        }
    }

    private void handleSearch() {
        System.out.print("Termine di ricerca titolo: ");
        String q = scanner.nextLine();
        List<Book> res = service.searchByTitle(q);
        if (res.isEmpty()) System.out.println("Nessun risultato.");
        else res.forEach(b -> System.out.println(b.getFormattedInfo()));
    }

    private void handleDelete() {
        System.out.print("ID del libro da eliminare: ");
        String id = scanner.nextLine().trim();
        boolean ok = service.deleteBook(id);
        System.out.println(ok ? "Eliminato." : "Non trovato.");
    }

    public static void main(String[] args) {
        // Scegli repository in base agli argomenti: --memory, --json o default CSV
        BookRepository repo;
    boolean useMemory = Arrays.asList(args).contains("--memory");
    boolean useJson = Arrays.asList(args).contains("--json");
    boolean useSqlite = Arrays.asList(args).contains("--sqlite");
    String csvPath = System.getProperty("user.home") + "/digitallibrary_books.csv";
    String jsonPath = System.getProperty("user.home") + "/digitallibrary_books.json";
    String sqlitePath = System.getProperty("user.dir") + "/data/sample_books.db";

        if (useMemory) {
            InMemoryBookRepository im = new InMemoryBookRepository();
            // seed in-memory books from data/books.json if present
            java.nio.file.Path seedJson = java.nio.file.Paths.get(System.getProperty("user.dir"), "data", "books.json");
            if (java.nio.file.Files.exists(seedJson)) {
                try {
                    JsonBookRepository loader = new JsonBookRepository(seedJson.toString());
                    java.util.List<Book> seeded = loader.loadAll();
                    im.saveAll(seeded);
                    // later we'll create loans for those books marked as not available
                    // (we'll create them after user repo and loan repo are initialized)
                } catch (Exception ex) {
                    System.out.println("Impossibile caricare seed books: " + ex.getMessage());
                }
            }
            repo = im;
        } else if (useJson) {
            repo = new JsonBookRepository(jsonPath);
        } else if (useSqlite) {
            try {
                com.digitallibrary.repository.SqliteBookRepository srepo = new com.digitallibrary.repository.SqliteBookRepository(sqlitePath);
                // Seed from bundled JSON if DB empty
                java.nio.file.Path seedJson = java.nio.file.Paths.get(System.getProperty("user.dir"), "data", "books.json");
                if (java.nio.file.Files.exists(seedJson)) {
                    JsonBookRepository loader = new JsonBookRepository(seedJson.toString());
                    srepo.saveAll(loader.loadAll());
                }
                repo = srepo;
            } catch (Exception e) {
                e.printStackTrace();
                repo = new InMemoryBookRepository();
            }
        } else {
            try {
                repo = new CsvBookRepository(csvPath);
                repo.loadAll();
            } catch (Exception e) {
                repo = new InMemoryBookRepository();
            }
        }

    BookService service = new BookService(repo);
    DigitalLibraryApp app = new DigitalLibraryApp(service);
    // If repository is empty and a data/books.json seed exists, load it so the web UI shows books
    try {
        java.nio.file.Path seedJson = java.nio.file.Paths.get(System.getProperty("user.dir"), "data", "books.json");
        if (java.nio.file.Files.exists(seedJson) && service.listAll().isEmpty()) {
            try {
                JsonBookRepository loader = new JsonBookRepository(seedJson.toString());
                java.util.List<Book> seeded = loader.loadAll();
                if (seeded != null && !seeded.isEmpty()) {
                    repo.saveAll(seeded);
                    System.out.println("Seeded repository with data/books.json (" + seeded.size() + " books)");
                }
            } catch (Exception ex) {
                System.out.println("Unable to seed books from data/books.json: " + ex.getMessage());
            }
        }
    } catch (Exception e) { /* ignore seeding errors */ }
        // initialize user repository: prefer JSON file if present
        com.digitallibrary.repository.UserRepository urepo;
        java.nio.file.Path usersJson = java.nio.file.Paths.get(System.getProperty("user.dir"), "data", "users.json");
        if (java.nio.file.Files.exists(usersJson)) {
            urepo = new com.digitallibrary.repository.JsonUserRepository(usersJson.toString());
        } else {
            urepo = new com.digitallibrary.repository.InMemoryUserRepository();
        }
        com.digitallibrary.service.UserService userService = new com.digitallibrary.service.UserService(urepo);

        // initialize loan repository: prefer JSON file if present. If running in --memory
        // mode and users.json exists, create data/loans.json (empty array) so loans persist.
        com.digitallibrary.repository.LoanRepository lrepo;
        java.nio.file.Path loansJson = java.nio.file.Paths.get(System.getProperty("user.dir"), "data", "loans.json");
        try {
            if (java.nio.file.Files.exists(loansJson)) {
                lrepo = new com.digitallibrary.repository.JsonLoanRepository(loansJson.toString());
            } else if (useMemory && java.nio.file.Files.exists(usersJson)) {
                // create data directory if missing
                java.nio.file.Path dataDir = loansJson.getParent();
                if (dataDir != null && !java.nio.file.Files.exists(dataDir)) java.nio.file.Files.createDirectories(dataDir);
                // create empty JSON array file to enable JsonLoanRepository
                java.nio.file.Files.write(loansJson, "[]".getBytes(java.nio.charset.StandardCharsets.UTF_8));
                lrepo = new com.digitallibrary.repository.JsonLoanRepository(loansJson.toString());
            } else {
                lrepo = new com.digitallibrary.repository.InMemoryLoanRepository();
            }
        } catch (Exception e) {
            e.printStackTrace();
            lrepo = new com.digitallibrary.repository.InMemoryLoanRepository();
        }
        com.digitallibrary.service.LoanService loanService = new com.digitallibrary.service.LoanService(lrepo);
    // If some seeded books are not available, create corresponding loans and a seed user
    try {
        com.digitallibrary.model.User seedUser = null;
        // Try to find an existing seed user by email to avoid duplicates
        String seedEmail = "seed@example.local";
        for (com.digitallibrary.model.User u : urepo.findAll()) {
            if (u.getEmail() != null && u.getEmail().equalsIgnoreCase(seedEmail)) { seedUser = u; break; }
        }
        // Use service.listAll() to avoid casting repo implementation
        for (Book b : service.listAll()) {
            if (!b.isAvailable()) {
                // ensure seed user exists
                if (seedUser == null) {
                    String sid = com.digitallibrary.util.IdGenerator.generate();
                    seedUser = new com.digitallibrary.model.User(sid, "Sistema (prestiti seed)", seedEmail);
                    urepo.save(seedUser);
                }
                // Avoid creating duplicate loans for the same book
                boolean already = false;
                try {
                    java.util.List<com.digitallibrary.model.Loan> existing = loanService.findByBookId(b.getId());
                    if (existing != null) {
                        for (com.digitallibrary.model.Loan exl : existing) {
                            if (exl != null && (exl.getReturnedAt() == null || exl.getReturnedAt().toString().isEmpty())) { already = true; break; }
                        }
                    }
                } catch (Exception e) { /* ignore errors checking existing loans */ }
                if (!already) {
                    String lid = com.digitallibrary.util.IdGenerator.generate();
                    com.digitallibrary.model.Loan loan = new com.digitallibrary.model.Loan(lid, b.getId(), seedUser.getId(), java.time.LocalDateTime.now().plusDays(14));
                    lrepo.save(loan);
                }
            }
        }
    } catch (Exception ex) {
        System.out.println("Warning during seed loan creation: " + ex.getMessage());
    }
    app.setUserService(userService);
    app.setLoanService(loanService);

    boolean useWeb = Arrays.asList(args).contains("--web");
    if (useWeb) {
        try {
            com.digitallibrary.web.WebServer ws = new com.digitallibrary.web.WebServer(8080, service, userService, loanService);
            ws.start();
            ws.blockUntilStopped();
        } catch (Exception e) {
            e.printStackTrace();
            app.run();
        }
    } else {
        app.run();
    }
    }
}
