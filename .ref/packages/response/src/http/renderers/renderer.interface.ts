/**
 * @file renderer.interface.ts
 * @module @stackra/nestjs-response/http/renderers
 * @description Interface for content renderers that serialize response envelopes
 *   into different output formats (JSON, XML, CSV, etc.).
 */

import type { IResponseEnvelope } from '../../interfaces/response-envelope.interface';
import type { IRendererResult } from '../../interfaces/renderer-result.interface';
