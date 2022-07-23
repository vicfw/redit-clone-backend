"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20220723083455 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20220723083455 extends migrations_1.Migration {
    async up() {
        this.addSql('alter table "user" add column "email" text not null;');
    }
}
exports.Migration20220723083455 = Migration20220723083455;
//# sourceMappingURL=Migration20220723083455.js.map