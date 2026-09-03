# Vite & HeroUI Template

This is a template for creating applications using Vite and HeroUI (v3).

[Try it on CodeSandbox](https://githubbox.com/heroui-inc/vite-template)

## Technologies Used

- [Vite](https://vitejs.dev/guide/)
- [HeroUI v3](https://heroui.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Tailwind Variants](https://tailwind-variants.org)
- [TypeScript](https://www.typescriptlang.org)

## How to Use

To clone the project, run the following command:

```bash
git clone https://github.com/heroui-inc/vite-template.git
```

### Install dependencies

The repository uses pnpm as the supported package manager. Example:

```bash
pnpm install
```

### Run the development server

```bash
pnpm dev
```

## License

Licensed under the
[MIT license](https://github.com/heroui-inc/vite-template/blob/main/LICENSE).

## Frontend standards

This application uses HeroUI v3 + Tailwind CSS v4 through the official Vite
plugin. It intentionally has no `postcss.config.*` or Tailwind JavaScript
configuration. Global CSS imports `tailwindcss` before `@heroui/styles`.

Browser E2E tests live under `e2e/` and run through Playwright.
