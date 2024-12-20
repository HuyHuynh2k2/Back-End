// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';
import e from 'express';
import { IUser } from '../../core/models';

const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const registerRouter: Router = express.Router();

export interface IUserRequest extends Request {
    id: number;
}

// A valid password additionally must have at least 1 numeric and special character
export const isValidPassword = (password: string): boolean => {
    const hasNumber: RegExp = /\d/; // Checks for at least one digit
    const hasSpecialChar: RegExp = /[!@#$%^&*(),.?":{}|<>]/; // Checks for at least one special character

    return (
        isStringProvided(password) &&
        password.length > 7 &&
        hasNumber.test(password) &&
        hasSpecialChar.test(password)
    );
};

// A valid phone number additionally must not exceed 15 digits in length
const isValidPhone = (phone: string): boolean =>
    isNumberProvided(phone) && phone.length >= 10 && phone.length <= 15;

// Add more/your own role validation here. The *rules* must be documented
// and the client-side validation should match these rules.
const isValidRole = (priority: string): boolean =>
    isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;

// Add more/your own email validation here. The *rules* must be documented
// and the client-side validation should match these rules.
export const isValidEmail = (email: string): boolean =>
    isStringProvided(email) && email.includes('@');

/**
 * @api {post} /register Request to register a user
 * @apiName PostRegister
 * @apiGroup Auth
 *
 * @apiDescription
 * - **Password**: Must be a non-empty string containing at least 1 numerical and 1 special character.
 * - **Phone number**: Must be a non-empty series of numbers, with a length between 10 and 15 digits.
 * - **Email**: Must be a non-empty string that includes the '@' character.
 * - **Role**: Must be a number with a value between 1 and 5.
 * - **First & Last Name**: Must be non-empty strings.
 *
 * @apiBody {String} firstname a users first name
 * @apiBody {String} lastname a users last name
 * @apiBody {String} email a users email *unique
 * @apiBody {String} password a users password
 * @apiBody {String} username a username *unique
 * @apiBody {String} role a role for this user [1-5]
 * @apiBody {String} phone a phone number for this user
 *
 * @apiSuccess (Success 201) {string} accessToken a newly created JWT
 * @apiSuccess (Success 201) {number} id unique user id
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password  - please refer to documentation"
 * @apiError (400: Invalid Phone) {String} message "Invalid or missing phone number  - please refer to documentation"
 * @apiError (400: Invalid Email) {String} message "Invalid or missing email  - please refer to documentation"
 * @apiError (400: Invalid Role) {String} message "Invalid or missing role  - please refer to documentation"
 * @apiError (400: Username exists) {String} message "Username exists"
 * @apiError (400: Email exists) {String} message "Email exists"
 *
 */
registerRouter.post(
    '/register',
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidEmail(request.body.email)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing email  - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        //Verify that the caller supplied all the parameters
        //In js, empty strings or null values evaluate to false
        if (
            isStringProvided(request.body.firstname) &&
            isStringProvided(request.body.lastname) &&
            isStringProvided(request.body.username)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPhone(request.body.phone)) {
            next();
            return;
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing phone number  - please refer to documentation',
            });
            return;
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.body.password)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing password  - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidRole(request.body.role)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing role  - please refer to documentation',
            });
        }
    },
    (request: IUserRequest, response: Response, next: NextFunction) => {
        const theQuery =
            'INSERT INTO Account(firstname, lastname, username, email, phone, account_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING account_id';
        const values = [
            request.body.firstname,
            request.body.lastname,
            request.body.username,
            request.body.email,
            request.body.phone,
            request.body.role,
        ];
        // console.dir({ ...request.body, password: '******' });
        pool.query(theQuery, values)
            .then((result) => {
                //stash the account_id into the request object to be used in the next function
                // NOTE the TYPE for the Request object in this middleware function
                request.id = result.rows[0].account_id;
                next();
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == 'account_username_key') {
                    response.status(400).send({
                        message: 'Username exists',
                    });
                } else if (error.constraint == 'account_email_key') {
                    response.status(400).send({
                        message: 'Email exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on register');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    },
    (request: IUserRequest, response: Response) => {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        const salt = generateSalt(32);
        const saltedHash = generateHash(request.body.password, salt);

        const theQuery =
            'INSERT INTO Account_Credential(account_id, salted_hash, salt) VALUES ($1, $2, $3)';
        const values = [request.id, saltedHash, salt];
        pool.query(theQuery, values)
            .then(() => {
                const accessToken = jwt.sign(
                    {
                        role: request.body.role,
                        id: request.id,
                    },
                    key.secret,
                    {
                        expiresIn: '14 days', // expires in 14 days
                    }
                );

                const user = {
                    id: request.body.id,
                    name: request.body.firstname,
                    email: request.body.email,
                    role: request.body.role,
                };

                //We successfully added the user!
                response.status(201).send({
                    accessToken: accessToken,
                    user: user,
                });
            })
            .catch((error) => {
                //remove the user from the member table based on their account id
                //in case an errors occures when inserting the password
                const deletePasswordQuery =
                    'DELETE FROM Account WHERE account_ID = $1';
                const deleteValues = [request.id];
                pool.query(deletePasswordQuery, deleteValues).then((result) => {
                    if (result.rowCount > 0) {
                        response.status(200).send({
                            message: `Deleted ${request.id} from ID.`,
                        });
                    } else {
                        response.status(404).send({
                            message: `No ${request.id} was found.`,
                        });
                    }
                });

                //log the error
                console.error('DB Query error on register');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

registerRouter.get('/hash_demo', (request, response) => {
    const password = 'password12345';

    const salt = generateSalt(32);
    const saltedHash = generateHash(password, salt);
    const unsaltedHash = generateHash(password, '');

    response.status(200).send({
        salt: salt,
        salted_hash: saltedHash,
        unsalted_hash: unsaltedHash,
    });
});

export { registerRouter };
