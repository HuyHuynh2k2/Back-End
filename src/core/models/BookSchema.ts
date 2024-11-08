

import { ObjectId } from "mongodb";

export default class Book {
    constructor(public bookId: ObjectId,
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