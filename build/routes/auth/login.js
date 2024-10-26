"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signinRouter = void 0;
// express is the framework we're going to use to handle requests
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utilities_1 = require("../../core/utilities");
const isStringProvided = utilities_1.validationFunctions.isStringProvided;
const generateHash = utilities_1.credentialingFunctions.generateHash;
const signinRouter = express_1.default.Router();
exports.signinRouter = signinRouter;
const key = {
    secret: process.env.JSON_WEB_TOKEN,
};
/**
 * @api {post} /login Request to sign a user in the system
 * @apiName PostLogin
 * @apiGroup Auth
 *
 * @apiBody {String} email a users email
 * @apiBody {String} password a users password
 *
 * @apiSuccess {String} accessToken JSON Web Token
 * @apiSuccess {number} id unique user id
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 *
 */
signinRouter.post('/login', (request, response, next) => {
    if (isStringProvided(request.body.email) &&
        isStringProvided(request.body.password)) {
        next();
    }
    else {
        response.status(400).send({
            message: 'Missing required information',
        });
    }
}, (request, response) => {
    const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role FROM Account_Credential
                      INNER JOIN Account ON
                      Account_Credential.account_id=Account.account_id 
                      WHERE Account.email=$1`;
    const values = [request.body.email];
    utilities_1.pool.query(theQuery, values)
        .then((result) => {
        if (result.rowCount == 0) {
            response.status(404).send({
                message: 'User not found',
            });
            return;
        }
        else if (result.rowCount > 1) {
            //log the error
            console.error('DB Query error on sign in: too many results returned');
            response.status(500).send({
                message: 'server error - contact support',
            });
            return;
        }
        //Retrieve the salt used to create the salted-hash provided from the DB
        const salt = result.rows[0].salt;
        //Retrieve the salted-hash password provided from the DB
        const storedSaltedHash = result.rows[0].salted_hash;
        //Generate a hash based on the stored salt and the provided password
        const providedSaltedHash = generateHash(request.body.password, salt);
        //Did our salted hash match their salted hash?
        if (storedSaltedHash === providedSaltedHash) {
            //credentials match. get a new JWT
            const accessToken = jsonwebtoken_1.default.sign({
                name: result.rows[0].firstname,
                role: result.rows[0].account_role,
                id: result.rows[0].account_id,
            }, key.secret, {
                expiresIn: '14 days', // expires in 14 days
            });
            //package and send the results
            response.json({
                accessToken,
                id: result.rows[0].account_id,
            });
        }
        else {
            //credentials dod not match
            response.status(400).send({
                message: 'Credentials did not match',
            });
        }
    })
        .catch((error) => {
        //log the error
        console.error('DB Query error on sign in');
        console.error(error);
        response.status(500).send({
            message: 'server error - contact support',
        });
    });
});
//# sourceMappingURL=login.js.map