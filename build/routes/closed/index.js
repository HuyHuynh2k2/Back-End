"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closedRoutes = void 0;
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../../core/middleware");
const tokenTest_1 = require("./tokenTest");
const closedRoutes = express_1.default.Router();
exports.closedRoutes = closedRoutes;
closedRoutes.use('/jwt_test', middleware_1.checkToken, tokenTest_1.tokenTestRouter);
//# sourceMappingURL=index.js.map