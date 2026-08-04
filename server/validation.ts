import type { RequestHandler } from "express";
import { z } from "zod";
import { sendApiError } from "./api-errors.js";

const emptyQuerySchema = z.object({}).strict();

export const validateEmptyQuery: RequestHandler = (req, res, next) => {
  const parsed = emptyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendApiError(res, 400, "validation_error", {
      issues: parsed.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join("."),
      })),
    });
    return;
  }

  next();
};
