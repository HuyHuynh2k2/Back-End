import { IBook, IRatings, IUrlIcon } from '../../core/models';

class Book implements IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
    constructor(
        isbn13: number,
        authors: string,
        publication: number,
        original_title: string,
        title: string,
        ratings: IRatings,
        icons: IUrlIcon
    ) {
        (this.isbn13 = isbn13),
            (this.authors = authors),
            (this.publication = publication),
            (this.original_title = original_title),
            (this.title = title),
            (this.ratings = ratings),
            (this.icons = icons);
    }
    ['constructor'](
        isbn13: number,
        authors: string,
        publication: number,
        original_title: string,
        title: string,
        ratings: IRatings,
        icons: IUrlIcon
    ): { isbn13: number } {
        throw new Error('Method not implemented.');
    }
}

class Ratings implements IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;

    constructor(
        average: number,
        count: number,
        rating_1: number,
        rating_2: number,
        rating_3: number,
        rating_4: number,
        rating_5: number
    ) {
        (this.average = average),
            (this.count = count),
            (this.rating_1 = rating_1),
            (this.rating_2 = rating_2),
            (this.rating_3 = rating_3),
            (this.rating_4 = rating_4),
            (this.rating_5 = rating_5);
    }
}

class UrlIcon implements IUrlIcon {
  large: string;
  small: string;

  constructor(large: string,
    small: string){
      this.large = large,
      this.small = small
    }
}
export {Book, Ratings, UrlIcon}
