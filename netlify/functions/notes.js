// netlify/functions/notes.js
import { neon } from '@netlify/neon';

const sql = neon();
const DEFAULT_NOTE_COLOR = '#1f2937';

async function ensureNotesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT ${DEFAULT_NOTE_COLOR},
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT ${DEFAULT_NOTE_COLOR}
  `;
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

function parseJsonBody(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error('INVALID_JSON_BODY');
  }
}

function parseId(value, fieldName = 'id') {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`INVALID_${fieldName.toUpperCase()}`);
  }
  return num;
}

function normalizeText(value, fieldName) {
  const str = (value ?? '').toString().trim();
  if (!str) {
    throw new Error(`EMPTY_${fieldName.toUpperCase()}`);
  }
  return str;
}

function normalizeColor(value) {
  const str = (value ?? '').toString().trim();
  if (!str) return DEFAULT_NOTE_COLOR;

  const normalized = str.startsWith('#') ? str : `#${str}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error('INVALID_COLOR');
  }

  return normalized.toLowerCase();
}

export const handler = async (event) => {
  const method = event.httpMethod || 'GET';
  console.log('[notes] Nova requisição', {
    method,
    path: event.path,
    qs: event.queryStringParameters
  });

  try {
    await ensureNotesTable();

    if (method === 'GET') {
      const userId = parseId(
        event.queryStringParameters?.userId,
        'user_id'
      );

      const notes = await sql`
        SELECT id, user_id, title, content, color, created_at, updated_at
        FROM notes
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;

      return jsonResponse(200, { notes });
    }

    if (method === 'POST') {
      const data = parseJsonBody(event.body);
      const userId = parseId(data.userId, 'user_id');
      const title = normalizeText(data.title, 'title');
      const content = normalizeText(data.content, 'content');
      const color = normalizeColor(data.color);

      const rows = await sql`
        INSERT INTO notes (user_id, title, content, color)
        VALUES (${userId}, ${title}, ${content}, ${color})
        RETURNING id, user_id, title, content, color, created_at, updated_at
      `;

      return jsonResponse(201, { note: rows[0] });
    }

    if (method === 'PUT') {
      const data = parseJsonBody(event.body);
      const userId = parseId(data.userId, 'user_id');
      const noteId = parseId(data.id, 'id');
      const title = normalizeText(data.title, 'title');
      const content = normalizeText(data.content, 'content');
      const color = normalizeColor(data.color);

      const rows = await sql`
        UPDATE notes
        SET title = ${title},
            content = ${content},
            color = ${color},
            updated_at = NOW()
        WHERE id = ${noteId} AND user_id = ${userId}
        RETURNING id, user_id, title, content, color, created_at, updated_at
      `;

      if (rows.length === 0) {
        return jsonResponse(404, { error: 'Nota n\u00e3o encontrada.' });
      }

      return jsonResponse(200, { note: rows[0] });
    }

    if (method === 'DELETE') {
      const data = parseJsonBody(event.body);
      const userId = parseId(data.userId, 'user_id');
      const noteId = parseId(data.id, 'id');

      const rows = await sql`
        DELETE FROM notes
        WHERE id = ${noteId} AND user_id = ${userId}
        RETURNING id
      `;

      if (rows.length === 0) {
        return jsonResponse(404, { error: 'Nota n\u00e3o encontrada.' });
      }

      return jsonResponse(200, { success: true });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (err) {
    if (err.message === 'INVALID_JSON_BODY') {
      return jsonResponse(400, { error: 'JSON inv\u00e1lido no corpo da requisi\u00e7\u00e3o.' });
    }
    if (err.message.startsWith('INVALID_') || err.message.startsWith('EMPTY_')) {
      console.warn('[notes] Erro de valida\u00e7\u00e3o:', err.message);
      return jsonResponse(400, { error: 'Dados inv\u00e1lidos ou incompletos.' });
    }
    console.error('[notes] Erro inesperado:', err);
    return jsonResponse(500, { error: 'Erro interno ao processar notas.' });
  }
};
