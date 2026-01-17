const authRepository = require('./auth.repository');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');

const register = async (username, email, password) => {
    const password_hash = await hashPassword(password);

    try {
        const user = authRepository.createUser({ username, email, password_hash });
        const token = generateToken({ id: user.id, username: user.username });
        return { user: { id: user.id, username: user.username, email: user.email }, token };
    } catch (error) {
        throw error;
    }
};

const login = async (email, password) => {
    const user = authRepository.findUserByEmail(email);
    if (!user) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const token = generateToken({ id: user.id, username: user.username });
    return { user: { id: user.id, username: user.username, email: user.email }, token };
};

module.exports = { register, login };
