INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

INSERT INTO subscription_services (name, category, active) VALUES ('Spotify', 'Music', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO subscription_services (name, category, active) VALUES ('YouTube Premium', 'Video', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO subscription_services (name, category, active) VALUES ('Netflix', 'Video', true) ON CONFLICT (name) DO NOTHING;
INSERT INTO subscription_services (name, category, active) VALUES ('Steam Family', 'Games', true) ON CONFLICT (name) DO NOTHING;
