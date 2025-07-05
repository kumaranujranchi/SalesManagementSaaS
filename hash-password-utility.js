#!/usr/bin/env node

/**
 * Password Hashing Utility
 * Use this to generate hashed passwords for super admin accounts
 */

import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash-password-utility.js <password>');
  console.log('Example: node hash-password-utility.js mypassword123');
  process.exit(1);
}

try {
  const hashedPassword = await hashPassword(password);
  console.log('Original password:', password);
  console.log('Hashed password:', hashedPassword);
  console.log('');
  console.log('Use this hashed password in your SQL INSERT statement:');
  console.log(`INSERT INTO super_admins (username, password, full_name, email, role, status)`);
  console.log(`VALUES ('superadmin', '${hashedPassword}', 'Super Administrator', 'admin@yourdomain.com', 'super_admin', true);`);
} catch (error) {
  console.error('Error hashing password:', error);
}
