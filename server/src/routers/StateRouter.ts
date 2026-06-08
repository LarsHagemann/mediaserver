import { Router } from "express";
import { apiHandler } from "../ApiHandler.js";
import { services } from "../DefaultDiContainer.js";
import type { BackendState } from "../state/BackendStateRepository.js";
import { BackendStateService } from "../state/BackendStateService.js";
import { requirePermission } from "../auth/requirePermission.js";

export const stateRouter = Router();

export type ApiBackendState = BackendState;

stateRouter.get(
  "/",
  requirePermission("admin:state"),
  apiHandler<ApiBackendState>(async ({ diContainer }) => {
    const backendStateService = diContainer.get<BackendStateService>(
      services.backendState,
    );
    const state = await backendStateService.getBackendState();
    return {
      status: 200,
      body: state,
    };
  }),
);
