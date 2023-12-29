import request from 'supertest';
import createApp from '../createApp';
import type { Express } from 'express';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

jest.useFakeTimers();

const TEST_DBPATH = path.resolve(__dirname, 'test.db');
const TABLE_NAME = 'Users';
const COL_ID = 'id';
const COL_NAME = 'name';
const COL_EMAIL = 'email';
const COL_CREATED_AT = 'created_at';

const testData = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    created_at: '2023-12-31 12:59:59.999',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    created_at: '2024-01-01 00:00:00.000',
  },
  {
    id: 3,
    name: 'Alan Smithee',
    email: 'alan.smithee@example.com',
    created_at: '2024-01-02 00:00:00.000',
  },
  {
    id: 4,
    name: "John Doe",
    email: null,
    created_at: '2024-01-03 00:00:00.000',
  },
];
const newRecord = {
  id: 5,
  name: "Jane Doe",
  email: null,
  created_at: '2024-01-04 00:00:00.000',
}
const emailForNewRecord = {
  email: "jane.doe@example.com",
}

describe('API Endpoints', () => {
  let app: Express;

  beforeAll(async () => {
    // create db for testing
    fs.writeFileSync(TEST_DBPATH, '');
    const db = await open({
      filename: path.resolve(TEST_DBPATH),
      driver: sqlite3.Database,
    });

    await db.run(`
    CREATE TABLE ${TABLE_NAME} (
      ${COL_ID} INTEGER PRIMARY KEY,
      ${COL_NAME} TEXT NOT NULL,
      ${COL_EMAIL} TEXT,
      ${COL_CREATED_AT} TEXT NOT NULL
    );
    `);

    const insert = testData.map((data) => {
      return db.run(`INSERT INTO ${TABLE_NAME} VALUES (?,?,?,?);`, data.id, data.name, data.email, data.created_at);
    })
    await Promise.all(insert);
    await db.close();

    const result = await createApp(TEST_DBPATH);
    app = result.app;
  });

  afterAll(()=>{
    // delete test db
    fs.unlinkSync(TEST_DBPATH);
  })

  // Tests for GET endpoint
  describe('GET /:tableName', () => {
    it('get all data', async () => {
      const response = await request(app).get(`/${TABLE_NAME}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(testData);
    });

    it('equals (default)', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID}=${testData[0].id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0]]);
    });

    it('equals', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID},eq=${testData[0].id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0]]);
    });

    it('not equals', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID},ne=${testData[0].id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[1], testData[2], testData[3]]);
    });

    it('is null (default)', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_EMAIL}=null`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[3]]);
    });

    it('is null', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_EMAIL},eq=null`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[3]]);
    });

    it('is not null', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_EMAIL},ne=null`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0], testData[1], testData[2]]);
    });

    it('in', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID},in=2,3`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[1], testData[2]]);
    });

    it('not in', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID},notin=2,3`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0], testData[3]]);
    });

    it('like', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_NAME},like=John`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0], testData[3]]);
    });

    it('notlike', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_NAME},notlike=John`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[1], testData[2]]);
    });

    it('greater than', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_CREATED_AT},gt=2024-01-01 00:00:00.000`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[2], testData[3]]);
    });

    it('greater equal', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_CREATED_AT},ge=2024-01-01 00:00:00.000`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[1], testData[2], testData[3]]);
    });

    it('lesser than', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_CREATED_AT},lt=2024-01-01 00:00:00.000`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0]]);
    });

    it('lesser equal', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_CREATED_AT},le=2024-01-01 00:00:00.000`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([testData[0], testData[1]]);
    });

  });

  // Tests for POST endpoint
  describe('POST /:tableName', () => {
    it('should create data correctly', async () => {
      const response = await request(app).post(`/${TABLE_NAME}`).send(newRecord);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(5);
    });

    it('check created data', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID}=${newRecord.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([newRecord]);
    });
  });

  // Tests for PUT endpoint
  describe('PUT /:tableName', () => {
    it('should update data correctly', async () => {
      const response = await request(app).put(`/${TABLE_NAME}?${COL_ID}=${newRecord.id}`).send(emailForNewRecord);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(1);
    });

    it('check updated data', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID}=${newRecord.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([{...newRecord,...emailForNewRecord}]);
    });
  });

  // Tests for DELETE endpoint
  describe('DELETE /:tableName', () => {
    it('should delete data correctly', async () => {
      const response = await request(app).delete(`/${TABLE_NAME}?${COL_ID}=${newRecord.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(1);
    });
    it('check deleted data', async () => {
      const response = await request(app).get(`/${TABLE_NAME}?${COL_ID}=${newRecord.id}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
