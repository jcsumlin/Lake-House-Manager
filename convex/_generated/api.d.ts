/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as contacts from "../contacts.js";
import type * as dashboard from "../dashboard.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as maintenance from "../maintenance.js";
import type * as memberships from "../memberships.js";
import type * as properties from "../properties.js";
import type * as stays from "../stays.js";
import type * as taskTemplates from "../taskTemplates.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  announcements: typeof announcements;
  auth: typeof auth;
  calendar: typeof calendar;
  contacts: typeof contacts;
  dashboard: typeof dashboard;
  documents: typeof documents;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/permissions": typeof lib_permissions;
  maintenance: typeof maintenance;
  memberships: typeof memberships;
  properties: typeof properties;
  stays: typeof stays;
  taskTemplates: typeof taskTemplates;
  tasks: typeof tasks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
