# Digital Library Manager - Java Project

## Project Overview
A console-based Java application for managing a digital library catalog with CRUD operations and file persistence.

## Project Structure
```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── digitallibrary/
│   │           ├── model/
│   │           ├── service/
│   │           ├── repository/
│   │           ├── util/
│   │           └── DigitalLibraryApp.java
│   └── resources/
└── test/
    └── java/
```

## Development Progress
- [x] Project setup and structure creation
- [ ] Phase 1: Requirements analysis and functionality definition
- [ ] Phase 2: Class design and UML diagram
- [ ] Phase 3: Base implementation
- [ ] Phase 4: Console I/O management
- [ ] Phase 5: File persistence (CSV/JSON)
- [ ] Phase 6: Exception handling
- [ ] Phase 7: Advanced features (Streams, filters)
- [ ] Phase 8: Testing and code refinement

## Key Features
- Book catalog management (CRUD operations)
- Console-based user interface
- File persistence (CSV or JSON)
- Search and filtering capabilities
- Exception handling
- Clean, maintainable code structure
 - Library users and loan management (create/return loans)
 - JSON persistence for users and loans (Gson-backed)
 - Optional SQLite persistence for books

## Recent changes
- Added `User` and `Loan` domain models and services.
- Implemented `JsonUserRepository` and `JsonLoanRepository` using Gson for robust JSON handling.
- Refactored `JsonBookRepository` to use Gson.
- Added seeding logic: `data/books.json` and `data/users.json` are used to seed in-memory or DB stores.
- Loan create/return operations update `Book.available` and persist loans when using JSON repositories.
- Added `libs/gson-2.10.1.jar` locally for compilation/testing in environments without Gradle.

## Current status / Notes
- Main source compilation: OK (Gson + SQLite jars included in classpath when needed).
- Runtime smoke test (mode `--memory`): OK — users/loans load and seed loans behave as expected; creating and returning loans updates state.
- Unit tests: present (JUnit 5) but running them requires Gradle or configuring classpath; test integration is pending.

## Next steps
- Stabilize and unify JSON persistence behavior: ensure `data/loans.json` is created when desired and document CLI flags.
- Add unit/integration tests for `LoanService`, `JsonLoanRepository`, and `SqliteBookRepository`.
- Add a Gradle Wrapper (`gradlew`) or CI config to automate builds and tests.
- (Optional) Add a small integration script to seed and export DB state for demos.

If you want, I can: (A) create `data/loans.json` automatically when seeding, (B) wire a CLI flag `--persist-loans`, or (C) add Gradle wrapper and basic CI; tell me which and I proceed.
