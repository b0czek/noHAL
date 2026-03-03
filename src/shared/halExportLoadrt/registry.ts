import { namesOrCountLoadrtStrategy } from "./namesOrCountStrategy";
import { namesOrNumChanLoadrtStrategy } from "./namesOrNumChanStrategy";
import type {
  LoadrtContext,
  LoadrtResult,
  LoadrtStrategy,
  LoadrtStrategyId,
} from "./types";

const loadrtStrategyRegistry: Record<LoadrtStrategyId, LoadrtStrategy> = {
  names_or_count: namesOrCountLoadrtStrategy,
  names_or_num_chan: namesOrNumChanLoadrtStrategy,
};

function strategyForContext(context: LoadrtContext): LoadrtStrategy {
  const strategyId = context.runtime?.loadrt?.strategy ?? "names_or_count";
  return loadrtStrategyRegistry[strategyId] ?? namesOrCountLoadrtStrategy;
}

export function interpolateLoadrt(context: LoadrtContext): LoadrtResult {
  return strategyForContext(context)(context);
}
