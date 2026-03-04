import type { NoHALProject } from "../types";
import type { RuntimeSections } from "./runtime";

interface RenderInput {
  project: NoHALProject;
  runtimeSections: RuntimeSections;
  mainSetpLines: string[];
  mainNetLines: string[];
  postguiSetpLines: string[];
  postguiNetLines: string[];
}

export function renderHalOutput({
  project,
  runtimeSections,
  mainSetpLines,
  mainNetLines,
  postguiSetpLines,
  postguiNetLines,
}: RenderInput): { text: string; postguiText?: string } {
  const lines: string[] = [];
  lines.push(`# NoHAL HAL export`);
  lines.push(
    `# Target LinuxCNC ${project.target.linuxcncVersion} (${project.target.platform})`,
  );
  lines.push(`# Project: ${project.name}`);
  lines.push(`#`);
  lines.push(`# Notes:`);
  lines.push(
    `# - components with component.loadCommand emit that line verbatim and skip generated loadrt for that component.`,
  );
  lines.push(
    `# - addf is emitted per thread and expanded from per-sheet queues (sheet.hal.addfQueue), with subsheets acting as ordered blocks.`,
  );
  lines.push(
    `# - nodes marked exportStage=postgui emit setp/net lines in a separate postgui output file.`,
  );
  lines.push("");
  lines.push(`# Runtime`);
  if (
    runtimeSections.customLoadLines.length === 0 &&
    runtimeSections.loadrtLines.length === 0 &&
    runtimeSections.addfLines.length === 0 &&
    runtimeSections.runtimeSummaryLines.length === 0
  ) {
    lines.push("# (no runtime component actions generated)");
    lines.push("");
  } else {
    if (runtimeSections.customLoadLines.length > 0) {
      lines.push(`# custom load`);
      lines.push(...runtimeSections.customLoadLines);
      lines.push("");
    }
    if (runtimeSections.loadrtLines.length > 0) {
      lines.push(`# loadrt`);
      lines.push(...runtimeSections.loadrtLines);
      lines.push("");
    }
    if (runtimeSections.loadusrLines.length > 0) {
      lines.push(`# loadusr`);
      lines.push(...runtimeSections.loadusrLines);
      lines.push("");
    }
    if (runtimeSections.addfLines.length > 0) {
      lines.push(`# addf`);
      lines.push(...runtimeSections.addfLines);
      lines.push("");
    }
    if (runtimeSections.runtimeSummaryLines.length > 0) {
      lines.push(...runtimeSections.runtimeSummaryLines);
      lines.push("");
    }
  }
  if (mainSetpLines.length > 0) {
    lines.push(`# Parameters`);
    lines.push(...mainSetpLines);
    lines.push("");
  }
  lines.push(`# Signals`);
  if (mainNetLines.length === 0) {
    lines.push("# (no nets exported)");
  } else {
    lines.push(...mainNetLines);
  }
  lines.push("");

  const hasPostguiOutput =
    postguiSetpLines.length > 0 || postguiNetLines.length > 0;
  let postguiText: string | undefined;
  if (hasPostguiOutput) {
    const postguiLines: string[] = [];
    postguiLines.push(`# NoHAL POSTGUI HAL export`);
    postguiLines.push(
      `# Target LinuxCNC ${project.target.linuxcncVersion} (${project.target.platform})`,
    );
    postguiLines.push(`# Project: ${project.name}`);
    postguiLines.push(`#`);
    postguiLines.push(`# For use with [HAL]POSTGUI_HALFILE.`);
    postguiLines.push("");
    if (postguiSetpLines.length > 0) {
      postguiLines.push(`# Parameters`);
      postguiLines.push(...postguiSetpLines);
      postguiLines.push("");
    }
    postguiLines.push(`# Signals`);
    if (postguiNetLines.length === 0) {
      postguiLines.push("# (no nets exported)");
    } else {
      postguiLines.push(...postguiNetLines);
    }
    postguiLines.push("");
    postguiText = `${postguiLines.join("\n")}\n`;
  }

  return {
    text: `${lines.join("\n")}\n`,
    ...(postguiText ? { postguiText } : {}),
  };
}
