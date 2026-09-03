import type { ArticleCard } from './article-card.interface';

/**
 * Props for ArticleTwoCards component.
 *
 * Header text with two article cards side by side.
 */
export interface ArticleTwoCardsProps {
  /**
   * Main heading text.
   */
  heading: string;

  /**
   * Subheading/description text.
   */
  subheading: string;

  /**
   * Two article cards to display.
   */
  cards: [ArticleCard, ArticleCard];

  /**
   * Optional additional CSS classes.
   */
  className?: string;
}
