// express is framework we're using to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';

//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';
import { Book, UrlIcon, Ratings } from './implentation';

const bookRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;

function mwValidPaginationQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const page: string = request.query.page as string;
    const limit: string = request.query.limit as string;

    if (isNumberProvided(page) && isNumberProvided(limit)) {
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
    if (isNumberProvided(isbn) && isbn.length === 13) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing ISBN parameter - please provide a 13-digit number',
        });
    }
}

function mwValidAuthor(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const author: string = request.body.author;
    if (!isStringProvided(author)) {
        response.status(400).send({
            message: 'Invalid Author',
        });
    }
    next();
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

// Extra routing method
bookRouter.get(
    '/average_rating/:average_rating',
    (request: Request, response: Response) => {
        const tolerance = 0.005; // A small tolerance for floating point comparison (0.005 for hundredths precision)
        const averageRating = parseFloat(request.params.average_rating);
        const min = averageRating - tolerance;
        const max = averageRating + tolerance;

        const theQuery =
            'SELECT * FROM BOOKS WHERE rating_avg BETWEEN $1 AND $2';
        const values = [min, max];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        books: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found with given average rating',
                    });
                }
            })
            .catch((error) => {
                console.error('DB query error on GET books by average rating');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HIEU DOAN',
                });
            });
    }
);

bookRouter.get(
    '/publication_year/:publication_year',
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE publication_year = $1';
        const values = [request.params.publication_year];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        books: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found with given publication year',
                    });
                }
            })
            .catch((error) => {
                console.error(
                    'DB query error on GET books by publication year'
                );
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support HIEU DOAN',
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
