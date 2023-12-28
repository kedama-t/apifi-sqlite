"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
async function createApp(dbPath) {
    const db = await (0, sqlite_1.open)({
        filename: path_1.default.resolve(dbPath),
        driver: sqlite3_1.default.Database,
    });
    const app = (0, express_1.default)();
    // テーブル名を取得し、それぞれのテーブルに対してエンドポイントを設定する
    const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table'`);
    for (const table of tables) {
        const tableName = table.name;
        // データ取得エンドポイント
        app.get(`/${tableName}`, async (req, res) => {
            const query = req.query;
            let whereClause = "";
            if (Object.keys(query).length > 0) {
                whereClause =
                    "WHERE " +
                        Object.keys(query)
                            .map((key) => {
                            const [fieldName, operand] = key.split(",");
                            const value = query[key];
                            const paramCount = value.split(",").length;
                            switch (operand?.toLowerCase()) {
                                case "in":
                                    return `${fieldName} in (${Array(paramCount)
                                        .fill("?")
                                        .join(",")})`;
                                case "notin":
                                    return `${fieldName} not in (${Array(paramCount)
                                        .fill("?")
                                        .join(",")})`;
                                case "like":
                                    return `${fieldName} like '%' || ? || '%'`;
                                case "notlike":
                                    return `not ${fieldName} like '%' || ? || '%'`;
                                case "gt":
                                    return `${fieldName} > ?`;
                                case "lt":
                                    return `${fieldName} < ?`;
                                case "ge":
                                    return `${fieldName} >= ?`;
                                case "le":
                                    return `${fieldName} <= ?`;
                                case "ne":
                                    if (value === "null") {
                                        return `${fieldName} is not null`;
                                    }
                                    return `${fieldName} = ?`;
                                case "eq":
                                case "":
                                default:
                                    if (value === "null") {
                                        return `${fieldName} is null`;
                                    }
                                    return `${fieldName} = ?`;
                            }
                        })
                            .join(" and ");
            }
            const stmt = await db.prepare(`SELECT * FROM ${tableName} ${whereClause}`);
            const values = Object.values(query).reduce((prev, value) => {
                return [...prev, ...value.split(",")];
            }, []);
            const data = await stmt.all(values);
            res.json(data);
        });
    }
    const routes = app._router.stack
        .map((layer) => layer.route)
        .filter((route) => route)
        .reduce((prev, route) => {
        const methods = Object.keys(route.methods)
            .filter((method) => route.methods[method])
            .map((method) => {
            return {
                method: method.toUpperCase(),
                path: route.path,
            };
        });
        return [...prev, ...methods];
    }, []);
    app.get(`/`, async (req, res) => {
        res.render("./index.ejs", { dbPath, routes });
    });
    return { app, routes };
}
exports.default = createApp;
