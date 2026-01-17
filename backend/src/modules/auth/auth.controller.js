const authService = require('./auth.service');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const result = await authService.register(username, email, password);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'USERNAME_OR_EMAIL_EXISTS') {
            return res.status(409).json({ error: 'User already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login };
