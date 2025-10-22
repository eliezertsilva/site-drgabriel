const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3000;
const JWT_SECRET = "your-super-secret-key"; // Change this in a real application

// Paths
const postsIndexPath = path.join(__dirname, "posts-index.json");
const postsDir = path.join(__dirname, "posts");
const uploadsDir = path.join(__dirname, "uploads");
const usersPath = path.join(__dirname, "users.json");

// Middleware
// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null)
    return res.status(401).json({ message: "Token not provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err)
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

const apiRouter = express.Router();
app.use("/api", apiRouter);

// All API routes will use bodyParser
apiRouter.use(bodyParser.json());

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeFilename = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "");
    cb(null, Date.now() + "-" + safeFilename);
  },
});
const upload = multer({ storage: storage });

// --- Helper Functions ---

function createSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFD") // Separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/[^a-z0-9 -]/g, "") // Remove caracteres inválidos
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-+|-+$/g, ""); // Remove hífens do início e do fim
}

async function getPostsIndex() {
  try {
    await fs.access(postsIndexPath);
    const indexData = await fs.readFile(postsIndexPath, "utf8");
    return JSON.parse(indexData);
  } catch (error) {
    // If the file doesn't exist, create it with a default structure
    if (error.code === "ENOENT") {
      const defaultIndex = { post_files: [] };
      await fs.writeFile(postsIndexPath, JSON.stringify(defaultIndex, null, 2));
      return defaultIndex;
    }
    throw error; // Re-throw other errors
  }
}

async function writePostsIndex(index) {
  await fs.writeFile(postsIndexPath, JSON.stringify(index, null, 2), "utf8");
}

// --- Auth & User API Endpoints ---

apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const usersData = await fs.readFile(usersPath, "utf8");
    const users = JSON.parse(usersData);
    const user = users.find((u) => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Usuário ou senha inválidos." });
    }

    const accessToken = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

apiRouter.get("/users", authenticateToken, async (req, res) => {
  try {
    const usersData = await fs.readFile(usersPath, "utf8");
    const users = JSON.parse(usersData);
    // Return only usernames for security
    const usernames = users.map((u) => ({ username: u.username }));
    res.json(usernames);
  } catch (error) {
    res.status(500).json({ message: "Failed to get users." });
  }
});

apiRouter.post("/users", authenticateToken, async (req, res) => {
  // In a real app, you'd check if the logged-in user is an admin
  // For now, any authenticated user can add another one.
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const usersData = await fs.readFile(usersPath, "utf8");
    const users = JSON.parse(usersData);

    if (users.find((u) => u.username === username)) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    users.push({ username, password: hashedPassword });
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

    res.status(201).json({ username });
  } catch (error) {
    res.status(500).json({ message: "Error creating user." });
  }
});

apiRouter.delete("/users/:username", authenticateToken, async (req, res) => {
  try {
    const usernameToDelete = req.params.username;
    if (usernameToDelete === "Gabriel") {
      // Agora protege o usuário "Gabriel" (com G maiúsculo)
      return res
        .status(400)
        .json({ message: "Não é possível excluir o usuário principal." });
    }

    const usersData = await fs.readFile(usersPath, "utf8");
    let users = JSON.parse(usersData);

    const initialLength = users.length;
    users = users.filter((u) => u.username !== usernameToDelete);

    if (users.length === initialLength) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    res.status(200).json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user." });
  }
});

// --- Post API Endpoints ---
// ... (The rest of the server.js file remains the same)

// File Upload Endpoint (Protected)
apiRouter.post(
  "/upload",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
  }
);

// Get all uploaded files (Protected)
apiRouter.get("/uploads", authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);

    const fileDetails = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        return { name: file, mtime: stats.mtime };
      })
    );

    // Sort by modification time (newest first)
    fileDetails.sort((a, b) => b.mtime - a.mtime);

    const fileUrls = fileDetails.map((detail) => `/uploads/${detail.name}`);
    res.json(fileUrls);
  } catch (error) {
    console.error("Error fetching uploads:", error);
    res.status(500).json({
      message: "Error fetching uploaded files.",
      error: error.message,
    });
  }
});
// Get all posts (Public)
apiRouter.get("/posts", async (req, res) => {
  try {
    const index = await getPostsIndex();
    const posts = [];
    if (index && Array.isArray(index.post_files)) {
      for (const fileName of index.post_files) {
        const filePath = path.join(postsDir, fileName);
        try {
          const postData = await fs.readFile(filePath, "utf8");
          posts.push(JSON.parse(postData));
        } catch (error) {
          console.error(`Could not read post file: ${fileName}`);
        }
      }
    }
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

// Create a new post (Protected)
apiRouter.post("/posts", authenticateToken, async (req, res) => {
  try {
    const { title, summary, content, author, date, imageUrl, tags } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }
    const slug = createSlug(title);
    const postDate = date ? new Date(date) : new Date();
    const formattedDate = postDate.toISOString().split("T")[0];
    const fileName = `${formattedDate}-${slug}.json`;
    const filePath = path.join(postsDir, fileName);
    const newPost = {
      slug,
      title,
      summary: summary || "",
      content,
      author: author || "Dr. Gabriel Marcondes",
      tags: tags || [],
      date: formattedDate,
      imageUrl: imageUrl || "",
    };

    await fs.writeFile(filePath, JSON.stringify(newPost, null, 2), "utf8");
    const index = await getPostsIndex();
    index.post_files.push(fileName);
    await writePostsIndex(index);
    res.status(201).json(newPost);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating post", error: error.message });
  }
});

// Get a single post by slug (Public)
apiRouter.get("/posts/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const index = await getPostsIndex();
    // Use a more precise method to find the file.
    // This prevents 'test' from matching 'my-test-post'.
    // It looks for a file that ends with '-{slug}.json'.
    const fileName = index.post_files.find((f) => f.endsWith(`-${slug}.json`));

    if (!fileName) {
      return res.status(404).json({ message: "Post not found." });
    }

    const filePath = path.join(postsDir, fileName);
    const postData = await fs.readFile(filePath, "utf8");
    res.json(JSON.parse(postData));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching post", error: error.message });
  }
});

// Update a post (Protected)
apiRouter.put("/posts/:slug", authenticateToken, async (req, res) => {
  try {
    const originalSlug = req.params.slug;
    const { title, summary, content, author, date, imageUrl, tags } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    const index = await getPostsIndex();
    const oldFileName = index.post_files.find((f) =>
      f.endsWith(`-${originalSlug}.json`)
    );

    if (!oldFileName) {
      return res.status(404).json({ message: "Post not found." });
    }

    const oldFilePath = path.join(postsDir, oldFileName);
    const existingPostData = JSON.parse(await fs.readFile(oldFilePath, "utf8"));

    const newSlug = createSlug(title);
    const postDate = date ? new Date(date) : new Date(existingPostData.date); // Use provided date or existing
    const formattedDate = postDate.toISOString().split("T")[0];

    const updatedPost = {
      slug: newSlug, // Use the new slug based on the updated title
      title,
      summary: summary || "",
      content,
      author: author || existingPostData.author || "Dr. Gabriel Marcondes",
      tags: tags || [],
      date: formattedDate,
      imageUrl: imageUrl || "",
    };

    const newFileName = `${formattedDate}-${newSlug}.json`;
    const newFilePath = path.join(postsDir, newFileName);

    // Check if the filename needs to change (due to date or slug change)
    if (oldFileName !== newFileName) {
      // Remove old file from index
      index.post_files = index.post_files.filter((f) => f !== oldFileName);
      // Delete old file
      await fs.unlink(oldFilePath);
      // Add new file to index
      index.post_files.push(newFileName);
      await writePostsIndex(index);
    } else {
      // If filename is the same, just update the content
      // No need to update index if filename hasn't changed.
    }

    await fs.writeFile(
      newFilePath,
      JSON.stringify(updatedPost, null, 2),
      "utf8"
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res
      .status(500)
      .json({ message: "Error updating post", error: error.message });
  }
});

// Delete a post (Protected)
apiRouter.delete("/posts/:slug", authenticateToken, async (req, res) => {
  try {
    const slugToDelete = req.params.slug;
    const index = await getPostsIndex();

    const fileNameToDelete = index.post_files.find((f) =>
      f.endsWith(`-${slugToDelete}.json`)
    );

    if (!fileNameToDelete) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Remove o arquivo do índice
    index.post_files = index.post_files.filter((f) => f !== fileNameToDelete);
    await writePostsIndex(index);

    // Deleta o arquivo do post
    const filePath = path.join(postsDir, fileNameToDelete);
    await fs.unlink(filePath);

    res.status(200).json({ message: "Post excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    res
      .status(500)
      .json({ message: "Erro ao excluir post", error: error.message });
  }
});

// --- Static File Serving ---
// Serve the 'uploads' directory at the '/uploads' path.
// This needs to be at the top level of `app` so that image URLs work correctly.
app.use("/uploads", express.static(uploadsDir));

// --- Static File Serving (for HTML, CSS, JS) ---
// This should be last, to act as a fallback for any request that doesn't match an API route.
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
