/* eslint-disable */
// Unified authentication endpoints that work with both MongoDB and JSON storage
// Replace the existing /auth/register and /auth/login endpoints in server.js with this code

app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password, membershipType } = req.body;

        // Validate membership type
        const validMemberships = ['free', 'monthly', 'semi-yearly', 'yearly', 'lifetime'];
        if (membershipType && !validMemberships.includes(membershipType)) {
            return res.status(400).json({ error: 'Invalid membership type' });
        }

        if (USE_MONGODB) {
            // MongoDB implementation
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            let subscriptionEndDate = null;
            if (membershipType === 'monthly') {
                subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            } else if (membershipType === 'semi-yearly') {
                subscriptionEndDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            } else if (membershipType === 'yearly') {
                subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }

            const newUser = await User.create({
                username,
                email,
                password: hashedPassword,
                membershipType: membershipType || 'free',
                subscriptionEndDate,
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires
            });

            emailService.sendVerificationEmail(newUser, verificationToken);

            const sessionToken = crypto.randomBytes(64).toString('hex');
            const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            await Session.create({
                userId: newUser._id,
                sessionToken,
                expiresAt: sessionExpires,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            const userOutput = newUser.toObject();
            delete userOutput.password;
            delete userOutput.emailVerificationToken;

            res.status(201).json({
                status: 'success',
                message: 'Registration successful! Please check your email to verify your account.',
                data: {
                    user: userOutput,
                    sessionToken,
                    expiresAt: sessionExpires
                }
            });
        } else {
            // JSON file implementation
            if (USERS_DATA.find(u => u.email === email)) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            let subscriptionEndDate = null;
            if (membershipType === 'monthly') {
                subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            } else if (membershipType === 'semi-yearly') {
                subscriptionEndDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            } else if (membershipType === 'yearly') {
                subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }

            const newUser = {
                id: crypto.randomBytes(16).toString('hex'),
                username,
                email,
                password: hashedPassword,
                membershipType: membershipType || 'free',
                subscriptionStatus: 'active',
                subscriptionEndDate,
                isEmailVerified: true,
                createdAt: new Date(),
                lastLogin: null,
                dailyDownloadCount: 0,
                lastDownloadReset: new Date()
            };

            USERS_DATA.push(newUser);
            saveUsers();

            const sessionToken = crypto.randomBytes(64).toString('hex');
            const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            SESSIONS_DATA.push({
                id: crypto.randomBytes(16).toString('hex'),
                userId: newUser.id,
                sessionToken,
                expiresAt: sessionExpires,
                createdAt: new Date()
            });
            saveSessions();

            console.log(`✅ New user registered: ${username} (${membershipType || 'free'})`);

            const userOutput = { ...newUser };
            delete userOutput.password;

            res.status(201).json({
                status: 'success',
                message: 'Registration successful!',
                data: {
                    user: userOutput,
                    sessionToken,
                    expiresAt: sessionExpires
                }
            });
        }
    } catch (err) {
        logger.error('Registration error', { error: err.message });
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join('. ') });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (USE_MONGODB) {
            // MongoDB implementation
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            user.lastLogin = new Date();
            await user.save();

            const sessionToken = crypto.randomBytes(64).toString('hex');
            const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Single device access for Creator and Lifetime plan users
            if (user.membershipType === 'creator' || user.membershipType === 'lifetime') {
                await Session.deleteMany({ userId: user._id });
            }

            // Session limit for Studio users (Max 3 devices)
            if (user.membershipType === 'studio') {
                const existingSessions = await Session.find({
                    userId: user._id,
                    expiresAt: { $gt: new Date() }
                }).sort({ createdAt: 1 });

                // If we have 3 or more sessions, remove the oldest ones to make room
                // We keep (3 - 1) = 2 old sessions, then add 1 new = 3 total
                if (existingSessions.length >= 3) {
                    const sessionsToRemoveCount = existingSessions.length - 2;
                    if (sessionsToRemoveCount > 0) {
                        const sessionsToRemove = existingSessions.slice(0, sessionsToRemoveCount);
                        const idsToRemove = sessionsToRemove.map(s => s._id);
                        await Session.deleteMany({ _id: { $in: idsToRemove } });
                    }
                }
            }

            await Session.create({
                userId: user._id,
                sessionToken,
                expiresAt: sessionExpires,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });

            const userOutput = user.toObject();
            delete userOutput.password;

            logger.info('User logged in', { userId: user._id, email: user.email });

            res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: userOutput,
                    sessionToken,
                    expiresAt: sessionExpires
                }
            });
        } else {
            // JSON file implementation
            const user = USERS_DATA.find(u => u.email === email);

            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            user.lastLogin = new Date();
            saveUsers();

            const sessionToken = crypto.randomBytes(64).toString('hex');
            const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Session limit for Studio users (Max 3 devices)
            if (user.membershipType === 'studio') {
                const userSessions = SESSIONS_DATA.filter(s => s.userId === user.id && new Date(s.expiresAt) > new Date())
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                // If we have 3 or more sessions, remove the oldest ones to make room
                // We keep (3 - 1) = 2 old sessions, then add 1 new = 3 total
                if (userSessions.length >= 3) {
                    const sessionsToRemoveCount = userSessions.length - 2;
                    if (sessionsToRemoveCount > 0) {
                        const sessionsToRemove = userSessions.slice(0, sessionsToRemoveCount);
                        const tokensToRemove = sessionsToRemove.map(s => s.sessionToken);
                        SESSIONS_DATA = SESSIONS_DATA.filter(s => !tokensToRemove.includes(s.sessionToken));
                    }
                }
            } else if (user.membershipType === 'creator' || user.membershipType === 'lifetime') {
                // Single device access for Creator and Lifetime plan users
                SESSIONS_DATA = SESSIONS_DATA.filter(s => s.userId !== user.id);
            }

            SESSIONS_DATA.push({
                id: crypto.randomBytes(16).toString('hex'),
                userId: user.id,
                sessionToken,
                expiresAt: sessionExpires,
                createdAt: new Date()
            });
            saveSessions();

            console.log(`✅ User logged in: ${user.username} (${user.membershipType})`);

            const userOutput = { ...user };
            delete userOutput.password;

            res.json({
                status: 'success',
                message: 'Login successful',
                data: {
                    user: userOutput,
                    sessionToken,
                    expiresAt: sessionExpires
                }
            });
        }
    } catch (err) {
        logger.error('Login error', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/auth/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (USE_MONGODB) {
            if (token) {
                await Session.deleteOne({ sessionToken: token });
            }
        } else {
            if (token) {
                SESSIONS_DATA = SESSIONS_DATA.filter(s => s.sessionToken !== token);
                saveSessions();
            }
        }

        res.json({ status: 'success', message: 'Logout successful' });
    } catch (err) {
        logger.error('Logout error', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/auth/session', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (USE_MONGODB) {
            const session = await Session.findOne({
                sessionToken: token,
                expiresAt: { $gt: new Date() }
            }).populate('userId');

            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            const userOutput = session.userId.toObject();
            delete userOutput.password;

            res.json({
                status: 'success',
                data: {
                    user: userOutput,
                    session: {
                        expiresAt: session.expiresAt
                    }
                }
            });
        } else {
            const session = SESSIONS_DATA.find(
                s => s.sessionToken === token && new Date(s.expiresAt) > new Date()
            );

            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            const user = USERS_DATA.find(u => u.id === session.userId);

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userOutput = { ...user };
            delete userOutput.password;

            res.json({
                status: 'success',
                data: {
                    user: userOutput,
                    session: {
                        expiresAt: session.expiresAt
                    }
                }
            });
        }
    } catch (err) {
        logger.error('Session check error', { error: err.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
