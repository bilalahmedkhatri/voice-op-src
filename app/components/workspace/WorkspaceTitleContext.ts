"use client";

import { createContext, type Dispatch, type SetStateAction } from "react";

export interface WorkspaceTitle { pathname: string; title: string; }
export const WorkspaceTitleContext = createContext<Dispatch<SetStateAction<WorkspaceTitle | null>> | null>(null);
