// express is framework we're using to use to handle requests
import express, {
    NextFunction,
    query,
    Request,
    response,
    Response,
    Router,
} from 'express';

//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';
import { Book, Ratings, UrlIcon } from './implements';

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
    const isbn: string = request.params.isbn as string; // Cast to string for validation
    // console.log(isbn);
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
    const author: string = request.query.author as string;

    if (!isStringProvided(author)) {
        response.status(400).send({
            message: 'Invalid Author',
        });
    }

    next();
}

bookRouter.get(
    '/isbn/:isbn',
    mwValidISBN,
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE isbn13 = $1';
        const values = [request.params.isbn];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 1) {
                    const row = result.rows[0];
                    const book: Book = createBook(row);

                    response.send({ book });
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

bookRouter.get(
    '/author/:author',
    mwValidAuthor,
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE authors = $1';
        const values = [request.params.author]; // Accessing the author from request.params

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    const rows = result.rows;
                    const finalResult: Book[] = [];
                    for (const row of rows) {
                        const book: Book = createBook(row);
                        finalResult.push(book);
                    }
                    response.send({
                        books: finalResult,
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
                    const rows = result.rows;
                    const finalResult: Book[] = [];
                    for (const row of rows) {
                        const book: Book = createBook(row);
                        finalResult.push(book);
                    }
                    response.send({
                        books: finalResult,
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

bookRouter.get('/ratings/:rating', (request: Request, response: Response) => {
    const tolerance = 0.005;
    const averageRating = parseFloat(request.params.rating);
    const min = averageRating - tolerance;
    const max = averageRating + tolerance;

    const theQuery = 'SELECT * FROM BOOKS WHERE rating_avg BETWEEN $1 AND $2';
    const values = [min, max];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount > 0) {
                const rows = result.rows;
                const finalResult: Book[] = [];
                for (const row of rows) {
                    const book: Book = createBook(row);
                    finalResult.push(book);
                }
                response.send({
                    book: finalResult,
                });
            } else {
                response.send('No Books found with given rating');
            }
        })
        .catch((error) => {
            console.error('BD query error on GET books by ratings');
            console.log(error);
            response.status(500).send({
                message: 'Server error - contact support team',
            });
        });
});

bookRouter.get(
    '/publication/:publicationYear',
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE publication_year = $1';
        const values = [request.params.publicationYear];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    const rows = result.rows;
                    const finalResult: Book[] = [];

                    for (const row of rows) {
                        const book: Book = createBook(row);
                        finalResult.push(book);
                    }
                    response.send({
                        book: finalResult,
                    });
                } else {
                    response.send({
                        message: 'No books found with given publication',
                    });
                }
            })
            .catch((error) => {
                console.error('BD query error on GET books by publication');
                console.log(error);
                response.status(500).send({
                    message: 'Server error - contact support team',
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
                const rows = result.rows;
                const finalResult: Book[] = [];
                for (const row of rows) {
                    const book: Book = createBook(row);
                    finalResult.push(book);
                }
                response.send({
                    books: finalResult,
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

bookRouter.post('/book', (request: Request, response: Response) => {
    const isbn13: string = request.body.isbn13;
    const authors: string = request.body.string;
    const publication_year: string = request.body.publication_year;
    const original_title: string = request.body.original_title;
    const title: string = request.body.title;
    const rating_avg: string = request.body.rating_avg;
    const rating_count: string = request.body.rating_count;
    const rating_1_star: string = request.body.rating_1_star;
    const rating_2_star: string = request.body.rating_2_star;
    const rating_3_star: string = request.body.rating_3_star;
    const rating_4_star: string = request.body.rating_4_star;
    const rating_5_star: string = request.body.rating_5_star;
    const image_url: string = request.body.image_url;
    const image_small_url: string = request.body.image_small_url;

    const values = [
        isbn13,
        authors,
        publication_year,
        original_title,
        title,
        rating_avg,
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
        image_url,
        image_small_url,
    ];
    const query =
        'INSERT INTO BOOKS(isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14 RETURNING *';

    pool.query(query, values)
        .then((result) => {
            const book: Book = createBook(result.rows[0]);
            response.status(201).send({
                entry: book,
            });
        })
        .catch((error) => {
            if (
                error.detail != undefined &&
                (error.detail as string).endsWith('already exists.')
            ) {
                console.error('Book exists');
                response.status(400).send({
                    message: 'Book exists',
                });
            } else {
                //log the error
                console.error('DB Query error on POST');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            }
        });
});

bookRouter.delete(
    '/isbn/:isbn',
    mwValidISBN,
    (request: Request, response: Response) => {
        const isbn: string = request.params.isbn;
        const value = [isbn];
        const query = 'DELETE FROM BOOKS WHERE isbn13 = 1$ RETURNING *';

        pool.query(query, value)
            .then((result) => {
                if (result.rowCount > 0) {
                    const book: Book = createBook(result.rows[0]);
                    response.send({
                        entries: book,
                    });
                } else {
                    response.status(404).send({
                        message: `No Book with ${isbn} found`,
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on DELETE by isbn');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

function createBook(row: any): Book {
    const ratings = new Ratings(
        row.rating_avg,
        row.rating_count,
        row.rating_1_star,
        row.rating_2_star,
        row.rating_3_star,
        row.rating_4_star,
        row.rating_5_star
    );

    const icons = new UrlIcon(row.image_url, row.image_small_url);

    const book = new Book(
        row.isbn13,
        row.authors,
        row.publication,
        row.original_title,
        row.title,
        ratings,
        icons
    );
    return book;
}

export { bookRouter };
