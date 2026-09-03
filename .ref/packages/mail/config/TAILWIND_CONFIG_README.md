# Tailwind CSS Configuration for Email Templates

This directory contains example Tailwind CSS configurations optimized for email clients.

## 📋 Overview

Email clients have limited CSS support compared to modern web browsers. This configuration is specifically designed to work reliably across major email clients including Gmail, Outlook, Apple Mail, and others.

## 🎯 Key Features

### ✅ Email-Safe Configuration

- **Pixel-based units**: Uses `px` instead of `rem` (email clients don't support rem)
- **Web-safe fonts**: System fonts with proper fallbacks
- **Tested color palette**: Brand colors with accessibility in mind
- **Responsive breakpoints**: Mobile-first approach for responsive emails
- **Social media colors**: Pre-configured brand colors for social icons

### ⚠️ Email Client Limitations

Be aware of these limitations when styling emails:

- ❌ No `rem`, `em`, `vh`, `vw` units (use `px`)
- ❌ Limited CSS transforms and animations
- ❌ Inconsistent `box-shadow` support (especially Outlook)
- ❌ No flexbox/grid in many clients (use tables for layout)
- ❌ Limited media query support (test thoroughly)

## 📦 Usage

### Option 1: Use the Full Configuration

```typescript
import { tailwindEmailConfig } from './config/tailwind.config.example';

export const mailConfig: IMailConfig = {
  transport: MailTransportType.SMTP,
  from: 'noreply@example.com',
  // ... other config
  tailwindConfig: tailwindEmailConfig,
};
```

### Option 2: Use the Minimal Configuration

```typescript
import { minimalEmailTailwindConfig } from './config/tailwind.config.example';

export const mailConfig: IMailConfig = {
  // ... other config
  tailwindConfig: minimalEmailTailwindConfig,
};
```

### Option 3: Create Your Custom Configuration

```typescript
import type { TailwindConfig } from '@react-email/components';

const customConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        brand: '#ff6b6b',
        accent: '#4ecdc4',
      },
      spacing: {
        // Use px values
        '72': '288px',
      },
    },
  },
};

export const mailConfig: IMailConfig = {
  // ... other config
  tailwindConfig: customConfig,
};
```

## 🎨 Using Tailwind Classes in Email Templates

```tsx
import { EmailProvider } from '@resources/providers';

export function WelcomeEmail() {
  return (
    <EmailProvider>
      {/* Container with max width */}
      <div className="max-w-2xl mx-auto">
        {/* Header with brand color */}
        <div className="bg-brand-primary text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
        </div>

        {/* Content section */}
        <div className="bg-white p-6">
          <p className="text-base text-neutral-700 mb-4">Thank you for joining us.</p>

          {/* Button with success color */}
          <a
            href="https://example.com"
            className="inline-block bg-success text-white px-6 py-3 rounded-md font-semibold"
          >
            Get Started
          </a>
        </div>

        {/* Footer with social colors */}
        <div className="bg-neutral-100 p-6 text-center">
          <a href="#" className="text-social-facebook mx-2">
            Facebook
          </a>
          <a href="#" className="text-social-twitter mx-2">
            Twitter
          </a>
        </div>
      </div>
    </EmailProvider>
  );
}
```

## 🎯 Available Color Palettes

### Brand Colors

```tsx
bg - brand - primary; // Indigo #4f46e5
bg - brand - secondary; // Purple #7c3aed
bg - brand - accent; // Cyan #06b6d4
bg - brand - dark; // Slate #1e293b
bg - brand - light; // Slate #f8fafc
```

### Semantic Colors

```tsx
bg - success; // Green #10b981
bg - success - light; // Light green background
bg - success - dark; // Dark green text

bg - error; // Red #ef4444
bg - error - light; // Light red background
bg - error - dark; // Dark red text

bg - warning; // Amber #f59e0b
bg - info; // Blue #3b82f6
```

### Social Media Colors

```tsx
text - social - facebook; // #1877f2
text - social - twitter; // #1da1f2
text - social - linkedin; // #0a66c2
text - social - instagram; // #e4405f
text - social - youtube; // #ff0000
text - social - github; // #181717
text - social - discord; // #5865f2
```

## 📏 Spacing Scale

All spacing uses pixel values for email compatibility:

```tsx
p - 4; // 16px padding
p - 6; // 24px padding
p - 8; // 32px padding
m - 4; // 16px margin
gap - 4; // 16px gap
```

## 🔤 Typography

### Font Sizes

```tsx
text-xs    // 12px
text-sm    // 14px
text-base  // 16px (default)
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
text-3xl   // 30px
text-4xl   // 36px
```

### Font Weights

```tsx
font - normal; // 400
font - medium; // 500
font - semibold; // 600
font - bold; // 700
```

## 📱 Responsive Breakpoints

```tsx
sm:    // 480px - Mobile landscape
md:    // 600px - Tablets
lg:    // 768px - Desktop
xl:    // 1024px - Large desktop
```

**Note**: Media query support varies by email client. Always test responsive emails across multiple clients.

## 🧪 Testing Recommendations

Always test your email templates in:

- ✅ Gmail (web, iOS, Android)
- ✅ Outlook (desktop, web, mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Proton Mail

Use tools like:

- [Litmus](https://www.litmus.com/)
- [Email on Acid](https://www.emailonacid.com/)
- [React Email Preview](https://react.email/)

## 📚 Resources

- [React Email Documentation](https://react.email/docs/components/tailwind)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Email Client CSS Support](https://www.caniemail.com/)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-design/)

## 💡 Best Practices

1. **Keep it simple**: Use basic CSS properties that work across all clients
2. **Test extensively**: Email clients render CSS differently
3. **Use tables for layout**: Flexbox/Grid support is limited
4. **Inline critical styles**: React Email handles this automatically
5. **Provide fallbacks**: Always have a plain text version
6. **Mobile-first**: Most emails are opened on mobile devices
7. **Optimize images**: Use appropriate file sizes and formats
8. **Avoid fancy CSS**: Transforms, animations, and advanced selectors often fail

## 🔄 Updating Configuration

To modify the configuration:

1. Copy `tailwind.config.example.ts` to your own file
2. Customize colors, spacing, or other theme values
3. Import and use in your `mail.config.ts`
4. Test thoroughly across email clients

```typescript
// custom-tailwind.config.ts
export const myCustomConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        // Your custom colors
      },
    },
  },
};
```
