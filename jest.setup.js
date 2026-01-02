import { createRequire } from "module";
const require = createRequire(import.meta.url);


Object.assign(global, require('jest-chrome'))
