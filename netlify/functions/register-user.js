import { neon } from '@netlify/neon';
import crypto from 'node:crypto';

const sql = neon(); // usa NETLIFY_DATABASE_URL automaticamente

async function ensureUsersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

function hashPassword(password) {
  // Para projeto simples, ok. Para produção real, use bcrypt/argon2.
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    await ensureUsersTable();

    const data = JSON.parse(event.body || '{}');
    const { name, email, password } = data;

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Preencha nome, e-mail e senha.' })
      };
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = hashPassword(password);

    const existing = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail}
    `;

    if (existing.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'E-mail já cadastrado.' })
      };
    }

    const inserted = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email, created_at
    `;

    const user = inserted[0];

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        user
      })
    };
  } catch (err) {
    console.error('Erro no cadastro:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao cadastrar usuário.' })
    };
  }
};
