import mongoose from 'mongoose';

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


// const bookSchema = new mongoose.Schema({
//     bookId: {
//       type: ObjectId,
//       required: true,
//       unique: true,
//     },
//     isbn13: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     authors: [String],
//     originalPublicationYear: Number,
//     originalTitle: String,
//     title: String,
//     averageRating: Number,
//     ratingsCount: Number,
//     ratings: {
//       ratings1: Number,
//       ratings2: Number,
//       ratings3: Number,
//       ratings4: Number,
//       ratings5: Number,
//     },
//     imageUrl: String,
//     smallImageUrl: String,
//   });


// const BookSchema = mongoose.model('Book', bookSchema);

// export { BookSchema }