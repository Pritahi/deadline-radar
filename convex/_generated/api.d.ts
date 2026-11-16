/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as autumn from "../autumn.js";
import type * as boards from "../boards.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as presence from "../presence.js";
import type * as scrape from "../scrape.js";
import type * as trackers from "../trackers.js";
import type * as turnstile from "../turnstile.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  autumn: typeof autumn;
  boards: typeof boards;
  crons: typeof crons;
  events: typeof events;
  presence: typeof presence;
  scrape: typeof scrape;
  trackers: typeof trackers;
  turnstile: typeof turnstile;
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
