/**
 * @file babel.config.js
 * @description Babel config for the Expo-based React Native template.
 *
 *   Order matters:
 *
 *   1. `babel-preset-expo` — Expo's canonical preset, wraps the RN
 *      preset with Expo-specific transforms (Expo Router, Metro).
 *
 *   2. `@babel/plugin-proposal-decorators` (legacy) — required by
 *      `@stackra/container` for `@Module({...})`, `@Injectable()`,
 *      `@Inject(TOKEN)`. Matches TypeScript's `experimentalDecorators`.
 *
 *   3. `babel-plugin-transform-typescript-metadata` — emits
 *      `Reflect.metadata("design:*")` on decorated classes so
 *      `@stackra/container` can resolve constructor param types at
 *      runtime. Equivalent to TS's `emitDecoratorMetadata: true`.
 *
 *   4. `react-native-worklets/plugin` — REQUIRED by Reanimated 4 and
 *      MUST be the LAST plugin in the list. Without it, every
 *      `useSharedValue()` / `useAnimatedStyle()` hook throws at
 *      runtime. HeroUI Native + Pro use Reanimated 4 internally, so
 *      this plugin is not optional even if the app itself doesn't
 *      `import Animated` directly.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["@babel/plugin-proposal-decorators", { version: "legacy" }],
      "babel-plugin-transform-typescript-metadata",
      // MUST BE LAST — see docblock above.
      "react-native-worklets/plugin",
    ],
  };
};
