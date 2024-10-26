import express, { Router } from 'express';

import { messageRouter } from './message';

import { bookRouter } from './books';

const openRoutes: Router = express.Router();

openRoutes.use('/message', messageRouter);

openRoutes.use('/books', bookRouter);

export { openRoutes };
