import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../core/utilities';

const bookRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

export { bookRouter };

console.log('Test Branch');
