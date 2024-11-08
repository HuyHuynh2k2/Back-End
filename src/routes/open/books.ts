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
import { pool, validationFunctions, collections} from '../../core/utilities';
import { Book, Ratings, UrlIcon } from './implements';



import { ObjectId } from "mongodb";

// Create a new router instance for book-related routes
const bookRouter: Router = express.Router();

// Shortcuts for validation functions
const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;

/**
 * Middleware to validate pagination query parameters.
 * Checks if 'page' and 'limit' are provided and valid numbers.
 */
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

/**
 * Middleware to validate ID range query parameters.
 * Checks if 'startId' and 'endId' are valid numbers and if 'startId' is less than or equal to 'endId'.
 */
function mwValidIdQuery(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const startId: string = request.query.startId as string;
    const endId: string = request.query.endId as string;

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

/**
 * Middleware to validate the ISBN parameter.
 * Checks if the provided ISBN is a 13-digit number.
 */
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

/**
 * Middleware to validate the author query parameter.
 * Checks if the provided author is a valid string.
 */
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
 * @api {get} /isbn/:isbn Request to retrieve a book by ISBN
 *
 * @apiDescription Retrieves a book entry based on the provided ISBN number.
 *
 * @apiName GetBookByISBN
 * @apiGroup Book
 *
 * @apiParam {String} isbn The ISBN of the book to retrieve (13-digit number).
 *
 * @apiSuccess {Object} book The book object containing all details of the book.
 * @apiSuccess {String} book.isbn13 The ISBN of the book.
 * @apiSuccess {String} book.authors The authors of the book.
 * @apiSuccess {Number} book.publication_year The year the book was published.
 * @apiSuccess {String} book.original_title The original title of the book.
 * @apiSuccess {String} book.title The title of the book.
 * @apiSuccess {Object} book.ratings Ratings of the book.
 * @apiSuccess {Object} book.icons URL icons for the book images.
 *
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN parameter - please provide a 13-digit number."
 * @apiError (404: Book not found) {String} message "Book not found."
 * @apiError (500: Server error) {String} message "Server error - contact support HUY HUYNH."
 */
    bookRouter.get(
    '/isbn/:isbn',
    mwValidISBN,
    async(request: Request, response: Response) => {
        // const theQuery = 'SELECT * FROM BOOKS WHERE isbn13 = $1';
        // const values = [request.params.isbn];

        // pool.query(theQuery, values)
        //     .then((result) => {
        //         if (result.rowCount === 1) {
        //             const row = result.rows[0];
        //             const book: Book = createBook(row);

        //             response.send({ book });
        //         } else {
        //             response.status(404).send({
        //                 message: 'Book not found.',
        //             });
        //         }
        //     })
        //     .catch((error) => {
        //         console.error('DB Query error on GET book by ISBN');
        //         console.error(error);
        //         response.status(500).send({
        //             message: 'Server error - contact support team',
        //         });
        //     });

        try {

            const isbn = Number(request.params.isbn)
    
            const filter = {
                "isbn13": isbn
              };
    
            const books = (await collections.books.find(filter).toArray()) as unknown[];
    
            console.log(books);
            
            response.status(200).send(books as Book[]);
        } catch (error) {
            console.error('DB Query error on GET book by ISBN');
            console.error(error);
            response.status(500).send({ message: 'Server error - contact support HUY HUYNH' });
        }
    
    });

/**
 * @api {get} /author/:author Request to retrieve books by author
 *
 * @apiDescription Retrieves all book entries for a specified author.
 *
 * @apiName GetBooksByAuthor
 * @apiGroup Book
 *
 * @apiParam {String} author The author to retrieve books for.
 *
 * @apiSuccess {Object[]} books Array of book objects by the specified author.
 *
 * @apiError (400: Invalid Author) {String} message "Invalid Author."
 * @apiError (404: No books found) {String} message "No books found for this author."
 * @apiError (500: Server error) {String} message "Server error - contact support team."
 */
bookRouter.get('/author/:author',
    mwValidAuthor,
    async(request: Request, response: Response) => {
        // const theQuery = 'SELECT * FROM BOOKS WHERE authors = $1';
        // const values = [request.params.author]; // Accessing the author from request.params

        // pool.query(theQuery, values)
        //     .then((result) => {
        //         if (result.rowCount > 0) {
        //             const rows = result.rows;
        //             const finalResult: Book[] = [];
        //             for (const row of rows) {
        //                 const book: Book = createBook(row);
        //                 finalResult.push(book);
        //             }
        //             response.send({
        //                 books: finalResult,
        //             });
        //         } else {
        //             response.status(404).send({
        //                 message: 'No books found for this author.',
        //             });
        //         }
        //     })
        //     .catch((error) => {
        //         console.error('DB query error on GET books by author');
        //         console.error(error);
        //         response.status(500).send({
        //             message: 'Server error - contact support team.',
        //         });
        //     });


        try {

            const author = request.params.author
    
            const filter = {
                "authors": { $regex: author, $options: 'i' } 
              };
    
            const books = (await collections.books.find(filter).toArray()) as unknown[];
    
            console.log(books);
            
            response.status(200).send(books as Book[]);
        } catch (error) {
            console.error('DB Query error on GET book by ISBN');
            console.error(error);
            response.status(500).send({ message: 'Server error - contact support HUY HUYNH' });
        }
    }
);

// /**
//  * @api {get} /original_title/:original_title Request to retrieve books by original title
//  *
//  * @apiDescription Retrieves all book entries with the specified original title.
//  *
//  * @apiName GetBooksByOriginalTitle
//  * @apiGroup Book
//  *
//  * @apiParam {String} original_title The original title to search for.
//  *
//  * @apiSuccess {Object[]} books Array of book objects with the specified original title.
//  *
//  * @apiError (404: No books found) {String} message "No books found with given original title."
//  * @apiError (500: Server error) {String} message "Server error - contact support HUY HUYNH."
//  */
// bookRouter.get('/original_title/:original_title',
//     mwValidOriginalTitle,
//     (request: Request, response: Response) => {
//         const theQuery = 'SELECT * FROM BOOKS WHERE original_title = $1';
//         const values = [request.params.original_title];

//         pool.query(theQuery, values)
//             .then((result) => {
//                 if (result.rowCount > 0) {
//                     const rows = result.rows;
//                     const finalResult: Book[] = [];
//                     for (const row of rows) {
//                         const book: Book = createBook(row);
//                         finalResult.push(book);
//                     }
//                     response.send({
//                         books: finalResult,
//                     });
//                 } else {
//                     response.status(404).send({
//                         message: 'No books found with given original title.',
//                     });
//                 }
//             })
//             .catch((error) => {
//                 console.error('DB query error on GET books by original title');
//                 console.error(error);
//                 response.status(500).send({
//                     message: 'Server error - contact support HUY HUYNH',
//                 });
//             });
//     }
// );

/**
 * @api {get} /average_rating/:rating_avg Request to retrieve books by average rating
 *
 * @apiDescription Retrieves all book entries with an average rating within a certain tolerance.
 *
 * @apiName GetBooksByRating
 * @apiGroup Book
 *
 * @apiParam {Number} rating_avg The average rating to search for.
 *
 * @apiSuccess {Object[]} books Array of book objects with the specified average rating.
 *
 * @apiError (404: No books found) {String} message "No Books found with given rating."
 * @apiError (500: Server error) {String} message "Server error - contact support team."
 */
bookRouter.get('/average_rating/:rating_avg', 
    mwValidRating,
    async(request: Request, response: Response) => {
    const tolerance = 0.005;
    const averageRating = parseFloat(request.params.rating_avg);
    const min = averageRating - tolerance;
    const max = averageRating + tolerance;

    
    try {
        
        
        const filter = {
            "average_rating": { $gte: min, $lte: max }
        };

        const books = (await collections.books.find(filter).toArray()) as unknown[];

        console.log(books);
        
        response.status(200).send(books as Book[]);
    } catch (error) {
        console.error('DB Query error on GET book by ISBN');
        console.error(error);
        response.status(500).send({ message: 'Server error - contact support HUY HUYNH' });
    }
});

/**
 * @api {get} /publication_year/:publication_year Request to retrieve books by publication year
 *
 * @apiDescription Retrieves all book entries published in the specified year.
 *
 * @apiName GetBooksByPublicationYear
 * @apiGroup Book
 *
 * @apiParam {Number} publication_year The publication year to search for.
 *
 * @apiSuccess {Object[]} books Array of book objects published in the specified year.
 *
 * @apiError (400: Bad Request) {string} message "Invalid Year"
 * @apiError (404: No books found) {String} message "No books found with given publication"
 * @apiError (500: Server error) {String} message "Server error - contact support team"
 */
bookRouter.get(
    '/publication/:publication_year',
    mwValidPublication,
    async(request: Request, response: Response) => {
        // const theQuery = 'SELECT * FROM BOOKS WHERE publication_year = $1';
        // const values = [request.params.publication_year];

        // pool.query(theQuery, values)
        //     .then((result) => {
        //         if (result.rowCount > 0) {
        //             const rows = result.rows;
        //             const finalResult: Book[] = [];

        //             for (const row of rows) {
        //                 const book: Book = createBook(row);
        //                 finalResult.push(book);
        //             }
        //             response.send({
        //                 book: finalResult,
        //             });
        //         } else {
        //             response.status(404).send({
        //                 message: 'No books found with given publication',
        //             });
        //         }
        //     })
        //     .catch((error) => {
        //         console.error('BD query error on GET books by publication');
        //         console.log(error);
        //         response.status(500).send({
        //             message: 'Server error - contact support team',
        //         });
        //     });



        try {
        
        
            const filter = {
                "original_publication_year": Number(request.params.publication_year)
            };
    
            const books = (await collections.books.find(filter).toArray()) as unknown[];
    
            console.log(books);
            
            response.status(200).send(books as Book[]);
        } catch (error) {
            console.error('DB Query error on GET book by ISBN');
            console.error(error);
            response.status(500).send({ message: 'Server error - contact support HUY HUYNH' });
        }
    }
);

/**
 * @api {get} /all Request to retrieve all books with pagination
 *
 * @apiDescription Retrieves all book entries with optional pagination.
 *
 * @apiName GetAllBooks
 * @apiGroup Book
 *
 * @apiQuery {Number} page The page number to retrieve.
 * @apiQuery {Number} limit The number of entries per page.
 *
 * @apiSuccess {Object[]} books Array of book objects for the specified page.
 *
 * @apiError (400: Invalid Pagination) {String} message "Invalid or missing pagination parameters - please refer to documentation."
 * @apiError (500: Server error) {String} message "Server error - contact support HUY HUYNH."
 */

bookRouter.get(
    '/all/:page/:limit',
    mwValidPaginationQuery,
    async(request: Request, response: Response) => {
        const page: number = parseInt(request.params.page, 10);
        const limit: number = parseInt(request.params.limit, 10);
        const offset: number = (page - 1) * limit;

        // const theQuery = 'SELECT * FROM BOOKS LIMIT $1 OFFSET $2';
        // const values = [limit, offset];

        // pool.query(theQuery, values)
        //     .then((result) => {
        //         const rows = result.rows;
        //         const finalResult: Book[] = [];
        //         for (const row of rows) {
        //             const book: Book = createBook(row);
        //             finalResult.push(book);
        //         }
        //         response.send({
        //             books: finalResult,
        //         });
        //     })
        //     .catch((error) => {
        //         console.error(
        //             'DB query error on GET all books with pagination'
        //         );
        //         console.error(error);
        //         response.status(500).send({
        //             message: 'Server error - contact support.',
        //         });
        //     });

        try {

            const author = request.params.author
    
            
    
            const books = (await collections.books.find({})
            .skip(offset)
            .limit(limit)
            .toArray()) as unknown[];
    
            console.log(books);
            
            response.status(200).send(books as Book[]);
        } catch (error) {
            console.error('DB Query error on GET book by ISBN');
            console.error(error);
            response.status(500).send({ message: 'Server error - contact support HUY HUYNH' });
        }
    }
);

/**
 * @api {post} /book Request to add a new book
 *
 * @apiDescription Adds a new book entry to the database.
 *
 * @apiName AddBook
 * @apiGroup Book
 *
 *
 * @apiSuccess {Object} entry The book object that was added.
 *
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


    class PostBook {
        constructor(
            public isbn13: String, authors: string[],
            originalPublicationYear: number,
            originalTitle: string,
            title: string,
            averageRating: number,
            ratingsCount: number,  
            ratings1: number,
            ratings2: number,
            ratings3: number,
            ratings4: number,
            ratings5: number,
            imageUrl: String,
            smallImageUrl: String,
            ) {}
    }


    const book = new PostBook(
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
    );
    // const newBook = {
    //     'isbn13':isbn13,
    //     'authors':authors,
    //     'original_publication_year': publication_year,
    //     'original_title': original_title,
    //     'title': title,
    //     'average_rating':rating_avg,
    //     'ratings_count':rating_count,
    //     'ratings_1':rating_1_star,
    //     'ratings_2':rating_2_star,
    //     'ratings_3':rating_3_star,
    //     'ratings_4':rating_4_star,
    //     'ratings_5':rating_5_star,
    //     'image_url':image_url, 
    //     'small_image_url':image_small_url
    // };

    const newBook = {
        'book_id': 2000,
        'isbn13': '9781234567890', // Random valid ISBN-13
        'authors': ['John Doe', 'Jane Smith'], // Random author names
        'original_publication_year': 2005, // Random valid year
        'original_title': 'Random Title', // Random title
        'title': 'Random Book Title', // Random book title
        'average_rating': 4.2, // Random average rating
        'ratings_count': 1234, // Random ratings count
        'ratings_1': 10, // Random 1-star ratings count
        'ratings_2': 20, // Random 2-star ratings count
        'ratings_3': 30, // Random 3-star ratings count
        'ratings_4': 40, // Random 4-star ratings count
        'ratings_5': 50, // Random 5-star ratings count
        'image_url': 'http://example.com/image.jpg', // Random image URL
        'small_image_url': 'http://example.com/small_image.jpg' // Random small image URL
    };


    

    try {
        const resp = await collections.books.insertOne(newBook);

        response.status(201).send({
            entry: resp,});

    } catch (error) {
        console.error('DB Query error on POST');
        console.error(error);
        response.status(500).send({
            message: 'Server error - contact support',
        });
    }
    // // Get the current max ID from the database
    // const maxIdResult = await pool.query('SELECT MAX(id) FROM BOOKS');
    // const newId = (maxIdResult.rows[0].max || 0) + 1;

    // const values = [
    //     newId,
    //     isbn13,
    //     authors,
    //     publication_year,
    //     original_title,
    //     title,
    //     rating_avg,
    //     rating_count,
    //     rating_1_star,
    //     rating_2_star,
    //     rating_3_star,
    //     rating_4_star,
    //     rating_5_star,
    //     image_url,
    //     image_small_url,
    // ];
    // const query =
    //     'INSERT INTO BOOKS(id, isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';

    // pool.query(query, values)
    //     .then((result) => {
    //         const book: Book = createBook(result.rows[0]);
    //         response.status(201).send({
    //             entry: book,
    //         });
    //     })
    //     .catch((error) => {
    //         if (
    //             error.detail != undefined &&
    //             (error.detail as string).endsWith('already exists.')
    //         ) {
    //             console.error('Book exists');
    //             response.status(400).send({
    //                 message: 'Book exists',
    //             });
    //         } else {
    //             //log the error
    //             console.error('DB Query error on POST');
    //             console.error(error);
    //             response.status(500).send({
    //                 message: 'server error - contact support',
    //             });
    //         }
        // });
});

/**
 * @api {delete} /isbn/:isbn Request to delete a book by ISBN
 *
 * @apiDescription Deletes a book entry based on the provided ISBN number.
 *
 * @apiName DeleteBookByISBN
 * @apiGroup Book
 *
 * @apiParam {String} isbn The ISBN of the book to delete (13-digit number).
 *
 * @apiSuccess {Object} entries The deleted book object.
 *
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

/**
 * @api {delete} /delete Request to delete multiple books by ID range
 *
 * @apiDescription Deletes books with IDs in the specified range.
 *
 * @apiName DeleteBooksByIDRange
 * @apiGroup Book
 *
 * @apiQuery {Number} startId The starting ID of the range.
 * @apiQuery {Number} endId The ending ID of the range.
 *
 * @apiSuccess {String} message "Deleted {number} books from ID {startId} to {endId}."
 *
 * @apiError (404: No books found) {String} message "No books found in the specified range."
 * @apiError (500: Server error) {String} message "Server error - contact support."
 */
bookRouter.delete(
    '/delete/:startId/:endId',
    mwValidIdQuery,
    async (request: Request, response: Response) => {
        const startId = request.query.startId as string;
        const endId = request.query.endId as string;

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
