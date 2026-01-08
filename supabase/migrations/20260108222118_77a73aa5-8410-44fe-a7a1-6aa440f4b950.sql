-- Rename whitelist_users to freelist_users
ALTER TABLE public.whitelist_users RENAME TO freelist_users;

-- Rename the index
ALTER INDEX idx_whitelist_email RENAME TO idx_freelist_email;

-- Insert the 8 users into freelist
INSERT INTO public.freelist_users (email, reason) VALUES
('goreti.bl@gmail.com', 'Migrado de usuário free'),
('thatiane.hltomaz@gmail.com', 'Migrado de usuário free'),
('brenomsferreira@gmail.com', 'Migrado de usuário free'),
('soraya-mh@hotmail.com', 'Migrado de usuário free'),
('sorayamh@gmail.com', 'Migrado de usuário free'),
('paulocesarnogueira784@gmail.com', 'Migrado de usuário free'),
('thatiane.tomaz@gmail.com', 'Migrado de usuário free'),
('sopro.neuro@gmail.com', 'Migrado de usuário free');

-- Delete free records from subscriptions
DELETE FROM public.subscriptions WHERE status = 'free';