const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS enable for public access
app.use(cors());
app.use(express.json());

// Create folders if they don't exist
const folders = ['public', 'uploads', 'logs'];
folders.forEach(folder => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'text/html', 'text/css', 'application/javascript',
            'application/zip', 'application/x-zip-compressed',
            'video/mp4', 'video/webm', 'application/x-apk'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Serve static files from public folder
app.use(express.static('public'));

// Serve uploaded projects
app.use('/projects/:projectName', express.static('public'));

// ========== WEBSITE PAGES ==========

// Home Page
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Free File Hosting - Upload & Share Files</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
                color: white;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            header {
                text-align: center;
                padding: 40px 0;
            }
            .logo {
                font-size: 3rem;
                margin-bottom: 10px;
            }
            .tagline {
                font-size: 1.2rem;
                opacity: 0.9;
                margin-bottom: 30px;
            }
            .upload-box {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 40px;
                border: 2px dashed rgba(255, 255, 255, 0.3);
            }
            .upload-form {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            input, select, button {
                padding: 15px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
            }
            input[type="file"] {
                background: white;
                color: #333;
            }
            .upload-btn {
                background: #4CAF50;
                color: white;
                cursor: pointer;
                font-weight: bold;
                transition: 0.3s;
            }
            .upload-btn:hover {
                background: #45a049;
                transform: translateY(-2px);
            }
            .projects-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .project-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                transition: 0.3s;
            }
            .project-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.2);
            }
            .project-link {
                color: #ffcc00;
                text-decoration: none;
                font-weight: bold;
                display: block;
                margin: 10px 0;
                word-break: break-all;
            }
            footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
            }
            @media (max-width: 768px) {
                .upload-box {
                    padding: 20px;
                }
                .projects-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo">📁 FreeHost</div>
                <h1>Free File & Website Hosting</h1>
                <p class="tagline">Upload files, host websites, share with anyone!</p>
            </header>

            <div class="upload-box">
                <h2>📤 Upload Files</h2>
                <form id="uploadForm" class="upload-form" enctype="multipart/form-data">
                    <input type="text" name="projectName" placeholder="Project Name (e.g., my-portfolio)" required>
                    
                    <select name="projectType" required>
                        <option value="">Select Project Type</option>
                        <option value="website">Website (HTML/CSS/JS)</option>
                        <option value="images">Images</option>
                        <option value="videos">Videos</option>
                        <option value="apk">APK Files</option>
                        <option value="zip">ZIP Archives</option>
                    </select>
                    
                    <input type="file" name="files" multiple required>
                    <button type="submit" class="upload-btn">🚀 Upload Files</button>
                </form>
                <div id="uploadStatus" style="margin-top: 20px;"></div>
            </div>

            <div class="upload-box">
                <h2>📁 Your Projects</h2>
                <div id="projectsList" class="projects-grid">
                    <!-- Projects will load here -->
                </div>
            </div>

            <div class="upload-box">
                <h2>🔗 Quick Links</h2>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <a href="/api/projects" style="color: white; background: #2196F3; padding: 10px 20px; border-radius: 8px; text-decoration: none;">📊 All Projects (JSON)</a>
                    <a href="/api/stats" style="color: white; background: #9C27B0; padding: 10px 20px; border-radius: 8px; text-decoration: none;">📈 Server Stats</a>
                    <a href="/help" style="color: white; background: #FF9800; padding: 10px 20px; border-radius: 8px; text-decoration: none;">❓ Help & Docs</a>
                </div>
            </div>

            <footer>
                <p>© 2024 FreeHost - Free File Hosting Service</p>
                <p>Uploaded files are public. Don't upload sensitive data.</p>
                <p style="margin-top: 10px; font-size: 0.9em;">
                    <strong>Server URL:</strong> <span id="serverUrl">Loading...</span>
                </p>
            </footer>
        </div>

        <script>
            // Get server URL
            document.getElementById('serverUrl').textContent = window.location.origin;
            
            // Handle form submission
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const form = e.target;
                const formData = new FormData(form);
                const statusDiv = document.getElementById('uploadStatus');
                
                statusDiv.innerHTML = '<div style="background: #4CAF50; padding: 10px; border-radius: 5px;">⏳ Uploading files...</div>';
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        statusDiv.innerHTML = \`
                            <div style="background: #4CAF50; padding: 15px; border-radius: 5px; color: white;">
                                ✅ Upload Successful!
                                <div style="margin-top: 10px;">
                                    <strong>Project URL:</strong> 
                                    <a href="\${result.url}" target="_blank" style="color: #ffcc00;">\${result.url}</a>
                                </div>
                                <button onclick="copyToClipboard('\${result.url}')" 
                                        style="margin-top: 10px; background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                                    📋 Copy URL
                                </button>
                            </div>
                        \`;
                        loadProjects();
                    } else {
                        statusDiv.innerHTML = \`<div style="background: #f44336; padding: 10px; border-radius: 5px; color: white;">❌ Error: \${result.message}</div>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = \`<div style="background: #f44336; padding: 10px; border-radius: 5px; color: white;">❌ Upload failed: \${error.message}</div>\`;
                }
                
                form.reset();
            });

            // Load projects list
            async function loadProjects() {
                try {
                    const response = await fetch('/api/projects');
                    const projects = await response.json();
                    
                    const projectsList = document.getElementById('projectsList');
                    projectsList.innerHTML = '';
                    
                    if (projects.length === 0) {
                        projectsList.innerHTML = '<p>No projects yet. Upload some files!</p>';
                        return;
                    }
                    
                    projects.forEach(project => {
                        const card = document.createElement('div');
                        card.className = 'project-card';
                        card.innerHTML = \`
                            <h3>📁 \${project.name}</h3>
                            <p><strong>Type:</strong> \${project.type}</p>
                            <p><strong>Files:</strong> \${project.fileCount}</p>
                            <a href="\${project.url}" class="project-link" target="_blank">🌐 Open Project</a>
                            <p><small>Uploaded: \${new Date(project.createdAt).toLocaleDateString()}</small></p>
                        \`;
                        projectsList.appendChild(card);
                    });
                } catch (error) {
                    console.error('Error loading projects:', error);
                }
            }

            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(() => {
                    alert('URL copied to clipboard!');
                });
            }

            // Load projects on page load
            loadProjects();
            
            // Auto-refresh every 30 seconds
            setInterval(loadProjects, 30000);
        </script>
    </body>
    </html>
    `);
});

// ========== API ENDPOINTS ==========

// Upload endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
    try {
        const { projectName, projectType } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Sanitize project name
        const sanitizedName = projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const projectPath = path.join('public', sanitizedName);
        
        // Create project folder
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }
        
        // Move uploaded files to project folder
        const uploadedFiles = [];
        req.files.forEach(file => {
            const originalName = file.originalname;
            const newPath = path.join(projectPath, originalName);
            fs.renameSync(file.path, newPath);
            uploadedFiles.push(originalName);
        });

        // Create project info file
        const projectInfo = {
            name: sanitizedName,
            type: projectType,
            files: uploadedFiles,
            fileCount: uploadedFiles.length,
            createdAt: new Date().toISOString(),
            url: `${req.protocol}://${req.headers.host}/projects/${sanitizedName}`
        };
        
        const infoPath = path.join(projectPath, '.project-info.json');
        fs.writeFileSync(infoPath, JSON.stringify(projectInfo, null, 2));

        // If there's an index.html, make it accessible at root
        if (uploadedFiles.some(f => f.toLowerCase() === 'index.html')) {
            projectInfo.mainUrl = `${req.protocol}://${req.headers.host}/projects/${sanitizedName}/index.html`;
        }

        res.json({
            success: true,
            message: 'Files uploaded successfully',
            project: projectInfo,
            url: `${req.protocol}://${req.headers.host}/projects/${sanitizedName}`
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

// Get all projects
app.get('/api/projects', (req, res) => {
    try {
        const projects = [];
        const publicDir = 'public';
        
        if (fs.existsSync(publicDir)) {
            const items = fs.readdirSync(publicDir);
            
            items.forEach(item => {
                const itemPath = path.join(publicDir, item);
                const infoPath = path.join(itemPath, '.project-info.json');
                
                if (fs.existsSync(infoPath)) {
                    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                    projects.push(info);
                }
            });
        }
        
        res.json(projects);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get server stats
app.get('/api/stats', (req, res) => {
    try {
        let totalSize = 0;
        let fileCount = 0;
        let projectCount = 0;
        
        function calculateSize(dir) {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    if (item !== '.' && item !== '..') {
                        projectCount++;
                        calculateSize(itemPath);
                    }
                } else {
                    totalSize += stat.size;
                    fileCount++;
                }
            });
        }
        
        if (fs.existsSync('public')) {
            calculateSize('public');
        }
        
        res.json({
            server: 'FreeHost File Server',
            uptime: process.uptime(),
            projects: projectCount,
            totalFiles: fileCount,
            totalSize: (totalSize / (1024*1024)).toFixed(2) + ' MB',
            publicUrl: `${req.protocol}://${req.headers.host}`
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// Help page
app.get('/help', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Help - FreeHost</title>
        <style>
            body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
            .section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 10px; }
            code { background: #333; color: white; padding: 2px 5px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>📚 FreeHost Help Guide</h1>
        
        <div class="section">
            <h2>How to Upload</h2>
            <ol>
                <li>Go to homepage</li>
                <li>Enter project name (e.g., "my-website")</li>
                <li>Select project type</li>
                <li>Choose files (multiple allowed)</li>
                <li>Click Upload</li>
            </ol>
        </div>
        
        <div class="section">
            <h2>🔗 How to Share</h2>
            <p>After upload, you'll get a URL like:</p>
            <code>https://your-server.com/projects/my-website</code>
            <p>Share this URL with anyone!</p>
        </div>
        
        <div class="section">
            <h2>🌐 Hosting Websites</h2>
            <p>Upload these files:</p>
            <ul>
                <li><code>index.html</code> - Main page</li>
                <li><code>style.css</code> - Styles</li>
                <li><code>script.js</code> - JavaScript</li>
            </ul>
            <p>Use relative paths: <code>href="style.css"</code> not <code>href="/style.css"</code></p>
        </div>
        
        <div class="section">
            <h2>📱 For Mobile Users</h2>
            <p>Works on all devices! Just share the link.</p>
            <p>APK files will download automatically when clicked.</p>
        </div>
        
        <a href="/">← Back to Home</a>
    </body>
    </html>
    `);
});

// Serve project files
app.get('/projects/:projectName/*', (req, res) => {
    const projectName = req.params.projectName;
    const fileName = req.params[0];
    const filePath = path.join('public', projectName, fileName);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).send('File not found');
    }
});

// List files in a project
app.get('/api/projects/:projectName/files', (req, res) => {
    const projectPath = path.join('public', req.params.projectName);
    
    if (fs.existsSync(projectPath)) {
        const files = fs.readdirSync(projectPath);
        const fileList = files.filter(f => !f.startsWith('.')).map(file => ({
            name: file,
            url: `${req.protocol}://${req.headers.host}/projects/${req.params.projectName}/${file}`,
            size: fs.statSync(path.join(projectPath, file)).size
        }));
        res.json(fileList);
    } else {
        res.status(404).json({ error: 'Project not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║                🚀 SERVER STARTED SUCCESSFULLY!          ║
    ╠══════════════════════════════════════════════════════════╣
    ║                                                          ║
    ║   🌐 Local URL:    http://localhost:${PORT}               ║
    ║   🔗 Public URL:   Check below after deployment         ║
    ║                                                          ║
    ║   📁 Upload files at: http://localhost:${PORT}            ║
    ║   📊 View stats at:  http://localhost:${PORT}/api/stats  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    `);
    
    // Auto-open browser on local machine
    if (process.platform === 'win32') {
        require('child_process').exec(`start http://localhost:${PORT}`);
    } else if (process.platform === 'darwin') {
        require('child_process').exec(`open http://localhost:${PORT}`);
    } else {
        require('child_process').exec(`xdg-open http://localhost:${PORT}`);
    }
});
