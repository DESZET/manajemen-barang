/**
 * Auth Service
 * Business logic untuk authentication: register & login
 * Meng-handle password hashing, token generation, dan validasi kredensial
 */
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

/**
 * Register user baru
 * @param {Object} data - { name, email, password }
 * @returns {Promise<Object>} { id, name, email, createdAt }
 */
async function register(data) {
  // Cek apakah email sudah terdaftar
  const existingUser = await userRepository.findByEmail(data.email);

  if (existingUser) {
    throw new ApiError(409, 'CONFLICT', 'Email already registered');
  }

  // Hash password dengan bcrypt (salt rounds 10 = standar industri)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  // Simpan user baru
  const user = await userRepository.createUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  return user;
}

/**
 * Login user
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} { token, user }
 */
async function login(data) {
  // Cari user berdasarkan email
  const user = await userRepository.findByEmail(data.email);

  if (!user) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // Generate JWT token
  const token = signToken({
    id: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

module.exports = { register, login };
