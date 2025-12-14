const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
const authFile = path.join(__dirname, 'auth-unified.js');

// Read both files
let serverContent = fs.readFileSync(serverFile, 'utf8');
const authContent = fs.readFileSync(authFile, 'utf8');

// Find and replace the registration endpoint
const registerStart = serverContent.indexOf("app.post('/auth/register'");
const registerEnd = serverContent.indexOf("});\n\n// Login endpoint", registerStart) + 4;

if (registerStart !== -1 && registerEnd !== -1) {
    const beforeRegister = serverContent.substring(0, registerStart);
    const afterRegister = serverContent.substring(registerEnd);

    // Extract just the register endpoint from auth-unified.js
    const authRegisterStart = authContent.indexOf("app.post('/auth/register'");
    const authRegisterEnd = authContent.indexOf("\n\napp.post('/auth/login'", authRegisterStart);
    const newRegister = authContent.substring(authRegisterStart, authRegisterEnd);

    serverContent = beforeRegister + newRegister + "\n" + afterRegister;
}

// Find and replace the login endpoint
const loginStart = serverContent.indexOf("// Login endpoint\napp.post('/auth/login'");
const loginEnd = serverContent.indexOf("});\n\n// Logout endpoint", loginStart) + 4;

if (loginStart !== -1 && loginEnd !== -1) {
    const beforeLogin = serverContent.substring(0, loginStart);
    const afterLogin = serverContent.substring(loginEnd);

    // Extract just the login endpoint from auth-unified.js
    const authLoginStart = authContent.indexOf("app.post('/auth/login'");
    const authLoginEnd = authContent.indexOf("\n\napp.post('/auth/logout'", authLoginStart);
    const newLogin = authContent.substring(authLoginStart, authLoginEnd);

    serverContent = beforeLogin + "// Login endpoint\n" + newLogin + "\n" + afterLogin;
}

// Find and replace the logout endpoint
const logoutStart = serverContent.indexOf("// Logout endpoint\napp.post('/auth/logout'");
const logoutEnd = serverContent.indexOf("});\n\n// Session check endpoint", logoutStart) + 4;

if (logoutStart !== -1 && logoutEnd !== -1) {
    const beforeLogout = serverContent.substring(0, logoutStart);
    const afterLogout = serverContent.substring(logoutEnd);

    // Extract just the logout endpoint from auth-unified.js
    const authLogoutStart = authContent.indexOf("app.post('/auth/logout'");
    const authLogoutEnd = authContent.indexOf("\n\napp.get('/auth/session'", authLogoutStart);
    const newLogout = authContent.substring(authLogoutStart, authLogoutEnd);

    serverContent = beforeLogout + "// Logout endpoint\n" + newLogout + "\n" + afterLogout;
}

// Find and replace the session endpoint
const sessionStart = serverContent.indexOf("// Session check endpoint\napp.get('/auth/session'");
const sessionEnd = serverContent.indexOf("});\n\n// Email verification", sessionStart) + 4;

if (sessionStart !== -1 && sessionEnd !== -1) {
    const beforeSession = serverContent.substring(0, sessionStart);
    const afterSession = serverContent.substring(sessionEnd);

    // Extract just the session endpoint from auth-unified.js
    const authSessionStart = authContent.indexOf("app.get('/auth/session'");
    const authSessionEnd = authContent.length;
    const newSession = authContent.substring(authSessionStart, authSessionEnd).trim();

    serverContent = beforeSession + "// Session check endpoint\n" + newSession + "\n\n" + afterSession;
}

// Write the updated server file
fs.writeFileSync(serverFile, serverContent, 'utf8');

console.log('✅ Successfully merged authentication endpoints!');
console.log('📁 Backup created: server.js.backup');
