-- Migration: create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    initials TEXT,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    reportingTo INTEGER,
    isDeleted BOOLEAN DEFAULT false,
    isBlocked BOOLEAN DEFAULT false,
    roleId INTEGER,
    permissionTemplateId INTEGER,
    isActive BOOLEAN DEFAULT true,
    isSuperAdmin BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
