#!/usr/bin/env node

/**
 * Generate Demo Account Passwords
 * This script generates the correct password hashes for demo accounts
 */

import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function generateDemoPasswords() {
  console.log('🔐 Generating Demo Account Password Hashes...\n');

  const passwords = [
    { account: 'Super Admin', password: 'SuperAdmin123!' },
    { account: 'Organization Admin', password: 'OrgAdmin123!' },
    { account: 'Sales Manager', password: 'Manager123!' },
    { account: 'Sales Executive', password: 'Sales123!' }
  ];

  for (const { account, password } of passwords) {
    const hash = await hashPassword(password);
    console.log(`${account}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash: ${hash}\n`);
  }

  console.log('📋 Copy these hashes to your setup-demo-accounts.sql file');
  console.log('🚀 Then run the SQL script in your Neon database');
}

generateDemoPasswords().catch(console.error);
