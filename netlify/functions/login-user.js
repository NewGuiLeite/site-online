import { neon } from '@netlify/neon';
import crypto from 'node:crypto';

const sql = neon();

function hashPassword(password) {
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
    const data = JSON.parse(event.body || '{}');
    const { email, password } = data;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Informe e-mail e senha.' })
      };
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordHash = hashPassword(password);

    const rows = await sql`
      SELECT id, name, email
      FROM users
      WHERE email = ${normalizedEmail}
        AND password_hash = ${passwordHash}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'E-mail ou senha inválidos.' })
      };
    }

    const user = rows[0];

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user
      })
    };
  } catch (err) {
    console.error('Erro no login:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno ao fazer login.' })
    };
  }
};
