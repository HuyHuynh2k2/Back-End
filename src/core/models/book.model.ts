import { IRatings } from './ratings.model';
import { IUrlIcon } from './urlicon.model';

export interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;

    constructor(isbn13: number, authors: string, publication: number, original_title: string, title: string, ratings: IRatings, icons: IUrlIcon): {
      isbn13: number
    }
}
