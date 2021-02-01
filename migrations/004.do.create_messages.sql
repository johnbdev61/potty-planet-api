CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  date_created TIMESTAMP DEFAULT now() NOT NULL,
  sender_id,
  recipient_id,
  direct_message TEXT NOT NULL,
)