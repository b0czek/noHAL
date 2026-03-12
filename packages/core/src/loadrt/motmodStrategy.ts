import type {
  LoadrtContext,
  LoadrtImportContext,
  LoadrtImportResult,
  LoadrtResult,
  LoadrtStrategy,
} from "./types";

function exportMotmod(context: LoadrtContext): LoadrtResult {
  const warnings: string[] = [];
  const args: string[] = [];
  if (context.instancePaths.length > 1) {
    warnings.push(
      `Component 'motmod' expected a single instance; exporting one shared loadrt line`,
    );
  }
  const halThreadByName = new Map(
    (context.project?.halThreads ?? []).map((thread) => [thread.name, thread]),
  );
  const servoThread = halThreadByName.get("servo-thread");
  const baseThread = halThreadByName.get("base-thread");
  if (!servoThread && context.project) {
    warnings.push(
      `motmod export could not find HAL thread 'servo-thread'; omitting servo/traj period arguments`,
    );
  }
  if (servoThread) {
    const servoPeriodNs = Math.max(1, Math.round(servoThread.periodNs));
    args.push(`servo_period_nsec=${servoPeriodNs}`);
    const trajPeriodNs = Math.max(
      0,
      Math.round(context.project?.motmod?.trajPeriodNs ?? 0),
    );
    if (trajPeriodNs > 0) {
      args.push(`traj_period_nsec=${trajPeriodNs}`);
    }
  }
  if (baseThread) {
    args.push(
      `base_period_nsec=${Math.max(1, Math.round(baseThread.periodNs))}`,
    );
    args.push(`base_thread_fp=${baseThread.floatMode === "nofp" ? 0 : 1}`);
  }
  if (context.project?.motmod) {
    args.push(
      `num_joints=${Math.max(1, Math.round(context.project.motmod.numJoints))}`,
    );
    args.push(
      `num_dio=${Math.max(0, Math.round(context.project.motmod.numDio))}`,
    );
    args.push(
      `num_aio=${Math.max(0, Math.round(context.project.motmod.numAio))}`,
    );
    args.push(
      `num_spindles=${Math.max(1, Math.round(context.project.motmod.numSpindles))}`,
    );
    args.push(
      `num_misc_error=${Math.max(0, Math.round(context.project.motmod.numMiscError))}`,
    );
  }
  args.push(...context.extraArgs);
  return {
    lines: [`loadrt ${context.componentName} ${args.join(" ")}`.trim()],
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

function importMotmod(context: LoadrtImportContext): LoadrtImportResult {
  const parseIntArg = (key: string): number | undefined => {
    const value = Number.parseInt(context.args[key] ?? "", 10);
    return Number.isFinite(value) ? value : undefined;
  };
  const numJoints = parseIntArg("num_joints");
  const numDio = parseIntArg("num_dio");
  const numAio = parseIntArg("num_aio");
  const numSpindles = parseIntArg("num_spindles");
  const numMiscError = parseIntArg("num_misc_error");
  const trajPeriodNs = parseIntArg("traj_period_nsec");
  const motmod =
    numJoints !== undefined ||
    numDio !== undefined ||
    numAio !== undefined ||
    numSpindles !== undefined ||
    numMiscError !== undefined ||
    trajPeriodNs !== undefined
      ? {
          ...(numJoints !== undefined ? { numJoints } : {}),
          ...(numDio !== undefined ? { numDio } : {}),
          ...(numAio !== undefined ? { numAio } : {}),
          ...(numSpindles !== undefined ? { numSpindles } : {}),
          ...(numMiscError !== undefined ? { numMiscError } : {}),
          ...(trajPeriodNs !== undefined ? { trajPeriodNs } : {}),
        }
      : undefined;
  return {
    instancePaths: [],
    ...(motmod
      ? {
          events: [{ topic: "project.motmod", payload: motmod }],
        }
      : {}),
  };
}

export const motmodLoadrtStrategy: LoadrtStrategy = {
  export: exportMotmod,
  import: importMotmod,
};
