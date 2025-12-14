// Simple authentication server without MongoDB - for testing only
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const port = 3002;

// File-based storage paths
const USERS_FILE = path.join(__dirname, "json-data", "users.json");
const SESSIONS_FILE = path.join(__dirname, "json-data", "sessions.json");

// Create data directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, "json-data"))) {
    fs.mkdirSync(path.join(__dirname, "json-data"));
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
}

// Helper functions
function readUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readSessions() {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
}

function writeSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "Web")));
app.use("/style", express.static(path.join(__dirname, "style")));
app.use("/js", express.static(path.join(__dirname, "js")));

// Registration endpoint
app.post("/auth/register", async (req, res) => {
    try {
        const { username, email, password, membershipType } = req.body;

        const users = readUsers();

        // Check if user exists
        if (users.find((u) => u.email === email)) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Calculate subscription end date
        let subscriptionEndDate = null;
        if (membershipType === "monthly") {
            subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (membershipType === "semi-yearly") {
            subscriptionEndDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        } else if (membershipType === "yearly") {
            subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        // Create user
        const newUser = {
            id: crypto.randomBytes(16).toString("hex"),
            username,
            email,
            password: hashedPassword,
            membershipType: membershipType || "free",
            subscriptionStatus: "active",
            subscriptionEndDate,
            isEmailVerified: true, // Auto-verify for testing
            createdAt: new Date(),
            lastLogin: null,
            dailyDownloadCount: 0,
            lastDownloadReset: new Date(),
        };

        users.push(newUser);
        writeUsers(users);

        // Create session
        const sessionToken = crypto.randomBytes(64).toString("hex");
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const sessions = readSessions();
        sessions.push({
            id: crypto.randomBytes(16).toString("hex"),
            userId: newUser.id,
            sessionToken,
            expiresAt: sessionExpires,
            createdAt: new Date(),
        });
        writeSessions(sessions);

        console.log(`✅ New user registered: ${username} (${membershipType || "free"})`);

        const userOutput = { ...newUser };
        delete userOutput.password;

        res.status(201).json({
            status: "success",
            message: "Registration successful!",
            data: {
                user: userOutput,
                sessionToken,
                expiresAt: sessionExpires,
            },
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login endpoint
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const users = readUsers();
        const user = users.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Compare passwords
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Update last login
        user.lastLogin = new Date();
        writeUsers(users);

        // Create session
        const sessionToken = crypto.randomBytes(64).toString("hex");
        const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const sessions = readSessions();
        sessions.push({
            id: crypto.randomBytes(16).toString("hex"),
            userId: user.id,
            sessionToken,
            expiresAt: sessionExpires,
            createdAt: new Date(),
        });
        writeSessions(sessions);

        console.log(`✅ User logged in: ${user.username} (${user.membershipType})`);

        const userOutput = { ...user };
        delete userOutput.password;

        res.json({
            status: "success",
            message: "Login successful",
            data: {
                user: userOutput,
                sessionToken,
                expiresAt: sessionExpires,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Logout endpoint
app.post("/auth/logout", (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
            let sessions = readSessions();
            sessions = sessions.filter((s) => s.sessionToken !== token);
            writeSessions(sessions);
            console.log("✅ User logged out");
        }
        res.json({ status: "success", message: "Logout successful" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Session check endpoint
app.get("/auth/session", (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const sessions = readSessions();
        const session = sessions.find(
            (s) => s.sessionToken === token && new Date(s.expiresAt) > new Date()
        );

        if (!session) {
            return res.status(401).json({ error: "Invalid or expired session" });
        }

        const users = readUsers();
        const user = users.find((u) => u.id === session.userId);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        const userOutput = { ...user };
        delete userOutput.password;

        res.json({
            status: "success",
            data: {
                user: userOutput,
                session: {
                    expiresAt: session.expiresAt,
                },
            },
        });
    } catch (err) {
        console.error("Session check error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Favicon route
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "Web", "Images", "logo.png"));
});

// Seed test users on startup
async function seedTestUsers() {
    const users = readUsers();

    // Only seed if no users exist
    if (users.length > 0) {
        console.log(`📊 Found ${users.length} existing users`);
        return;
    }

    console.log("🌱 Seeding test users...\n");

    const testUsers = [
        {
            username: "free_user",
            email: "free@test.com",
            password: "Test1234!",
            membershipType: "free",
        },
        {
            username: "monthly_user",
            email: "monthly@test.com",
            password: "Test1234!",
            membershipType: "monthly",
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
            username: "lifetime_user",
            email: "lifetime@test.com",
            password: "Test1234!",
            membershipType: "lifetime",
        },
    ];

    for (const userData of testUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        users.push({
            id: crypto.randomBytes(16).toString("hex"),
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            membershipType: userData.membershipType,
            subscriptionStatus: "active",
            subscriptionEndDate: userData.subscriptionEndDate || null,
            isEmailVerified: true,
            createdAt: new Date(),
            lastLogin: null,
            dailyDownloadCount: 0,
            lastDownloadReset: new Date(),
        });
        console.log(`✅ Created: ${userData.username} (${userData.membershipType})`);
    }

    writeUsers(users);
    console.log("\n🎉 Test users created!");
    console.log("📝 Login with: free@test.com / Test1234!\n");
}

// Start server
app.listen(port, async () => {
    await seedTestUsers();
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`🔗 Open: http://localhost:${port}/login.html`);
    console.log("\n💡 This is a simplified version using JSON file storage");
    console.log("   Install MongoDB for production use\n");
});
