import { IRatings } from './rating.model';
import { IUrlIcon } from './urlicon.model';

export interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}
