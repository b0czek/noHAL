import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import { expectErr, expectOk } from "../testUtils/result";
import { addMesaHost, setMesaConnectorCard } from "./edit";

describe("Mesa edit validation", () => {
  it("rejects connector assignments for unknown host connectors", () => {
    const project = createEmptyProject("Mesa Invalid Connector");
    const hostId = expectOk(addMesaHost(project, "7i92t")).data;

    expect(
      expectErr(setMesaConnectorCard(project, hostId, "p3", "7i77")),
    ).toEqual({
      code: "not-found",
      cause: "mesa-connector",
    });
    expect(project.mesa?.hosts[0]?.connectors ?? []).toEqual([]);
  });
});
