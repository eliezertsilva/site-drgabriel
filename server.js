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
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadsDir));

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

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
// ... (post helpers are fine)

// --- Auth & User API Endpoints ---

app.post("/api/auth/login", async (req, res) => {
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

app.get("/api/users", authenticateToken, async (req, res) => {
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

app.post("/api/users", authenticateToken, async (req, res) => {
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

app.delete("/api/users/:username", authenticateToken, async (req, res) => {
  try {
    const usernameToDelete = req.params.username;
    if (usernameToDelete === "admin") {
      return res.status(400).json({ message: "Cannot delete the admin user." });
    }

    const usersData = await fs.readFile(usersPath, "utf8");
    let users = JSON.parse(usersData);

    const initialLength = users.length;
    users = users.filter((u) => u.username !== usernameToDelete);

    if (users.length === initialLength) {
      return res.status(404).json({ message: "User not found." });
    }

    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user." });
  }
});

// --- Post API Endpoints ---
// ... (The rest of the server.js file remains the same)

// File Upload Endpoint (Protected)
app.post(
  "/api/upload",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    res.json({ filePath: `/uploads/${req.file.filename}` });
  }
);

// Get all posts (Public)
app.get("/api/posts", async (req, res) => {
  try {
    const index = await getPostsIndex();
    const posts = [];
    for (const fileName of index.post_files) {
      const filePath = path.join(postsDir, fileName);
      try {
        const postData = await fs.readFile(filePath, "utf8");
        posts.push(JSON.parse(postData));
      } catch (error) {
        console.error(`Could not read post file: ${fileName}`);
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
app.post("/api/posts", authenticateToken, async (req, res) => {
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
app.get("/api/posts/:slug", async (req, res) => {
  // ... (implementation remains the same)
});

// Update a post (Protected)
app.put("/api/posts/:slug", authenticateToken, async (req, res) => {
  // ... (implementation remains the same)
});

// Delete a post (Protected)
app.delete("/api/posts/:slug", authenticateToken, async (req, res) => {
  // ... (implementation remains the same)
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
