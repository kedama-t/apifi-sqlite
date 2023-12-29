"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serve_1 = require("./serve");
(0, serve_1.serve)(process.argv[2], Number(process.argv[3]) || 3000);
