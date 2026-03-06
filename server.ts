import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

const PROJECTS_FILE = path.join(process.cwd(), "projects.json");
const CONFIG_FILE = path.join(process.cwd(), "config.json");

// Prevent server from crashing on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // API: Get config
  app.get("/api/config", (req, res) => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return res.json({});
      }
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read config" });
    }
  });

  // API: Save config
  app.post("/api/config", (req, res) => {
    try {
      const config = req.body;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save config" });
    }
  });

  // API: Get projects from local file
  app.get("/api/projects", (req, res) => {
    try {
      if (!fs.existsSync(PROJECTS_FILE)) {
        return res.json([]);
      }
      const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read projects" });
    }
  });

  // API: Save projects to local file
  app.post("/api/projects", (req, res) => {
    try {
      const projects = req.body;
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save projects" });
    }
  });

  // API: Add a single project to local file (more robust for parallel updates)
  app.post("/api/projects/add", (req, res) => {
    try {
      const newProject = req.body;
      // Use a lock-file or retry mechanism for simple atomic-like behavior
      // For this scale, reading/writing to a temp file and renaming is safer
      const tempFile = `${PROJECTS_FILE}.tmp.${Date.now()}.${Math.random()}`;
      
      let projects = [];
      if (fs.existsSync(PROJECTS_FILE)) {
        const data = fs.readFileSync(PROJECTS_FILE, "utf-8");
        projects = JSON.parse(data);
      }
      projects.unshift(newProject); // Add to the beginning
      
      fs.writeFileSync(tempFile, JSON.stringify(projects, null, 2));
      fs.renameSync(tempFile, PROJECTS_FILE);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add project" });
    }
  });

  // API: Save generated assets to a local directory on the server
  app.post("/api/save-assets", async (req, res) => {
    try {
      const { outputPath, folderName, files } = req.body;
      console.log(`[SaveAssets] Request received for folder: ${folderName}, files count: ${files?.length}`);
      
      if (!outputPath) {
        return res.status(400).json({ error: "Output path is required" });
      }

      // Security: Prevent path traversal in outputPath if it's relative
      // We allow absolute paths (user configuration), but we should ensure relative paths don't escape cwd unexpectedly if not intended.
      // However, for a local tool, the user might want to save to "../output".
      // The critical fix is to ensure we don't blindly join untrusted input.
      // Here outputPath comes from settings (trusted?), folderName comes from book title (untrusted?).
      // folderName is already sanitized below.
      
      const sanitizedFolderName = folderName.replace(/[<>:"/\\|?*]/g, '_');
      
      // Resolve the full path
      let fullPath = path.isAbsolute(outputPath) 
        ? path.join(outputPath, sanitizedFolderName)
        : path.join(process.cwd(), outputPath, sanitizedFolderName);
        
      // Normalize to resolve '..'
      fullPath = path.normalize(fullPath);

      console.log(`[SaveAssets] Target path: ${fullPath}`);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`[SaveAssets] Created directory: ${fullPath}`);
      }

      if (!files || !Array.isArray(files)) {
        console.warn(`[SaveAssets] No files provided or files is not an array`);
        return res.json({ success: true, message: "No files to save" });
      }

      for (const file of files) {
        // Prevent path traversal in file names
        const sanitizedFileName = path.basename(file.name);
        const filePath = path.join(fullPath, sanitizedFileName);
        console.log(`[SaveAssets] Writing file: ${sanitizedFileName} (${file.type})`);
        
        let fileHandle;
        try {
          // Explicitly open and close file handle as requested
          fileHandle = await fs.promises.open(filePath, 'w');
          if (file.type === 'image') {
            const buffer = Buffer.from(file.content, 'base64');
            await fileHandle.write(buffer);
          } else {
            await fileHandle.write(file.content);
          }
        } catch (err) {
          console.error(`[SaveAssets] Error writing file ${sanitizedFileName}:`, err);
          throw err;
        } finally {
          if (fileHandle) {
            await fileHandle.close();
          }
        }
      }

      console.log(`[SaveAssets] Successfully saved ${files.length} files to ${fullPath}`);
      res.json({ success: true, path: fullPath });
    } catch (error: any) {
      console.error("[SaveAssets] Server Save Error:", error);
      res.status(500).json({ error: error.message || "Failed to save assets" });
    }
  });

  // API: Verify if a path exists and is writable
  app.post("/api/verify-path", (req, res) => {
    try {
      const { outputPath } = req.body;
      if (!outputPath) return res.json({ exists: false });
      
      let fullPath = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);
      fullPath = path.normalize(fullPath);
      
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      
      // Test write
      const testFile = path.join(fullPath, ".test_write");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      
      res.json({ exists: true, fullPath });
    } catch (error) {
      res.json({ exists: false, error: "Path is not writable or invalid" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
