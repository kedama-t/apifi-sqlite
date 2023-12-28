"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createApp_1 = __importDefault(require("./createApp"));
const dbPath = process.argv[2]; // コマンドライン引数からDBのパスを取得
const port = process.argv[3] || 3000; // コマンドライン引数からportを取得
if (!dbPath) {
    console.error("Please specify the path to the sqlite db file.");
}
else {
    (0, createApp_1.default)(dbPath).then(({ app, routes }) => {
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
            routes.forEach((route) => {
                console.log(`- ${route.method} : http://localhost:${port}${route.path}`);
            });
        });
    });
}
