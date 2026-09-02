import { z } from "zod";

export const permissionSchema = z.string().regex(/^[a-z0-9][a-z0-9._:-]{1,199}$/);
