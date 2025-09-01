-- SQL seed to create a simple books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  publicationYear INTEGER,
  isbn TEXT,
  available INTEGER,
  addedDate TEXT
);

-- sample inserts
INSERT INTO books (id, title, author, genre, publicationYear, isbn, available, addedDate) VALUES
('b1a9c9d4-1f7a-4c2f-9d6a-111111111111', 'L\'era di Bitcoin', 'tazu', 'Business', 2024, '9781234567897', 1, '2024-08-01T10:00:00'),
('c2b8d8e5-2f8b-4d3f-9e7b-222222222222', 'Il nome della rosa', 'Umberto Eco', 'Narrativa', 1980, '9788807894563', 1, '2023-10-12T09:30:00'),
('d3c7e7f6-3f9c-4e4f-9f8c-333333333333', 'Pensa e arricchisci te stesso', 'Napoleon Hill', 'Self-help', 1937, '9780140439876', 0, '2022-05-20T12:00:00');
