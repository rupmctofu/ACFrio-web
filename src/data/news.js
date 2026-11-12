/**
 * The ticker feed: data-derived headlines first (they track the season on every
 * sync), then the evergreen vestuario jokes. Every item is still presented as
 * humour; the disclaimer travels with the data.
 */
import news from "./news.json";
import { derivedNews } from "./news-derived";

export const newsDisclaimer = news.disclaimer;

export const newsItems = () => [...derivedNews(), ...news.items];

export const newsTags = () => [...new Set(newsItems().map((item) => item.tag))];
