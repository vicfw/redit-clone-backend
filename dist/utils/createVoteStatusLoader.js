"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoteStatusLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const typeorm_1 = require("typeorm");
const Updoot_1 = require("../entities/Updoot");
const createVoteStatusLoader = () => new dataloader_1.default(async (keys) => {
    const updoots = await Updoot_1.Updoot.findBy({
        postId: (0, typeorm_1.In)(keys.map((k) => k.postId)),
        userId: (0, typeorm_1.In)(keys.map((k) => k.userId)),
    });
    console.log(updoots, 'updoots');
    const updootIdsToUpdoot = {};
    updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId} | ${updoot.postId}`] = updoot;
    });
    const data = keys.map((key) => updootIdsToUpdoot[`${key.userId} | ${key.postId}`]);
    return data;
});
exports.createVoteStatusLoader = createVoteStatusLoader;
//# sourceMappingURL=createVoteStatusLoader.js.map