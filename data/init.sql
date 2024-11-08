-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public

CREATE TABLE Demo (DemoID SERIAL PRIMARY KEY,
                        Priority INT,
                        Name TEXT NOT NULL UNIQUE,
                        Message TEXT
);

CREATE TABLE Account (Account_ID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Username VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Phone VARCHAR(15) NOT NULL UNIQUE,
                      Account_Role int NOT NULL
);

CREATE TABLE BOOKS (id INT PRIMARY KEY,
        isbn13 BIGINT,
        publication_year INT,
        original_title TEXT,
        title TEXT,
        rating_avg FLOAT,
        rating_count INT,
        rating_1_star INT,
        rating_2_star INT,
        rating_3_star INT,
        rating_4_star INT,
        rating_5_star INT,
        image_url TEXT,
        image_small_url TEXT
    );

CREATE TABLE Authors (
    Author_ID TEXT PRIMARY KEY,
    Author TEXT
);

CREATE TABLE BookAuthors (
    isbn INT,
    Author_ID TEXT,
    FOREIGN KEY (BookID) REFERENCES Books(isbn13) ON DELETE CASCADE,
	FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID) ON DELETE CASCADE
);

COPY books
FROM '/docker-entrypoint-initdb.d/books.csv'
DELIMITER ','
CSV HEADER;

COPY Authors
FROM '/docker-entrypoint-initdb.d/Authors.csv'
DELIMITER ','
CSV HEADER;

COPY BookAuthors
FROM '/docker-entrypoint-initdb.d/BookAuthors.csv'
DELIMITER ','
CSV HEADER;