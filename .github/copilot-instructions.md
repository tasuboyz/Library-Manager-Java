# Digital Library Manager - Java Project

## Project Overview
Small Java application (console + embedded web UI) for managing a digital library catalog with books, users and loans. Supports multiple persistence backends (in-memory, JSON, optional SQLite) and a tiny SPA for browser management.

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
│   │           ├── web/
│   │           ├── util/
│   │           └── DigitalLibraryApp.java
│   └── resources/
└── test/
    └── java/
web/
data/
libs/
```

## Development Progress
- [x] Project setup and structure
- [x] Core domain models (Book, User, Loan)
- [x] Repository & service layers (in-memory, CSV, JSON, SQLite scaffold)
- [x] Gson-backed JSON repositories + TypeAdapters for java.time
- [x] Embedded WebServer + static SPA (`web/index.html`, `web/main.js`, `web/styles.css`)
- [x] Seed logic and data cleanup (deduplicate seed users and loans)
- [x] Fixes: CSV hardening, loan return NPE fix, improved client validation
- [ ] Add unit/integration tests
- [ ] Add Gradle wrapper and CI

## Key Features
- Book catalog CRUD (console + web)
- User registration and loan create/return
- JSON persistence using Gson (pretty printing, custom adapters)
- Optional SQLite repository for books (JDBC)
- Small SPA to manage books/users/loans

## Recent changes / Notes
- Migrated JSON repos to Gson and added TypeAdapters for LocalDate/LocalDateTime to avoid serialization issues.
- Added an embedded HTTP server (`WebServer`) exposing `/api/books`, `/api/users`, `/api/loans` and serving static `web/` files.
- Hardened seeding logic to reuse a canonical seed user, avoid duplicate loans, and auto-create `data/loans.json` when needed.
- Fixed NPE when POSTing to `/api/loans/{id}/return` by guarding null request bodies and separating create vs return paths.
- Improved SPA (`web/main.js`) to render card-based lists, populate selects, escape HTML, and show loading/feedback states.
- Polished styles in `web/styles.css` to a modern responsive layout.

## How to run (quick)
- Compile with javac (class path includes `libs/gson-2.10.1.jar` and optional `libs/sqlite-jdbc-*.jar`) or use Gradle if added.
- Example (Windows PowerShell):
  - javac -cp ".\\libs\\gson-2.10.1.jar;." -d out $(Get-ChildItem -Recurse -Filter "*.java" | ForEach-Object FullName)
  - java -cp ".\\out;libs\\gson-2.10.1.jar;libs\\sqlite-jdbc-3.41.2.1.jar" com.digitallibrary.DigitalLibraryApp --web

## Next steps / Recommendations
- Finish UI polish (icons, responsive tweaks, accessibility) — small CSS/markup iterations remain.
- Add unit and integration tests for `LoanService`, `JsonLoanRepository`, and the web handlers.
- Add a Gradle wrapper and CI pipeline to automate build and tests.
- (Optional) Add a migration step at startup to non-destructively deduplicate seed data.

If you'd like, I can (A) wire `--persist-loans` to toggle loan file persistence, (B) add tests for the return endpoint, or (C) create a Gradle wrapper + basic GitHub Actions CI — tell me which and I proceed.
