-- Create default admin user
-- Password: admin123
USE dailyflow;

INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@dailyflow.com', '$2a$10$YQ7qZ8vXJ5K5Z5Z5Z5Z5ZeK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- Note: You need to hash the password properly. Run this after starting the server:
-- Login with: admin@dailyflow.com / admin123
