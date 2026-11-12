/**
 * Selectors over the vestuario satire feed (src/data/news.json).
 *
 * Every item is invented on purpose: the owner asked for joke news about the
 * squad. The `disclaimer` travels with the data and the card shows it, so no
 * headline can be mistaken for reporting.
 */
import news from "./news.json";

export const newsDisclaimer = news.disclaimer;

/** Newest first: the JSON is authored in reading order, newest at the top. */
export const newsItems = () => news.items;

export const newsTags = () => [...new Set(news.items.map((item) => item.tag))];
