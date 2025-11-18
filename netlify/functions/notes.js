// netlify/functions/notes.js
import { neon } from '@netlify/neon';

const sql = neon();

// Garante que a tabela existe (caso você não tenha rodado o SQL manualmente)
async function ensureNotesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

export const handler = async (event) => {
  const { httpMethod, queryStringParameters } = event;

  // Só vamos aceitar JSON
  const jsonHeaders = { 'Content-Type': 'application/json' };

  // OPTIONS (CORS básico, se precisar futuramente)
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: jsonHeaders,
      body: ''
    };
  }

  try {
    await ensureNotesTable();

    // GET → lista notas de um usuário
    if (httpMethod === 'GET') {
      const userId = queryStringParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Informe userId na query string.' })
        };
      }

      const notes = await sql`
        SELECT id, user_id, title, content, created_at, updated_at
        FROM notes
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true, notes })
      };
    }

    // POST → cria nota
    if (httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      const { userId, title, content } = data;

      if (!userId || !title || !content) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Informe userId, title e content.' })
        };
      }

      const inserted = await sql`
        INSERT INTO notes (user_id, title, content)
        VALUES (${userId}, ${title}, ${content})
        RETURNING id, user_id, title, content, created_at, updated_at
      `;

      return {
        statusCode: 201,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true, note: inserted[0] })
      };
    }

    // PUT → atualiza nota (somente se pertencer ao userId)
    if (httpMethod === 'PUT') {
      const data = JSON.parse(event.body || '{}');
      const { id, userId, title, content } = data;

      if (!id || !userId || !title || !content) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Informe id, userId, title e content.' })
        };
      }

      const updated = await sql`
        UPDATE notes
        SET title = ${title},
            content = ${content},
            updated_at = NOW()
        WHERE id = ${id}
          AND user_id = ${userId}
        RETURNING id, user_id, title, content, created_at, updated_at
      `;

      if (updated.length === 0) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Nota não encontrada para este usuário.' })
        };
      }

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true, note: updated[0] })
      };
    }

    // DELETE → remove nota (somente se pertencer ao userId)
    if (httpMethod === 'DELETE') {
      const data = JSON.parse(event.body || '{}');
      const { id, userId } = data;

      if (!id || !userId) {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Informe id e userId.' })
        };
      }

      const deleted = await sql`
        DELETE FROM notes
        WHERE id = ${id}
          AND user_id = ${userId}
        RETURNING id
      `;

      if (deleted.length === 0) {
        return {
          statusCode: 404,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Nota não encontrada para este usuário.' })
        };
      }

      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ success: true })
      };
    }

    // Método não permitido
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (err) {
    console.error('ERRO notes.js:', err);
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Erro interno na API de notas.' })
    };
  }
};
