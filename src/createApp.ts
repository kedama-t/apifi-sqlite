import express from "express";
import type { Request } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

interface RequestWithQuery extends Request {
  query: {
    [key: string]: string;
  };
}

interface Route {
  methods: { [x: string]: boolean };
  path: string;
  stack: unknown;
}

export interface APIRoute {
  method: string;
  path: string;
}

const getWhereClause = (query: { [key: string]: string }) => {
  const whereClause =
    "WHERE " +
    Object.keys(query)
      .map((key) => {
        const [fieldName, operand] = key.split(",");
        const value = query[key] as string;
        const paramCount = value.split(",").length;

        switch (operand?.toLowerCase()) {
          case "in":
            return `${fieldName} in (${Array(paramCount).fill("?").join(",")})`;
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
      return whereClause;
};

export default async function (dbPath: string) {
  const db = await open({
    filename: path.resolve(dbPath),
    driver: sqlite3.Database,
  });

  const app = express();

  // テーブル名を取得し、それぞれのテーブルに対してエンドポイントを設定する
  const tables: { name: string }[] = await db.all(
    `SELECT name FROM sqlite_master WHERE type='table'`
  );

  for (const table of tables) {
    const tableName = table.name;

    // データ取得エンドポイント
    app.get(`/${tableName}`, async (req: RequestWithQuery, res) => {
      const query = req.query;
      const whereClause = Object.keys(query).length > 0 ? getWhereClause(query) :"";

      const stmt = await db.prepare(
        `SELECT * FROM ${tableName} ${whereClause}`
      );

      const values = Object.values(query).reduce(
        (prev: string[], value: string) => {
          return [...prev, ...value.split(",")];
        },
        []
      );

      const data = await stmt.all(values);
      res.json(data);
    });
  }

  const routes = app._router.stack
    .map((layer: { route: Route }) => layer.route)
    .filter((route: Route) => route)
    .reduce((prev: APIRoute[], route: Route) => {
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
