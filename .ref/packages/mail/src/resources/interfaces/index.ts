/**
 * Email Template Interfaces.
 *
 * This module exports all TypeScript interfaces and type definitions
 * used across email template components. Interfaces are organized by
 * component categories for better maintainability.
 *
 * @module interfaces
 */

// Export base component interfaces
export type {
  // Common interfaces
  Logo,
  MenuItem,
  SocialLink,
  ImageConfig,
  CompanyInfo,
  ContactInfo,
  Author,

  // Component interfaces
  ButtonProps,
  TextProps,
  HeadingProps,
  AvatarProps,
  CodeInlineProps,
  DividerProps,
  LinkProps,
  ContainerProps,
  SectionProps,
  ImageProps,

  // Wrapper interfaces
  HtmlProps,
  HeadProps,
  BodyProps,
  PreviewProps,
  RowProps,
  ColumnProps,
  FontProps,
  MarkdownProps,
  CodeBlockProps,
  WebFont,
} from './base';

// Export common interfaces
export type {
  Logo as CommonLogo,
  MenuItem as CommonMenuItem,
  SocialLink as CommonSocialLink,
  ImageConfig as CommonImageConfig,
  CompanyInfo as CommonCompanyInfo,
  ContactInfo as CommonContactInfo,
  Author as CommonAuthor,
} from './common';

// Export layout interfaces (headers, footers, layouts)
export type {
  HeaderCenteredMenuProps,
  HeaderSideMenuProps,
  HeaderSocialIconsProps,
  FooterOneColumnProps,
  FooterTwoColumnsProps,
  LayoutProps,
  LayoutWithHeaderFooterProps,
} from './layout';

// Export business interfaces (marketing, ecommerce, pricing, features)
export type {
  BentoGridProduct,
  BentoGridProps,
  Product,
  ProductSingleProps,
  ProductImageLeftProps,
  ProductGridProps,
  CartItem,
  ProductCheckoutProps,
  PricingPlan,
  PricingSimpleProps,
  PricingTwoTiersProps,
  FeatureItem,
  NumberedFeatureItem,
  FeaturesWithHeaderProps,
} from './business';

// Export content interfaces (articles, galleries, lists)
export type {
  ArticleWithImageProps,
  ArticleImageRightProps,
  ArticleImageBackgroundProps,
  ArticleCard,
  ArticleTwoCardsProps,
  ArticleSingleAuthorProps,
  ArticleMultipleAuthorsProps,
  GalleryItem,
  GalleryWithHeaderProps,
  ListItem,
  ListItemWithImage,
  ListSimpleProps,
  ListWithImageProps,
} from './content';

// Export interactive interfaces (feedback, stats, testimonials)
export type {
  FeedbackRatingProps,
  FeedbackSurveyProps,
  ReviewRatingBreakdown,
  FeedbackReviewsProps,
  StatItem,
  StatsSimpleProps,
  SteppedStatItem,
  StatsSteppedProps,
  TestimonialSimpleProps,
  TestimonialLargeAvatarProps,
} from './interactive';

// Export provider interfaces
export type {
  EmailProviderProps,
  TailwindProviderProps,
  IntlProviderProps,
  ProviderProps,
} from './providers';
