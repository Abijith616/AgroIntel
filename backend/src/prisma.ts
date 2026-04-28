import path from 'path';
import { DatabaseSync } from 'node:sqlite';

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new DatabaseSync(dbPath);

const normalizeBoolean = (row: any, field: string) => {
    if (row && field in row) {
        row[field] = Boolean(row[field]);
    }
    return row;
};

const applySelect = <T extends Record<string, any>>(row: T | null, select?: Record<string, boolean>): any => {
    if (!row || !select) {
        return row;
    }

    const selected: Record<string, any> = {};
    for (const [key, enabled] of Object.entries(select)) {
        if (enabled) {
            selected[key] = row[key];
        }
    }
    return selected as Partial<T>;
};

const mapRows = <T = any>(query: string, params: any[] = [], transform?: (row: any) => T): T[] => {
    const rows = db.prepare(query).all(...params) as any[];
    return transform ? rows.map(transform) : rows;
};

const mapFirst = <T = any>(query: string, params: any[] = [], transform?: (row: any) => T): T | null => {
    const row = db.prepare(query).get(...params) as any;
    if (!row) {
        return null;
    }
    return transform ? transform(row) : row;
};

const prisma = {
    user: {
        async findFirst({ where }: any): Promise<any> {
            if (where?.OR) {
                const email = where.OR.find((item: any) => item.email)?.email ?? null;
                const username = where.OR.find((item: any) => item.username)?.username ?? null;
                return mapFirst(`SELECT * FROM "User" WHERE "email" = ? OR "username" = ? LIMIT 1`, [email, username]);
            }
            return null;
        },
        async findUnique({ where, select }: any): Promise<any> {
            if (where?.username) {
                return applySelect(mapFirst(`SELECT * FROM "User" WHERE "username" = ? LIMIT 1`, [where.username]), select);
            }
            if (where?.email) {
                return applySelect(mapFirst(`SELECT * FROM "User" WHERE "email" = ? LIMIT 1`, [where.email]), select);
            }
            if (where?.id) {
                return applySelect(mapFirst(`SELECT * FROM "User" WHERE "id" = ? LIMIT 1`, [where.id]), select);
            }
            return null;
        },
        async create({ data }: any): Promise<any> {
            return mapFirst(
                `INSERT INTO "User" ("email", "username", "password", "createdAt", "updatedAt")
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [data.email, data.username, data.password]
            );
        },
        async update({ where, data }: any): Promise<any> {
            return mapFirst(
                `UPDATE "User" SET "password" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ? RETURNING *`,
                [data.password, where.id]
            );
        }
    },
    crop: {
        async findMany({ where, orderBy }: any = {}): Promise<any[]> {
            const order = orderBy?.createdAt === 'desc' ? 'DESC' : orderBy?.createdAt === 'asc' ? 'ASC' : 'DESC';
            if (where?.userId) {
                return mapRows(`SELECT * FROM "Crop" WHERE "userId" = ? ORDER BY "createdAt" ${order}`, [where.userId]);
            }
            return mapRows(`SELECT * FROM "Crop" ORDER BY "createdAt" ${order}`);
        },
        async findFirst({ where }: any): Promise<any> {
            return mapFirst(
                `SELECT * FROM "Crop" WHERE "id" = ? AND "userId" = ? LIMIT 1`,
                [where.id, where.userId]
            );
        }
    },
    scheme: {
        async findMany(): Promise<any[]> {
            return mapRows(`SELECT * FROM "Scheme" ORDER BY "createdAt" DESC`);
        }
    },
    expense: {
        async create({ data, include }: any): Promise<any> {
            const created = mapFirst(
                `INSERT INTO "Expense" ("userId", "cropId", "category", "amount", "description", "date", "createdAt", "updatedAt")
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [data.userId, data.cropId, data.category, data.amount, data.description, new Date(data.date).toISOString()]
            );
            if (!created) return null;

            if (include?.crop?.select?.name && created.cropId) {
                const crop = mapFirst(`SELECT "name" FROM "Crop" WHERE "id" = ? LIMIT 1`, [created.cropId]);
                return { ...created, crop };
            }
            return created;
        },
        async findMany({ where, include, orderBy }: any): Promise<any[]> {
            const params: any[] = [where.userId];
            let query = `SELECT e.* FROM "Expense" e WHERE e."userId" = ?`;

            if (where?.date?.gte) {
                query += ` AND e."date" >= ?`;
                params.push(new Date(where.date.gte).toISOString());
            }
            if (where?.date?.lte) {
                query += ` AND e."date" <= ?`;
                params.push(new Date(where.date.lte).toISOString());
            }

            if (orderBy?.date) {
                query += ` ORDER BY e."date" ${orderBy.date === 'asc' ? 'ASC' : 'DESC'}`;
            }

            const expenses = mapRows<any>(query, params);
            if (!include?.crop?.select) {
                return expenses;
            }

            return expenses.map((expense: any) => {
                if (!expense.cropId) {
                    return { ...expense, crop: null };
                }
                const select = include.crop.select;
                const columns = Object.entries(select)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => `"${key}"`)
                    .join(', ');
                const crop = mapFirst(`SELECT ${columns} FROM "Crop" WHERE "id" = ? LIMIT 1`, [expense.cropId]);
                return { ...expense, crop };
            });
        },
        async findFirst({ where }: any): Promise<any> {
            return mapFirst(`SELECT * FROM "Expense" WHERE "id" = ? AND "userId" = ? LIMIT 1`, [where.id, where.userId]);
        },
        async delete({ where }: any): Promise<any> {
            return mapFirst(`DELETE FROM "Expense" WHERE "id" = ? RETURNING *`, [where.id]);
        }
    },
    passwordReset: {
        async updateMany({ where, data }: any): Promise<any> {
            const statement = db.prepare(`UPDATE "PasswordReset" SET "used" = ? WHERE "userId" = ? AND "used" = ?`);
            return statement.run(data.used ? 1 : 0, where.userId, where.used ? 1 : 0);
        },
        async create({ data }: any): Promise<any> {
            return normalizeBoolean(
                mapFirst(
                    `INSERT INTO "PasswordReset" ("userId", "otp", "expiresAt", "used", "createdAt")
                     VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
                     RETURNING *`,
                    [data.userId, data.otp, new Date(data.expiresAt).toISOString()]
                ),
                'used'
            );
        },
        async findFirst({ where, orderBy }: any): Promise<any> {
            const params: any[] = [];
            let query = `SELECT * FROM "PasswordReset"`;
            const filters: string[] = [];

            if (where?.userId !== undefined) {
                filters.push(`"userId" = ?`);
                params.push(where.userId);
            }
            if (where?.otp !== undefined) {
                filters.push(`"otp" = ?`);
                params.push(where.otp);
            }
            if (where?.used !== undefined) {
                filters.push(`"used" = ?`);
                params.push(where.used ? 1 : 0);
            }
            if (where?.expiresAt?.gt) {
                filters.push(`"expiresAt" > ?`);
                params.push(new Date(where.expiresAt.gt).toISOString());
            }

            if (filters.length > 0) {
                query += ` WHERE ${filters.join(' AND ')}`;
            }

            if (orderBy?.createdAt) {
                query += ` ORDER BY "createdAt" ${orderBy.createdAt === 'asc' ? 'ASC' : 'DESC'}`;
            }

            query += ` LIMIT 1`;
            return normalizeBoolean(mapFirst(query, params), 'used');
        },
        async update({ where, data }: any): Promise<any> {
            return normalizeBoolean(
                mapFirst(
                    `UPDATE "PasswordReset" SET "used" = ? WHERE "id" = ? RETURNING *`,
                    [data.used ? 1 : 0, where.id]
                ),
                'used'
            );
        }
    },
    async $queryRawUnsafe<T = any>(query: string, ...params: any[]): Promise<T> {
        const trimmed = query.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.includes(' RETURNING ')) {
            return db.prepare(query).all(...params) as T;
        }
        return db.prepare(query).run(...params) as T;
    },
    async $executeRawUnsafe(query: string, ...params: any[]) {
        return db.prepare(query).run(...params);
    }
};

export default prisma;
