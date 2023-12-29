# apifi-sqlite

Expose SQLite database as REST API

## Usage

```
npx apifi-sqlite {sqlite_filename} {port}
```

- `{sqlite_filename}` - path to SQLite database file.
- `{port}` - (Optional) Port for the API. Default:`3000`

## APIs

- Each tables in SQLite database will expose as endpoint `http://localhost:3000/{tablename}`.
- Each end point will recieve HTTP Method, `GET`, `POST`, `PUT`, `DELETE`.

### `GET`

- `GET` method runs `SELECT` statement in the database.

####  Where Clause

- If you call `GET` Method on endpoint `http://localhost:3000/Users?user_id=1`, that will run following statement.
```
SELECT * FROM Users WHERE user_id = 1
```

#### Operands

- default : `http://localhost:3000/Users?user_id=1` - `SELECT * FROM Users WHERE user_id = 1`
- `eq` : `http://localhost:3000/Users?user_id,eq=1` - `SELECT * FROM Users WHERE user_id = 1`
- `ne` : `http://localhost:3000/Users?user_id,ne=1` - `SELECT * FROM Users WHERE user_id != 1`
- `in` : `http://localhost:3000/Users?user_id,in=1,2,3` - `SELECT * FROM Users WHERE user_id in (1,2,3)`
- `notin` : `http://localhost:3000/Users?user_id,notin=1,2,3` - `SELECT * FROM Users WHERE user_id not in (1,2,3)`
- `like` : `http://localhost:3000/Users?user_name,like=john` - `SELECT * FROM Users WHERE user_id like '%john%'`
- `notlike` : `http://localhost:3000/Users?user_name,notlike=john` - `SELECT * FROM Users WHERE user_id not like '%john%'`
- `gt` : `http://localhost:3000/Users?user_id,gt=1` - `SELECT * FROM Users WHERE user_id > 1`
- `ge` : `http://localhost:3000/Users?user_id,ge=1` - `SELECT * FROM Users WHERE user_id >= 1`
- `lt` : `http://localhost:3000/Users?user_id,lt=1` - `SELECT * FROM Users WHERE user_id < 1`
- `le` : `http://localhost:3000/Users?user_id,le=1` - `SELECT * FROM Users WHERE user_id <= 1`

#### with null value
- `eq` : `http://localhost:3000/Users?user_id,eq=null` - `SELECT * FROM Users WHERE user_id is null`
- `ne` : `http://localhost:3000/Users?user_id,ne=null` - `SELECT * FROM Users WHERE user_id is not null`

### `POST`

- `POST` method runs `INSERT` statement in the database.
- You should send json data on request body.
  - json's key should be field name in the table, and json's value will set for the field.

### `PUT`

- `PUT` method runs `UPDATE` statement in the database.
- You should send json data on request body.
  - json's key should be field name in the table, and json's value will set for the field.

### `DELETE`

- `DELETE` method runs `DELETE` statement in the database.
- If you call with out any query, all data in the table will be deleted.
