"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const inversify_1 = require("inversify");
const types_1 = require("./types");
const CacheRepository_1 = require("../repositories/CacheRepository");
const DocumentService_1 = require("../services/DocumentService");
const SocketController_1 = require("../controllers/SocketController");
exports.container = new inversify_1.Container();
// Bind repositories
exports.container.bind(types_1.TYPES.CacheRepository).to(CacheRepository_1.CacheRepository).inSingletonScope();
// Bind services
exports.container.bind(types_1.TYPES.DocumentService).to(DocumentService_1.DocumentService).inSingletonScope();
// Bind controllers
exports.container.bind(types_1.TYPES.SocketController).to(SocketController_1.SocketController).inSingletonScope();
//# sourceMappingURL=container.js.map