"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serve = void 0;
const createApp_1 = __importDefault(require("./createApp"));
const serve = (dbPath, port = 3000) => {
    if (!dbPath) {
        console.error('Please specify the path to the sqlite db file.');
    }
    else {
        (async () => {
            const { app, routes } = await (0, createApp_1.default)(dbPath);
            app.listen(port, () => {
                console.log(`Server is running on http://localhost:${port}`);
                routes.forEach((route) => {
                    console.log(`- ${route.method} : http://localhost:${port}${route.path}`);
                });
            });
        })();
    }
};
exports.serve = serve;
