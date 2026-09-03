import React from 'react';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Options, render } from '@react-email/render';
import { MailerOptions, TemplateAdapter } from '@nestjs-modules/mailer';

/**
 * ReactAdapter
 *
 * Template adapter that renders React components as email HTML.
 * Implements the TemplateAdapter interface from @nestjs-modules/mailer.
 *
 * @example
 * ```typescript
 * // In mail configuration
 * MailModule.forRoot({
 *   template: {
 *     dir: path.join(__dirname, 'templates/emails'),
 *     adapter: ReactAdapter.make({
 *       pretty: process.env.NODE_ENV !== 'production',
 *       plainText: true,
 *     }),
 *   },
 * })
 *
 * // Email template component (welcome.tsx)
 * interface WelcomeEmailProps {
 *   name: string;
 *   verificationUrl: string;
 * }
 *
 * export default function WelcomeEmail({ name, verificationUrl }: WelcomeEmailProps) {
 *   return (
 *     <Html>
 *       <Head />
 *       <Body>
 *         <Container>
 *           <Heading>Welcome, {name}!</Heading>
 *           <Text>Thanks for signing up.</Text>
 *           <Button href={verificationUrl}>Verify Email</Button>
 *         </Container>
 *       </Body>
 *     </Html>
 *   );
 * }
 *
 * // Sending email
 * await mailService.sendMail({
 *   to: user.email,
 *   subject: 'Welcome!',
 *   template: 'welcome',
 *   context: {
 *     name: user.name,
 *     verificationUrl: `https://example.com/verify?token=${token}`,
 *   },
 * });
 * ```
 */
export class ReactAdapter implements TemplateAdapter {
  /**
   * Render configuration options for HTML (styles will be inlined)
   */
  private htmlConfig: Options = {
    pretty: false,
  };

  /**
   * Whether to also generate a plain text version
   */
  private generatePlainText: boolean = false;

  /**
   * Create React adapter instance
   *
   * @param config - React email render options
   */
  constructor(config?: Options & { plainText?: boolean }) {
    if (config) {
      const { plainText, ...htmlOptions } = config;
      Object.assign(this.htmlConfig, htmlOptions);
      if (plainText !== undefined) {
        this.generatePlainText = plainText;
      }
    }
  }

  /**
   * Compile React template to HTML
   *
   * This method is called by the mail service to render templates.
   * It loads the React component, renders it with the provided context,
   * and returns the HTML string.
   *
   * @param mail - Mail object containing template and context
   * @param callback - Callback function to call after compilation
   * @param options - Mail options containing template directory
   */
  public compile(mail: any, callback: any, options: MailerOptions): void {
    const { context, template } = mail.data;

    // Extract template name and extension
    const templateExt = path.extname(template);
    const templateName = templateExt ? path.basename(template, templateExt) : template;

    // Resolve template directory (absolute or relative to configured dir)
    const templateDir = path.isAbsolute(template)
      ? path.dirname(template)
      : path.join(options.template?.dir || '', path.dirname(template));

    // If extension is provided, use it directly
    if (templateExt) {
      const templatePath = path.join(templateDir, templateName + templateExt);
      const templatePathURL = pathToFileURL(templatePath).href;

      import(templatePathURL)
        .then((tmplModule) => this.renderTemplate(tmplModule, template, context, mail, callback))
        .catch((error) => callback(error));
      return;
    }

    // Try multiple extensions in order: .tsx, .jsx, .js
    const extensions = ['.tsx', '.jsx', '.js'];
    this.tryLoadTemplate(
      templateDir,
      templateName,
      extensions,
      0,
      template,
      context,
      mail,
      callback,
    );
  }

  /**
   * Try to load template with different extensions
   *
   * @param templateDir - Template directory path
   * @param templateName - Template name without extension
   * @param extensions - Array of extensions to try
   * @param index - Current extension index
   * @param originalTemplate - Original template name for error messages
   * @param context - Template context
   * @param mail - Mail object
   * @param callback - Callback function
   *
   * @private
   */
  private tryLoadTemplate(
    templateDir: string,
    templateName: string,
    extensions: string[],
    index: number,
    originalTemplate: string,
    context: any,
    mail: any,
    callback: any,
  ): void {
    if (index >= extensions.length) {
      callback(
        new Error(
          `Template "${originalTemplate}" not found. Tried extensions: ${extensions.join(', ')}`,
        ),
      );
      return;
    }

    const ext = extensions[index];
    const templatePath = path.join(templateDir, templateName + ext);
    const templatePathURL = pathToFileURL(templatePath).href;

    import(templatePathURL)
      .then((tmplModule) =>
        this.renderTemplate(tmplModule, originalTemplate, context, mail, callback),
      )
      .catch(() => {
        // Try next extension
        this.tryLoadTemplate(
          templateDir,
          templateName,
          extensions,
          index + 1,
          originalTemplate,
          context,
          mail,
          callback,
        );
      });
  }

  /**
   * Render template module to HTML
   *
   * @param tmplModule - Loaded template module
   * @param template - Template name for error messages
   * @param context - Template context
   * @param mail - Mail object
   * @param callback - Callback function
   *
   * @private
   */
  private renderTemplate(
    tmplModule: any,
    template: string,
    context: any,
    mail: any,
    callback: any,
  ): void {
    try {
      // Extract default export (the React component)
      let Comp = tmplModule.default || tmplModule;

      // Handle ES modules that export the component as a named export
      if (Comp && typeof Comp === 'object' && !Comp.$$typeof) {
        // Try to find the actual component in the exports
        const exportKeys = Object.keys(Comp);
        const componentKey = exportKeys.find(
          (key) => typeof Comp[key] === 'function' || Comp[key]?.$$typeof,
        );
        if (componentKey) {
          Comp = Comp[componentKey];
        }
      }

      if (!Comp || (typeof Comp !== 'function' && !Comp.$$typeof)) {
        throw new Error(`Template "${template}" must export a React component`);
      }

      // Render React component to HTML (styles will be automatically inlined)
      const htmlPromise = render(React.createElement(Comp, context), this.htmlConfig);

      // Render plainText version if enabled
      const plainTextPromise = this.generatePlainText
        ? render(React.createElement(Comp, context), {
            ...this.htmlConfig,
            plainText: true,
          })
        : Promise.resolve(null);

      Promise.all([htmlPromise, plainTextPromise])
        .then(([html, plainText]) => {
          // Inject markup script if provided in context
          if (context?.markupScript) {
            html = this.injectMarkup(html, context.markupScript);
          }

          // Set rendered HTML in mail data
          mail.data.html = html;

          // Set plainText version if generated
          if (plainText) {
            mail.data.text = plainText;
          }

          // Call callback to continue with mail sending
          callback();
        })
        .catch((error) => callback(error));
    } catch (error: Error | any) {
      callback(error);
    }
  }

  /**
   * Inject markup script into HTML head
   *
   * Inserts Gmail structured data markup (JSON-LD) into the <head> section
   * of the rendered email HTML. If no <head> tag exists, it creates one.
   *
   * @param html - The rendered HTML string
   * @param markupScript - The markup script tag(s) to inject
   * @returns HTML with injected markup
   *
   * @private
   */
  private injectMarkup(html: string, markupScript: string): string {
    // Check if HTML has a <head> tag
    if (html.includes('<head>')) {
      // Inject markup after opening <head> tag
      return html.replace('<head>', `<head>\n${markupScript}`);
    }

    // Check if HTML has <html> tag
    if (html.includes('<html>')) {
      // Create head section with markup
      return html.replace('<html>', `<html>\n<head>\n${markupScript}\n</head>`);
    }

    // No html/head tags, wrap entire content
    return `<!DOCTYPE html>\n<html>\n<head>\n${markupScript}\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }
}
