import express, { Router } from 'express';

import { checkToken } from '../../core/middleware';
import { tokenTestRouter } from './tokenTest';
import { openRoutes } from '../open';

const closedRoutes: Router = express.Router();

closedRoutes.use('/c', checkToken, openRoutes);

export { closedRoutes };
