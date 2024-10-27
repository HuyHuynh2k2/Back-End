// express is framework we're using to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';

//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const bookRouter: Router = express.Router();

const isStringProvided = validationFunctions.isNumberProvided;

function mwValidPaginationQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const page: string = request.query.page as string;
    const limit: string = request.query.limit as string;

    if (
        validationFunctions.isNumberProvided(page) &&
        validationFunctions.isNumberProvided(limit)
    ) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing pagination parameters - please refer to documentations',
        });
        return;
    }
}

// Middleware to validate the ISBN parameter
function mwValidISBN(request: Request, response: Response, next: NextFunction) {
    const isbn: string = request.params.isbn;
    if (validationFunctions.isNumberProvided(isbn) && isbn.length === 13) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing ISBN parameter - please provide a 13-digit number',
        });
    }
}

bookRouter.get(
    '/:isbn',
    mwValidISBN,
    (request: Request, response: Response, next: NextFunction) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE isbn13 = $1';
        const values = [request.params.isbn];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 1) {
                    response.send({
                        book: result.rows[0],
                    });
                } else {
                    response.status(404).send({
                        message: 'Book not found',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on GET book by ISBN');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HUY HUYNH',
                });
            });
    }
);

export { bookRouter };
