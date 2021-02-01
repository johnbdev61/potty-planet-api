CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  date_created TIMESTAMP DEFAULT now() NOT NULL
);

ALTER TABLE posts
  ADD COLUMN
    author_id INTEGER REFERENCES users(id)
    ON DELETE SET NULL;
    