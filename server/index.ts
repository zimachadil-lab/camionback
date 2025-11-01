import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { sessionConfig } from "./session-config";
import { ensureSchemaSync } from "./migrations/ensure-schema";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CRITIQUE: Trust proxy pour que Express accepte les cookies sécurisés derrière un reverse proxy (CDN, nginx, etc.)
// Sans cela, req.secure reste false en production HTTPS et les cookies de session ne sont jamais envoyés
app.set('trust proxy', 1);

// Configuration des sessions sécurisées (AVANT les routes)
app.use(session(sessionConfig));

// Middleware custom sécurisé pour servir les fichiers statiques EN PREMIER
import path from "path";
import fs from "fs/promises";

const publicPath = path.resolve(import.meta.dirname, "..", "public");

app.use((req, res, next) => {
  // Liste des fichiers statiques autorisés (whitelist)
  const allowedStaticFiles = [
    '/favicon.ico',
    '/favicon.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/apple-touch-icon.png',
    '/manifest.json',
    '/service-worker.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
  ];
  
  // Vérifier si la requête correspond à un fichier autorisé
  if (allowedStaticFiles.includes(req.path)) {
    // Construire le chemin du fichier sécurisé
    // IMPORTANT: utiliser '.' + req.path car path.join ignore publicPath si req.path commence par '/'
    const safeFilePath = path.resolve(publicPath, '.' + req.path);
    
    // Lire le fichier manuellement pour contrôle total des headers
    fs.readFile(safeFilePath)
      .then(fileContent => {
        // Définir les MIME types
        const ext = path.extname(req.path);
        const mimeTypes: Record<string, string> = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.json': 'application/json',
          '.js': 'text/javascript'
        };
        
        // Définir Content-Type
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        
        // Service Worker DOIT avoir no-cache pour permettre les mises à jour PWA
        if (req.path === '/service-worker.js') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          // Autres fichiers statiques : cache long terme
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
        
        // Envoyer le fichier
        res.send(fileContent);
      })
      .catch(() => {
        // Fichier non trouvé, passer au middleware suivant
        next();
      });
    
    return;
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Synchroniser le schéma avant de démarrer l'application
  await ensureSchemaSync();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    log(`📁 Serving static files from: ${publicPath}`);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
