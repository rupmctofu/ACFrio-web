/**
 * The ticker feed: data-derived headlines plus the news written from the
 * squad's own chat. The order is shuffled on every load, so a reader who comes
 * back does not see the same headline in the same place; the data-derived ones
 * are no longer pinned to the front for the same reason.
 * Every item is a joke the squad tells about itself.
 */
import news from "./news.json";
import { derivedNews } from "./news-derived";

/** Fisher-Yates, so every headline can land anywhere. */
const shuffled = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const newsItems = () => shuffled([...derivedNews(), ...news.items]);

export const newsTags = () => [...new Set(newsItems().map((item) => item.tag))];
