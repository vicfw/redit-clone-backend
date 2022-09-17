"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendMail(to, html) {
    let transporter = nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'acyi725vber4btku@ethereal.email',
            pass: 'vgy3XfmdDWNhkNk7T8',
        },
    });
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>',
        to,
        subject: 'Change Password ✔',
        html,
    });
}
exports.sendMail = sendMail;
//# sourceMappingURL=sendEmail.js.map