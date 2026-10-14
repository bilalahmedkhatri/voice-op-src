import { NextResponse } from 'next/server';
import { getCurrentUser } from './googleAuth';
import { getDb } from '../db';
import type { DbUser } from '../db/types';

export class OwnershipError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export function ownershipErrorResponse(error: unknown): NextResponse {
  const known = error instanceof OwnershipError;
  return NextResponse.json(
    { error: known ? error.message : 'Unable to complete this request.' },
    { status: known ? error.status : 500, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export type OwnerContext = { user: DbUser; sql: NonNullable<ReturnType<typeof getDb>> };

export async function requireUser(): Promise<OwnerContext> {
  const user = await getCurrentUser();
  if (!user) throw new OwnershipError('Please sign in to continue.', 401);
  const sql = getDb();
  if (!sql) throw new OwnershipError('Account storage is unavailable.', 503);
  return { user, sql };
}

export function requireId(value: unknown, label = 'Resource ID'): string {
  if (typeof value !== 'string' || !value.trim()) throw new OwnershipError(`${label} is required.`, 400);
  return value.trim();
}

export async function requireOwnedTemplate(context: OwnerContext, templateId: unknown) {
  const id = requireId(templateId, 'Template ID');
  const { user, sql } = context;
  const rows = await sql`SELECT id, json_data FROM json_templates WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`;
  if (!rows.length) throw new OwnershipError('Template not found.', 404);
  return rows[0];
}

// Only content items from this owned template may be used as job/media associations.
export function requireTemplateItem(json: unknown, itemId: unknown): string {
  const id = requireId(itemId, 'Content item ID');
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(visit);
    const record = value as Record<string, unknown>;
    return record.id === id || record.item_id === id || Object.values(record).some(visit);
  };
  if (!visit(json)) throw new OwnershipError('Content item not found.', 404);
  return id;
}

export async function requireOwnedTemplateItem(context: OwnerContext, templateId: unknown, itemId: unknown) {
  const template = await requireOwnedTemplate(context, templateId);
  requireTemplateItem(template.json_data, itemId);
  return template;
}

export async function requireOwnedFacebookPage(context: OwnerContext, pageId: unknown) {
  const id = requireId(pageId, 'Page ID');
  const { user, sql } = context;
  const rows = await sql`SELECT page_id, page_name FROM facebook_pages WHERE user_id = ${user.id} AND page_id = ${id} AND is_active = TRUE LIMIT 1`;
  if (!rows.length) throw new OwnershipError('Connected page not found.', 404);
  return rows[0];
}
