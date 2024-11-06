// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';
import { isValidEmail, isValidPassword } from './register';

export interface Auth {
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    auth: Auth;
}

const isStringProvided = validationFunctions.isStringProvided;
const generateHash = credentialingFunctions.generateHash;

const signinRouter: Router = express.Router();

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
signinRouter.post(
    '/login',
    (request: AuthRequest, response: Response, next: NextFunction) => {
        if (
            isValidEmail(request.body.email) &&
            isValidPassword(request.body.password)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: AuthRequest, response: Response) => {
        const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role 
        FROM Account_Credential
        INNER JOIN Account ON
        Account_Credential.account_id=Account.account_id 
        WHERE Account.email=$1`;
        const values = [request.body.email];
        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: 'User not found',
                    });
                    return;
                } else if (result.rowCount > 1) {
                    //log the error
                    console.error(
                        'DB Query error on sign in: too many results returned'
                    );
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
                const providedSaltedHash = generateHash(
                    request.body.password,
                    salt
                );

                //Did our salted hash match their salted hash?
                if (storedSaltedHash === providedSaltedHash) {
                    //credentials match. get a new JWT
                    const accessToken = jwt.sign(
                        {
                            name: result.rows[0].firstname,
                            role: result.rows[0].account_role,
                            id: result.rows[0].account_id,
                        },
                        key.secret,
                        {
                            expiresIn: '14 days', // expires in 14 days
                        }
                    );
                    //package and send the results
                    response.json({
                        accessToken,
                        id: result.rows[0].account_id,
                    });
                } else {
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
    }
);

/**
 * @api {put} /change_password Request to change a user's password in the system
 * @apiName PutPassword
 * @apiGroup Auth
 *
 * @apiBody {String} email a users email
 * @apiBody {String} password a user's new password
 *
 * @apiSuccess {String} message a success message
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did match, no new password was created"
 * 
 */
signinRouter.put(
    '/change_password',
    (request: AuthRequest, response: Response, next: NextFunction) => {
        if (
            isValidEmail(request.body.email) &&
            isValidPassword(request.body.password)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: AuthRequest, response: Response) => {
        //get the old salted hashed password from the database to compare it with the new password
        const theQuery = 
        `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role 
        FROM Account_Credential
        INNER JOIN Account 
        ON Account_Credential.account_id=Account.account_id 
        WHERE Account.email=$1`;
        const values = [request.body.email];
        pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found',
                });
                return;
            } else if (result.rowCount > 1) {
                //log the error
                console.error(
                    'DB Query error on sign in: too many results returned'
                );
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
            const providedSaltedHash = generateHash(
                request.body.password,
                salt
            );

            //Was our salted hash unique from their salted hash?
            if (storedSaltedHash !== providedSaltedHash) {
                //unique credentials => get a new JWT
                const accessToken = jwt.sign(
                    {
                        name: result.rows[0].firstname,
                        role: result.rows[0].account_role,
                        id: result.rows[0].account_id,
                    },
                    key.secret,
                    {
                        expiresIn: '14 days', // expires in 14 days
                    }
                );

                //package and send the results
                response.json({
                    accessToken,
                    id: result.rows[0].account_id,
                });

                //update the account in the database with the new salted hashed password
                const theQuery = 
                `UPDATE Account_Credential 
                SET salted_hash = $1
                WHERE account_id = $2`;
                const values = [storedSaltedHash, result.rows[0].account_id];
                pool.query(theQuery, values)
                .catch((error) => {
                    //log the error
                    console.error('BD query error on Put password');
                    console.log(error);
                    response.status(500).send({
                        message: 'Server error - contact support team',
                    });
                });
            } else {
                //credentials did match => old password was still used
                response.status(400).send({
                    message: 'Credentials did match, no new password was created',
                });
            }
        })
    }
);

export { signinRouter };