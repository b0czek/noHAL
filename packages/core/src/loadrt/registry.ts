import { motmodLoadrtStrategy } from "./motmodStrategy";
import { namesOrCountLoadrtStrategy } from "./namesOrCountStrategy";
import { namesOrNumChanLoadrtStrategy } from "./namesOrNumChanStrategy";
import type {
  LoadrtContext,
  LoadrtImportContext,
  LoadrtImportResult,
  LoadrtResult,
  LoadrtStrategy,
  LoadrtStrategyId,
} from "./types";

const loadrtStrategyRegistry: Record<LoadrtStrategyId, LoadrtStrategy> = {
  motmod: motmodLoadrtStrategy,
  names_or_count: namesOrCountLoadrtStrategy,
  names_or_num_chan: namesOrNumChanLoadrtStrategy,
};

function strategyForId(strategyId: LoadrtStrategyId): LoadrtStrategy {
  return loadrtStrategyRegistry[strategyId] ?? namesOrCountLoadrtStrategy;
}

function strategyForContext(context: LoadrtContext): LoadrtStrategy {
  const strategyId = context.runtime?.loadrt?.strategy ?? "names_or_count";
  return strategyForId(strategyId);
}

export function interpolateLoadrt(context: LoadrtContext): LoadrtResult {
  return strategyForContext(context).export(context);
}

export function interpolateLoadrtByStrategy(
  strategyId: LoadrtStrategyId,
  context: LoadrtContext,
): LoadrtResult {
  return strategyForId(strategyId).export(context);
}

export function routeLoadrtImportStrategyId(
  context: LoadrtImportContext,
): LoadrtStrategyId {
  if (context.componentName === "motmod") return "motmod";
  const hasNumChan = context.args.num_chan !== undefined;
  const hasCount = context.args.count !== undefined;
  if (hasNumChan && !hasCount) return "names_or_num_chan";
  return "names_or_count";
}

export interface LoadrtImportDispatchResult extends LoadrtImportResult {
  strategyId: LoadrtStrategyId;
}

export function interpolateLoadrtImport(
  context: LoadrtImportContext & { strategyIdHint?: LoadrtStrategyId },
): LoadrtImportDispatchResult {
  const strategyId =
    context.strategyIdHint ?? routeLoadrtImportStrategyId(context);
  const result = strategyForId(strategyId).import(context);
  return {
    strategyId,
    instancePaths: result.instancePaths,
    ...(result.warnings?.length ? { warnings: result.warnings } : {}),
    ...(result.events?.length ? { events: result.events } : {}),
  };
}
