import { IRatings } from './rating.module';
import { IUrlIcon } from './urlicon.module';

export interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}
