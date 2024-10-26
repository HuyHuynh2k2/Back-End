"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenTestRouter = void 0;
// express is the framework we're going to use to handle requests
const express_1 = __importDefault(require("express"));
// retrieve the router object from express
const tokenTestRouter = express_1.default.Router();
exports.tokenTestRouter = tokenTestRouter;
/**
 * @api {get} /jwt_test Test token authenticator
 * @apiName JWT Test
 * @apiGroup JWT Test
 *
 * @apiSuccess {String} message  the string
 *  "Your token is valid and your role is: <code>role</code>"
 *
 * @apiError (403: Token is not valid) {String} message "Token is not valid" when the provided Auth token is
 * invalid for any reason.
 * @apiError (401: Auth token is not supplied) {String} message "Auth token is not supplied" when no Auth token
 * is provided
 */
tokenTestRouter.get('/', (request, response) => {
    response.send({
        message: `Your token is valid and your role is: ${request.claims.role}`,
    });
});
//# sourceMappingURL=tokenTest.js.map