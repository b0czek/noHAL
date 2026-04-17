import process from "node:process";
import { runHaldiffCli } from "./cli";
import { createNodeIo } from "./nodeIo";

const invocationCwd = process.env.INIT_CWD ?? process.cwd();
const exitCode = await runHaldiffCli(process.argv.slice(2), {
  io: createNodeIo(invocationCwd),
});

process.exitCode = exitCode;
