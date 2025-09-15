"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRepository = void 0;
const inversify_1 = require("inversify");
let CacheRepository = class CacheRepository {
    // For now, we'll use in-memory storage to test the DI pattern
    // Later we'll replace with actual Redis
    cache = new Map();
    async set(key, value, expireInSeconds) {
        const expires = expireInSeconds ? Date.now() + (expireInSeconds * 1000) : undefined;
        this.cache.set(key, { value, expires });
        console.log(`Cache: Set ${key} = ${value}`);
    }
    async get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (item.expires && Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        console.log(`Cache: Get ${key} = ${item.value}`);
        return item.value;
    }
    async delete(key) {
        this.cache.delete(key);
        console.log(`Cache: Deleted ${key}`);
    }
    async exists(key) {
        const exists = this.cache.has(key);
        console.log(`Cache: ${key} exists = ${exists}`);
        return exists;
    }
};
exports.CacheRepository = CacheRepository;
exports.CacheRepository = CacheRepository = __decorate([
    (0, inversify_1.injectable)()
], CacheRepository);
//# sourceMappingURL=CacheRepository.js.map