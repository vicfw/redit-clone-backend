"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@mikro-orm/core");
const Post_1 = require("./entities/Post");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const main = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    await orm.getMigrator().up();
    const post = orm.em.create(Post_1.Post, { title: "my 1st post" });
    await orm.em.persistAndFlush(post);
    const app = (0, express_1.default)();
    const apolloServer = new apollo_server_express_1.ApolloServer({ schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [],
            validate: false
        }) });
    app.listen(3000, () => {
        console.log("server is running");
    });
};
main().catch(err => {
    console.log(err);
});
//# sourceMappingURL=index.js.map