import express from 'express';
import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import { neon } from '@neondatabase/serverless';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import organizationRoutes from './routes/organizations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection for sessions
// Support both DATABASE_URL and NETLIFY_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required');
}

console.log('Database URL found:', !!databaseUrl);
const sql = neon(databaseUrl);
const PgSession = ConnectPgSimple(session);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Session configuration
app.use(session({
  store: new PgSession({
    conString: databaseUrl,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
}));

// CORS configuration for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!databaseUrl,
    databaseSource: process.env.DATABASE_URL ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: err.stack,
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${databaseUrl ? 'Connected' : 'Not configured'}`);
  console.log(`🔗 Database source: ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL'}`);

  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 Frontend dev server: http://localhost:5173`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
