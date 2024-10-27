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
    const isbn: string = request.query.isbn as string; // Cast to string for validation
    if (validationFunctions.isNumberProvided(isbn) && isbn.length === 13) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing ISBN parameter - please provide a 13-digit number',
        });
    }
}

bookRouter.get('/', mwValidISBN, (request: Request, response: Response) => {
    const theQuery = 'SELECT * FROM BOOKS WHERE isbn13 = $1';
    const values = [request.query.isbn];

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
});

bookRouter.get(
    '/author/:author',
    (request: Request, response: Response, next: NextFunction) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE authors = $1';
        const values = [request.params.author]; // Accessing the author from request.params

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        books: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found for this author',
                    });
                }
            })
            .catch((error) => {
                console.error('DB query error on GET books by author');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HUY HUYNH',
                });
            });
    }
);

bookRouter.get(
    '/original_title/:original_title',
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE original_title = $1';
        const values = [request.params.original_title];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        books: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found with given original title',
                    });
                }
            })
            .catch((error) => {
                console.error('DB query error on GET books by original title');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HUY HUYNH',
                });
            });
    }
);
bookRouter.get(
    '/all',
    mwValidPaginationQuery,
    (request: Request, response: Response) => {
        const page: number = parseInt(request.query.page as string, 10);
        const limit: number = parseInt(request.query.limit as string, 10);
        const offset: number = (page - 1) * limit;

        const theQuery = 'SELECT * FROM BOOKS LIMIT $1 OFFSET $2';
        const values = [limit, offset];

        pool.query(theQuery, values)
            .then((result) => {
                response.send({
                    books: result.rows,
                });
            })
            .catch((error) => {
                console.error(
                    'DB query error on GET all books with pagination'
                );
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HUY HUYNH',
                });
            });
    }
);

export { bookRouter };
