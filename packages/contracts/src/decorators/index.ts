/**
 * @file index.ts
 * @module @stackra/contracts/decorators
 * @description Public API barrel for cross-package decorators.
 *   NOTE: The five DI decorators (Module, Injectable, Inject, Optional,
 *   Global) live permanently in `@stackra/container` per ADR-0059.
 *   Consumer-level decorators (@OnEvent, @Cacheable, @AsController, etc.)
 *   live in `@stackra/decorators/<consumer>/` per the promotion rules.
 *   This folder is for metadata-key contracts and discovery keys only.
 */
