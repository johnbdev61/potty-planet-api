CREATE TABLE posts (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title TEXT NOT NULL,
  content TEXT,
  is_resolved BOOLEAN,
  date_created TIMESTAMPTZ DEFAULT now() NOT NULL
);