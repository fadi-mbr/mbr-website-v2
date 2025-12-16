/**
 * Email Testing Script
 * 
 * Tests SMTP configuration and email sending functionality
 * 
 * Usage: npx tsx scripts/test-email.ts <test-email@example.com>
 */

import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/server';

// Load environment variables
config({ path: '.env.local' });

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

async function getSMTPConfig(): Promise<SMTPConfig> {
  // Try to get from database first, fallback to environment variables
  let host = '';
  let port = 587;
  let username = '';
  let from = '';
  
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_from']);
    
    if (!error && data) {
      const settingsMap = new Map(data.map(s => [s.key, s.value]));
      
      // Helper to extract string value from JSONB
      const getStringValue = (value: unknown): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') {
          // Remove quotes if present
          return value.replace(/^"|"$/g, '');
        }
        return String(value);
      };
      
      const getNumberValue = (value: unknown, defaultValue: number): number => {
        if (value === null || value === undefined) return defaultValue;
        if (typeof value === 'number') return value;
        const str = getStringValue(value);
        const num = parseInt(str, 10);
        return isNaN(num) ? defaultValue : num;
      };
      
      host = getStringValue(settingsMap.get('smtp_host'));
      port = getNumberValue(settingsMap.get('smtp_port'), 587);
      username = getStringValue(settingsMap.get('smtp_username'));
      from = getStringValue(settingsMap.get('smtp_from'));
    }
  } catch (dbError) {
    console.warn('Could not fetch from database, using environment variables...');
  }
  
  // Fallback to environment variables if database values are empty
  // Also check common env var names
  host = host || process.env.SMTP_HOST || '';
  port = port || parseInt(process.env.SMTP_PORT || '587', 10);
  username = username || process.env.SMTP_USERNAME || process.env.SMTP_USER || '';
  from = from || process.env.SMTP_FROM || username;
  
  // If still empty, try to infer from username (for improvmx)
  if (!host && username.includes('@mail.mbrme.com')) {
    host = 'smtp.improvmx.com';
    console.log('ℹ️  Inferred SMTP host from username: smtp.improvmx.com');
  }
  
  const password = process.env.SMTP_PASSWORD || '';
  
  return {
    host,
    port,
    secure: port === 465,
    username,
    password,
    from,
  };
}

async function testSMTPConnection(config: SMTPConfig): Promise<boolean> {
  console.log('\n📧 Testing SMTP Connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${config.host || '(not set)'}`);
  console.log(`  Port: ${config.port || '(not set)'}`);
  console.log(`  Secure: ${config.secure}`);
  console.log(`  Username: ${config.username || '(not set)'}`);
  console.log(`  From: ${config.from || '(not set)'}`);
  console.log(`  Password: ${config.password ? '***' + config.password.slice(-4) : '(not set)'}`);
  console.log('');
  
  // Validate configuration
  const missing: string[] = [];
  if (!config.host) missing.push('SMTP Host');
  if (!config.username) missing.push('SMTP Username');
  if (!config.from) missing.push('SMTP From Address');
  if (!config.password) missing.push('SMTP Password (environment variable)');
  
  if (missing.length > 0) {
    console.error('❌ Missing SMTP configuration:');
    missing.forEach(item => console.error(`   - ${item}`));
    console.error('\nPlease configure these in Admin Dashboard → Settings → SMTP');
    return false;
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  
  // Test connection
  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes('Invalid login')) {
        console.error('   → Check your SMTP username and password');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('   → Check your SMTP host and port');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('   → Check your SMTP host and network connection');
      }
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    return false;
  }
}

async function testEmailSending(config: SMTPConfig, testEmail: string): Promise<boolean> {
  console.log(`📨 Testing email sending to: ${testEmail}\n`);
  
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  
  const testEmailContent = {
    from: config.from,
    to: testEmail,
    subject: 'Test Email - MBR Booking System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #E30613;">Email Test Successful! ✅</h2>
        <p>This is a test email from the MBR Booking System.</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toLocaleString()}<br>
          From: ${config.from}<br>
          SMTP Host: ${config.host}
        </p>
      </body>
      </html>
    `,
    text: `
Email Test Successful!

This is a test email from the MBR Booking System.

If you received this email, your SMTP configuration is working correctly.

Sent at: ${new Date().toLocaleString()}
From: ${config.from}
SMTP Host: ${config.host}
    `,
  };
  
  try {
    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(testEmailContent);
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);
    console.log(`\n📬 Check your inbox at: ${testEmail}\n`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:');
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes('Invalid login')) {
        console.error('   → Check your SMTP username and password');
      } else if (error.message.includes('relay')) {
        console.error('   → Your SMTP server may not allow sending from this address');
      }
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    return false;
  }
}

async function main() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('❌ Please provide a test email address');
    console.error('Usage: npx tsx scripts/test-email.ts <test-email@example.com>');
    process.exit(1);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    console.error('❌ Invalid email address format');
    process.exit(1);
  }
  
  console.log('🧪 MBR Booking System - Email Test\n');
  console.log('=' .repeat(50));
  
  try {
    // Get SMTP configuration
    const config = await getSMTPConfig();
    
    // Test connection
    const connectionOk = await testSMTPConnection(config);
    if (!connectionOk) {
      process.exit(1);
    }
    
    // Test email sending
    const emailOk = await testEmailSending(config, testEmail);
    if (!emailOk) {
      process.exit(1);
    }
    
    console.log('=' .repeat(50));
    console.log('✅ All tests passed! Email system is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

main();

