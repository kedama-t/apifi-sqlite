#!/usr/bin/env node

require('../dist/serve').serve(process.argv[2], Number(process.argv[3]));