import express, { Router } from 'express';

import { checkToken } from '../../core/middleware';
import { tokenTestRouter } from './tokenTest';
import { bookRouter } from './books';

const closedRoutes: Router = express.Router();

closedRoutes.use('/c/books', checkToken, tokenTestRouter, bookRouter);

export { closedRoutes };
