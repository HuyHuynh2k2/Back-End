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
import { Book, Ratings, UrlIcon } from '../../core/utilities/implements';

// Create a new router instance for book-related routes
const bookRouter: Router = express.Router();

// Shortcuts for validation functions
const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;

function mwValidPaginationQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const page: string = request.params.page as string;
    const limit: string = request.params.limit as string;

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

function mwValidIdQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const startId: string = request.params.startId as string;
    const endId: string = request.params.endId as string;

    if (
        validationFunctions.isNumberProvided(startId) &&
        validationFunctions.isNumberProvided(endId) &&
        parseInt(startId) <= parseInt(endId)
    ) {
        next();
    } else {
        response.send({
            message: 'Invalid start or end id - please refer to documentation',
        });
    }
}

function mwValidISBN(request: Request, response: Response, next: NextFunction) {
    const isbn: string = request.params.isbn as string; // Cast to string for validation
    // console.log(isbn);
    if (isNumberProvided(isbn) && isbn.length === 13) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing ISBN parameter - please provide a 13-digit number.',
        });
    }
}

function mwValidAuthor(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const author: string = request.params.author as string;

    if (!author || !isNaN(Number(author)) || author.trim().length === 0) {
        response.status(400).send({
            message: 'Invalid Author.',
        });
    } else {
        next();
    }
}

function mwValidRating(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const rating: string = request.params.rating_avg as string;

    if (isNumberProvided(rating)) {
        next();
    } else {
        response.status(400).send({
            message: 'Invalid Average Rating',
        });
    }
}

function mwValidRatings(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const oneStar: number = +request.params.oneStar;
    const twoStar: number = +request.params.twoStar;
    const threeStar: number = +request.params.threeStar;
    const fourStar: number = +request.params.fourStar;
    const fiveStar: number = +request.params.fiveStar;

    if (
        !isNumberProvided(oneStar) ||
        !isNumberProvided(twoStar) ||
        !isNumberProvided(threeStar) ||
        !isNumberProvided(fourStar) ||
        !isNumberProvided(fiveStar)
    ) {
        response.status(400).send({
            message: 'Invalid Ratings',
        });
    }
    next();
}

function mwValidOriginalTitle(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const original_title: string = request.params.original_title as string;

    if (isStringProvided(original_title)) {
        next();
    } else {
        response.status(400).send({
            message: 'Invalid Original Title',
        });
    }
}

function mwValidPublication(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const year: string = request.params.publication_year as string;

    if (isNumberProvided(year)) {
        next();
    } else {
        response.status(400).send({
            message: 'Invalid Year',
        });
    }
}

/**
 * @api {get} /c/books/isbn/:isbn Request to retrieve a book by ISBN
 *
 * @apiDescription Retrieves a book entry based on the provided ISBN number.
 *
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiParam {Number} isbn The ISBN of the book to retrieve (13-digit number).
 * @apiHeader {String} authorization The access token of the user.
 *
 * @apiSuccess {Object} book The book object containing all details of the book.
 * @apiSuccess {Number} book.isbn13 The ISBN of the book.
 * @apiSuccess {String} book.authors The authors of the book.
 * @apiSuccess {Number} book.publication_year The year the book was published.
 * @apiSuccess {String} book.original_title The original title of the book.
 * @apiSuccess {String} book.title The title of the book.
 * @apiSuccess {Object} book.ratings Ratings of the book.
 * @apiSuccess {Object} book.icons URL icons for the book images.
 *
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN parameter - please provide a 13-digit number."
 * @apiError (404: Book not found) {String} message "Book not found."
 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (500: Server error) {String} message "Server error - contact support team."
 */
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
                        message: 'Book not found.',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on GET book by ISBN');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support team',
                });
            });
    }
);

/**
 * @api {get} /c/books/author/:author Request to retrieve books by author
 *
 * @apiDescription Retrieves all book entries for a specified author.
 *
 * @apiName GetBooksByAuthor
 * @apiGroup Book
 *
 * @apiParam {String} author The author to retrieve books for.
 * @apiHeader {String} authorization The access token of the user.
 *
 * @apiSuccess {Object[]} books Array of book objects by the specified author.
 *
 * @apiError (400: Invalid Author) {String} message "Invalid Author."
 * @apiError (404: No books found) {String} message "No books found for this author."
 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (500: Server error) {String} message "Server error - contact support team."
 */
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
                        message: 'No books found for this author.',
                    });
                }
            })
            .catch((error) => {
                console.error('DB query error on GET books by author');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support team.',
                });
            });
    }
);

/**
 * @api {get} /c/books/original_title/:original_title Request to retrieve books by original title
 *
 * @apiDescription Retrieves all book entries with the specified original title.
 *
 * @apiName GetBooksByOriginalTitle
 * @apiGroup Book
 *
 * @apiParam {String} original_title The original title to search for.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {Object[]} books Array of book objects with the specified original title.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (404: No books found) {String} message "No books found with given original title."
 * @apiError (500: Server error) {String} message "Server error - contact support HUY HUYNH."
 */
bookRouter.get(
    '/original_title/:original_title',
    mwValidOriginalTitle,
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
                        message: 'No books found with given original title.',
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

/**
 * @api {get} /c/books/average_rating/:rating_avg Request to retrieve books by average rating
 *
 * @apiDescription Retrieves all book entries with an average rating within a certain tolerance.
 *
 * @apiName GetBooksByRating
 * @apiGroup Book
 *
 * @apiParam {Number} rating_avg The average rating to search for.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {Object[]} books Array of book objects with the specified average rating.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (404: No books found) {String} message "No Books found with given rating."
 * @apiError (500: Server error) {String} message "Server error - contact support team."
 */
bookRouter.get(
    '/average_rating/:rating_avg',
    mwValidRating,
    (request: Request, response: Response) => {
        const tolerance = 0.005;
        const averageRating = parseFloat(request.params.rating_avg);
        const min = averageRating - tolerance;
        const max = averageRating + tolerance;

        const theQuery =
            'SELECT * FROM BOOKS WHERE rating_avg BETWEEN $1 AND $2';
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
                    response.status(404).send({
                        message: 'No Books found with given rating',
                    });
                }
            })
            .catch((error) => {
                console.error('BD query error on GET books by ratings');
                console.log(error);
                response.status(500).send({
                    message: 'Server error - contact support team',
                });
            });
    }
);

/**
 * @api {get} /c/books/publication_year/:publication_year Request to retrieve books by publication year
 *
 * @apiDescription Retrieves all book entries published in the specified year.
 *
 * @apiName GetBooksByPublicationYear
 * @apiGroup Book
 *
 * @apiParam {Number} publication_year The publication year to search for.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {Object[]} books Array of book objects published in the specified year.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (400: Bad Request) {string} message "Invalid Year"
 * @apiError (404: No books found) {String} message "No books found with given publication"
 * @apiError (500: Server error) {String} message "Server error - contact support team"
 */
bookRouter.get(
    '/publication/:publication_year',
    mwValidPublication,
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM BOOKS WHERE publication_year = $1';
        const values = [request.params.publication_year];

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
                    response.status(404).send({
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

/**
 * @api {get} /c/books/all/:page/:limit Request to retrieve all books with pagination
 *
 * @apiDescription Retrieves all book entries with optional pagination.
 *
 * @apiName GetAllBooks
 * @apiGroup Book
 *
 * @apiParam {Number} page The page number to retrieve.
 * @apiParam {Number} limit The number of entries per page.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {Object[]} books Array of book objects for the specified page.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (400: Invalid Pagination) {String} message "Invalid or missing pagination parameters - please refer to documentation."
 * @apiError (500: Server error) {String} message "Server error - contact support HUY HUYNH."
 */

bookRouter.get(
    '/all/:page/:limit',
    mwValidPaginationQuery,
    (request: Request, response: Response) => {
        const page: number = parseInt(request.params.page, 10);
        const limit: number = parseInt(request.params.limit, 10);
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
                    message: 'Server error - contact support.',
                });
            });
    }
);

/**
 * @api {post} /c/books/book Request to add a new book
 *
 * @apiDescription Adds a new book entry to the database.
 *
 * @apiName AddBook
 * @apiGroup Book
 *
 * @apiHeader {String} authorization The access token of the user.
 * 
 * @apiBody {Number} isbn13 the book's isbn
 * @apiBody {String} authors the book's author
 * @apiBody {Number} publication_year the book's publication year
 * @apiBody {String} original_title the book's original_title
 * @apiBody {String} title the book's title
 * @apiBody {Number} rating_avg the book's average rating
 * @apiBody {Number} rating_1_star the book's number of 1-star ratings
 * @apiBody {Number} rating_2_star the book's number of 2-star ratings
 * @apiBody {Number} rating_3_star the book's number of 3-star ratings
 * @apiBody {Number} rating_4_star the book's number of 4-star ratings
 * @apiBody {Number} rating_5_star the book's number of 5-star ratings
 * @apiBody {Object} image_url the book's image url
 * @apiBody {Object} image_small_url the book's small image url

 * @apiSuccess {Object} entry The book object that was added.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (400: Book exists) {String} message "Book exists."
 * @apiError (500: Server error) {String} message "Server error - contact support."
 */
bookRouter.post('/book', async (request: Request, response: Response) => {
    const {
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
    } = request.body;

    // Get the current max ID from the database
    const maxIdResult = await pool.query('SELECT MAX(id) FROM BOOKS');
    const newId = (maxIdResult.rows[0].max || 0) + 1;

    const values = [
        newId,
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
        'INSERT INTO BOOKS(id, isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';

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

/**
 * @api {delete} /c/books/isbn/:isbn Request to delete a book by ISBN
 *
 * @apiDescription Deletes a book entry based on the provided ISBN number.
 *
 * @apiName DeleteBookByISBN
 * @apiGroup Book
 *
 * @apiParam {String} isbn The ISBN of the book to delete (13-digit number).
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {Object} entries The deleted book object.

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN parameter - please provide a 13-digit number."
 * @apiError (404: No Book found) {String} message "No Book with {isbn} found."
 * @apiError (500: Server error) {String} message "Server error - contact support."
 */
bookRouter.delete(
    '/isbn/:isbn',
    mwValidISBN,
    (request: Request, response: Response) => {
        const isbn: string = request.params.isbn;
        const value = [isbn];
        const query = 'DELETE FROM BOOKS WHERE isbn13 = $1 RETURNING *';

        pool.query(query, value)
            .then((result) => {
                if (result.rowCount > 0) {
                    const book: Book = createBook(result.rows[0]);
                    response.send({
                        entries: book,
                    });
                } else {
                    response.status(404).send({
                        message: `No book with ISBN ${isbn} found`,
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on DELETE by ISBN:', error);
                response.status(500).send({
                    message: 'Server error - contact support',
                });
            });
    }
);

/**
 * @api {delete} /c/books/delete/:startId/:endId Request to delete multiple books by ID range
 *
 * @apiDescription Deletes books with IDs in the specified range.
 *
 * @apiName DeleteBooksByIDRange
 * @apiGroup Book
 *
 * @apiParam {Number} startId The starting ID of the range.
 * @apiParam {Number} endId The ending ID of the range.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {String} message "Deleted {number} books from ID {startId} to {endId}."

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (404: No books found) {String} message "No books found in the specified range."
 * @apiError (500: Server error) {String} message "Server error - contact support."
 */
bookRouter.delete(
    '/delete/:startId/:endId',
    mwValidIdQuery,
    async (request: Request, response: Response) => {
        const startId = request.params.startId as string;
        const endId = request.params.endId as string;

        const theQuery = 'DELETE FROM BOOKS WHERE id BETWEEN $1 AND $2';
        const values = [startId, endId];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.status(200).send({
                        message: `Deleted ${result.rowCount} books from ID ${startId} to ${endId}.`,
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found in the specified range.',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on DELETE');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support.',
                });
            });
    }
);

/**
 * @api {put} /c/books/ratings/:isbn/:oneStar/:twoStar/:threeStar/:fourStar/:fiveStar Request to update the ratings of an existing book
 *
 * @apiDescription Updates a book's ratings
 *
 * @apiName UpdateBookRatings
 * @apiGroup Book
 *
 * @apiParam {Number} isbn The isbn of the book.
 * @apiParam {Number} oneStar The number of one stars in the book.
 * @apiParam {Number} twoStar The number of two stars in the book.
 * @apiParam {Number} threeStar The number of three stars in the book.
 * @apiParam {Number} fourStar The number of four stars in the book.
 * @apiParam {Number} fiveStar The number of five stars in the book.
 * @apiHeader {String} authorization The access token of the user.

 * @apiSuccess {String} message "Updated books {book title}."

 * @apiError (401: Token not supplied) {String} success "false"
 * @apiError (401: Token not supplied) {String} message "Auth token is not supplied"
 * @apiError (403: Invalid token) {String} success "false"
 * @apiError (403: Invalid token) {String} message "Token is not valid"
 * @apiError (404: No book found) {String} message "No book found."
 * @apiError (500: Server error) {String} message "Server error - contact support."
 */
bookRouter.put(
    '/ratings/:isbn/:oneStar/:twoStar/:threeStar/:fourStar/:fiveStar',
    mwValidISBN,
    mwValidRatings,
    async (request: Request, response: Response) => {
        const isbn = request.params.isbn;
        const oneStar: number = +request.params.oneStar;
        const twoStar: number = +request.params.twoStar;
        const threeStar: number = +request.params.threeStar;
        const fourStar: number = +request.params.fourStar;
        const fiveStar: number = +request.params.fiveStar;
        const ratingCount = oneStar + twoStar + threeStar + fourStar + fiveStar;
        const ratingAvg: number = Math.floor(
            (oneStar +
                twoStar * 2 +
                threeStar * 3 +
                fourStar * 4 +
                fiveStar * 5) /
                ratingCount
        );

        const query =
            'UPDATE BOOKS SET rating_1_star = rating_1_star + $1, rating_2_star = rating_2_star + $2, rating_3_star = rating_3_star + $3, rating_4_star = rating_4_star + $4, rating_5_star = rating_5_star + $5, rating_count = rating_count + $6 , rating_avg = (rating_avg + $7) / 2   WHERE BOOKS.isbn13 = $8 RETURNING *';
        const values = [
            oneStar,
            twoStar,
            threeStar,
            fourStar,
            fiveStar,
            ratingCount,
            ratingAvg,
            isbn,
        ];

        pool.query(query, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.status(200).send({
                        message: `Updated books ${result.rows[0].title} `,
                    });
                } else {
                    response.status(404).send({
                        message: 'No book found.',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on UPDATE');
                console.error(error);
                response.status(500).send({
                    message: 'Server error - contact support.',
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
        row.publication_year,
        row.original_title,
        row.title,
        ratings,
        icons
    );
    return book;
}

export { bookRouter };
