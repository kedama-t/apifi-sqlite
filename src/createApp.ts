import express from "express";
import type { Request } from "express";
import bodyParser from "body-parser";

import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

interface IRequest extends Request {
  query: {
    [key: string]: any;
  };
  body: {
    [key: string]: any;
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

const getWhereClauseAndParameters = (query: { [key: string]: string }) => {
  const parameters: any[] = [];
  const whereClause =
    "WHERE " +
    Object.keys(query)
      .map((key) => {
        const [fieldName, operand] = key.split(",");
        const value = query[key] as string;
        const paramCount = value.split(",").length;

        switch (operand?.toLowerCase()) {
          case "in":
            parameters.push(...value.split(","));
            return `${fieldName} in (${Array(paramCount).fill("?").join(",")})`;
          case "notin":
            parameters.push(...value.split(","));
            return `${fieldName} not in (${Array(paramCount)
              .fill("?")
              .join(",")})`;
          case "like":
            parameters.push(value);
            return `${fieldName} like '%' || ? || '%'`;
          case "notlike":
            parameters.push(value);
            return `not ${fieldName} like '%' || ? || '%'`;
          case "gt":
            parameters.push(value);
            return `${fieldName} > ?`;
          case "lt":
            parameters.push(value);
            return `${fieldName} < ?`;
          case "ge":
            parameters.push(value);
            return `${fieldName} >= ?`;
          case "le":
            parameters.push(value);
            return `${fieldName} <= ?`;

          case "ne":
            if (value === "null") {
              return `${fieldName} is not null`;
            }

            parameters.push(value);
            return `${fieldName} != ?`;

          case "eq":
          case "":
          default:
            if (value === "null") {
              return `${fieldName} is null`;
            }

            parameters.push(value);
            return `${fieldName} = ?`;
        }
      })
      .join(" and ");
  return { whereClause, parameters };
};

export default async function (dbPath: string) {
  const db = await open({
    filename: path.resolve(dbPath),
    driver: sqlite3.Database,
  });

  const app = express();

  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(bodyParser.json());

  // テーブル名を取得し、それぞれのテーブルに対してエンドポイントを設定する
  const tables: { name: string }[] = await db.all(
    `SELECT name FROM sqlite_master WHERE type='table'`
  );

  for (const table of tables) {
    const tableName = table.name;

    // データ取得エンドポイント
    app.get(`/${tableName}`, async (req: IRequest, res) => {
      const query = req.query;
      const { whereClause, parameters } =
        Object.keys(query).length > 0
          ? getWhereClauseAndParameters(query)
          : { whereClause: "", parameters: [] };

      const stmt = await db.prepare(
        `SELECT * FROM ${tableName} ${whereClause}`
      );

      try {
        const data = await stmt.all(parameters);
        res.status(200).json(data);
      } catch (e: unknown) {
        res.status(500).json(e);
      }
    });

    // データ削除エンドポイント
    app.delete(`/${tableName}`, async (req: IRequest, res) => {
      const query = req.query;
      const { whereClause, parameters } =
        Object.keys(query).length > 0
          ? getWhereClauseAndParameters(query)
          : { whereClause: "", parameters: [] };

      const stmt = await db.prepare(`DELETE FROM ${tableName} ${whereClause}`);

      try {
        const result = await stmt.run(parameters);
        res.status(200).json(result.changes);
      } catch (e: unknown) {
        res.status(500).json(e);
      }
    });

    // データ作成エンドポイント
    app.post(`/${tableName}`, async (req: IRequest, res) => {
      const body = req.body;

      const keys = Object.keys(body);
      const values = Object.values(body);

      const stmt = await db.prepare(
        `INSERT INTO ${tableName} (${keys.join(",")}) VALUES (${Array(
          values.length
        )
          .fill("?")
          .join(",")})`
      );

      try {
        const result = await stmt.run(values);
        res.status(200).json(result.lastID);
      } catch (e: unknown) {
        res.status(500).json(e);
      }
    });

    // データ更新エンドポイント
    app.put(`/${tableName}`, async (req: IRequest, res) => {
      const query = req.query;
      const { whereClause, parameters: whereParameters } =
        Object.keys(query).length > 0
          ? getWhereClauseAndParameters(query)
          : { whereClause: "", parameters: [] };

      const body = req.body;


      const setParameters: any[] = [];

      const setClause = Object.keys(body)
        .map((key) => {
          setParameters.push(body[key]);
          return `${key} = ?`;
        })
        .join(",");

      const stmt = await db.prepare(
        `UPDATE ${tableName} SET ${setClause} ${whereClause}`
      );
      console.log({ stmt,setClause,whereClause });

      try {
        const result = await stmt.run([...setParameters, ...whereParameters]);
        res.status(200).json(result.changes);
      } catch (e: unknown) {
        res.status(500).json(e);
      }
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
