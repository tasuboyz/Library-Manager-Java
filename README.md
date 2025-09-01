# Gestore di Libreria Digitale

Un'applicazione console Java per la gestione di un catalogo di libri digitali con operazioni CRUD e persistenza su file.

## Caratteristiche Principali

- **Gestione Catalogo**: Aggiunta, modifica, eliminazione e visualizzazione libri
- **Interfaccia Console**: Menù interattivo user-friendly
- **Persistenza Dati**: Salvataggio/caricamento su file CSV o JSON
- **Ricerca Avanzata**: Filtri per titolo, autore, genere, anno
- **Gestione Errori**: Validazione input e gestione eccezioni robusta

## Struttura del Progetto

```
src/
├── main/
│   ├── java/com/digitallibrary/
│   │   ├── model/           # Classi modello (Book, Genre, etc.)
│   │   ├── service/         # Logica di business
│   │   ├── repository/      # Gestione persistenza dati
│   │   ├── util/            # Utilities e helper
│   │   └── DigitalLibraryApp.java  # Classe principale
│   └── resources/          # File di configurazione e dati
└── test/                   # Test unitari
```

## Come Eseguire

1. Compilare il progetto:
   ```bash
   javac -d out -sourcepath src\main\java -cp ".\libs\sqlite-jdbc-3.41.2.1.jar;libs\gson-2.10.1.jar" $(Get-ChildItem -Recurse -Filter '*.java' src\main\java | ForEach-Object { $_.FullName })
   ```

2. Eseguire l'applicazione:
   ```bash
   java -cp ".\out;libs\sqlite-jdbc-3.41.2.1.jar;libs\gson-2.10.1.jar" com.digitallibrary.DigitalLibraryApp --web
   ```

## Testare online

Se non hai Java installato localmente puoi usare un compilatore Java online come:

- Repl.it (replit.com)
- OnlineGDB (onlinegdb.com)
- JDoodle (jdoodle.com)

Passi rapidi per testare il progetto su un compilatore online:

1. Carica i file nella piattaforma (tutti i file sotto `src/main/java` mantenendo i package)
2. Compila tutto (es. `javac` con wildcard)
3. Esegui `com.digitallibrary.DigitalLibraryApp` e fornisci input da console

Esempio di input (usa il file `demo-input.txt`):

```
1
Il nome della rosa
Umberto Eco
1
1980
9788807894563
2
2
3
rosa
0
```

## Roadmap di Sviluppo

- [x] Setup progetto e struttura
- [x] Fase 1: Analisi requisiti
- [x] Fase 2: Design classi e UML (documentazione testuale e mapping)
- [x] Fase 3: Implementazione base (model, repository, service, main)
- [x] Fase 4: I/O console (menù, InputHelper, validazioni, EOF handling)
- [x] Fase 5: Persistenza file (CSV, JSON) + SQLite via JDBC (opzionale)
- [~] Fase 6: Gestione eccezioni (validazioni base presenti, migliorare logging)
- [~] Fase 7: Funzionalità avanzate (ricerche con Streams, filtri, ordinamento)
- [ ] Fase 8: Testing e rifinitura (unit tests, integrazione, CI)

### Stato attuale (breve)
- Implementazioni principali funzionanti: `Book`, `Genre`, `BookService`, repository In-Memory, CSV, JSON e `SqliteBookRepository` (JDBC).
- UI console pronta con input robusto e validazione ISBN basilare.
- Sample data forniti in `data/books.json` e possibilità di creare `data/sample_books.db` con `--sqlite`.

### Cosa manca (elementi concreti da completare)
1. Test automatici
   - Unit tests per `BookService`, repository mock/in-memory, e parsing JSON/CSV.
   - Integrazione rapida per `SqliteBookRepository` (test che creano DB temporaneo).
2. Gradle Wrapper
   - Aggiungere il Gradle Wrapper per run/build ripetibile (`./gradlew run --args="--sqlite"`).
3. Logging e gestione eccezioni
   - Sostituire `e.printStackTrace()`/println con `java.util.logging` o `slf4j`.
   - Catturare e gestire errori di I/O e DB in modo amichevole per l'utente.
4. Miglioramento parsing JSON
   - Integrare Gson o Jackson per parsing/serializzazione robusti (attualmente parser naive).
5. Funzionalità UI aggiuntive
   - Modifica libro (update interattivo)
   - Ordinamento e paginazione della lista
   - Export/Import (CSV/JSON)
6. CI / Quality gates
   - GitHub Actions per: compilazione, test, lint
7. Documentazione e demo
   - Aggiornare README con comandi Gradle/Java, aggiungere screenshot o output di esempio
8. Sicurezza e persistenza
   - Backup/lock per file DB, gestione concorrenza se multi-processo

### Priorità consigliata (primo ciclo: 1-2 giorni)
1. Aggiungere Gradle Wrapper (alto) — esecuzione ripetibile e gestione dipendenze
2. Test unitari base (alto) — `BookService` e repository in-memory
3. Sostituire parser JSON con Gson (medio) — riduce bug di parsing
4. Implementare modifica libro in UI (medio) — utile per demo
5. Aggiungere logging (medio)

### Stima rapida di effort (ordine di massima)
- Gradle Wrapper: 10–20 min
- Unit tests (base): 1–3 ore
- Gson integration: 30–60 min + test
- Modifica libro UI: 30–90 min
- CI (GitHub Actions): 30–60 min

### Comandi utili (per sviluppo locale)
- Compilare (senza Gradle):
```powershell
New-Item -ItemType Directory -Force -Path .\out > $null
$files = Get-ChildItem -Path .\src\main\java -Recurse -Filter *.java | ForEach-Object { $_.FullName }
javac -d .\out $files
```
- Eseguire con SQLite (dopo aver scaricato il driver in `libs`):
```powershell
java -cp ".\out;.\libs\sqlite-jdbc-3.41.2.1.jar" com.digitallibrary.DigitalLibraryApp --sqlite
```
- Eseguire con input da file (PowerShell):
```powershell
Get-Content .\demo-input.txt | java -cp ".\out;.\libs\sqlite-jdbc-3.41.2.1.jar" com.digitallibrary.DigitalLibraryApp --sqlite
```

### Prossimi passi raccomandati per me (dimmi quale preferisci)
- A) Aggiungo il Gradle Wrapper e aggiorno `README.md` con comandi `./gradlew run --args="--sqlite"`.
- B) Implemento test unitari base (JUnit 5) e config GitHub Actions.
- C) Sostituisco parser JSON con Gson e aggiorno repository JSON.

Scegli quale opzione preferisci e procedo subito con l'implementazione mirata.
