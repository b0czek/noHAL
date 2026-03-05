export const en = {
  "app.defaultProjectName": "NoHAL Project",

  "common.close": "Close",
  "common.refresh": "Refresh",
  "common.back": "Back",
  "common.remove": "remove",
  "common.name": "Name",
  "common.signalName": "Signal Name",
  "common.text": "Text",
  "common.scope": "Scope",
  "common.direction": "Direction",
  "common.type": "Type",
  "common.rotation": "Rotation",
  "common.status": "Status",
  "common.file": "File",
  "common.project": "Project",
  "common.unsaved": "(unsaved)",
  "common.unspecified": "(unspecified)",
  "common.unknown": "unknown",
  "common.place": "Place",
  "common.up": "Up",
  "common.down": "Down",
  "common.updated": "Updated {time}",

  "landing.brandSubtitle": "Visual HAL IDE for LinuxCNC",
  "landing.title": "Pick a project and get to work.",
  "landing.copy":
    "Open an existing project folder or create a new project and jump into the editor only when you are ready.",
  "landing.newProject": "New Project",
  "landing.openProject": "Open Project",
  "landing.recentProjects": "Recent Projects",
  "landing.loadingRecentProjects": "Loading recent projects...",
  "landing.noRecentProjectsHint":
    "No recent projects yet. Create a blank project, import a machine configuration, or open an existing project.",
  "landing.targetLinuxCncVersion": "Target LinuxCNC version",
  "landing.importedMachineStatus": "Imported machine configuration{suffix}",

  "topbar.goToLanding": "Go to landing page",
  "topbar.openProject": "Open project",
  "topbar.saveProject": "Save project",
  "topbar.undo": "Undo",
  "topbar.redo": "Redo",
  "topbar.build": "Build",
  "topbar.projectSettings": "Project Settings",
  "topbar.componentStore": "Component Store",
  "topbar.addSubsheet": "+ Subsheet",
  "topbar.addText": "+ Text",
  "topbar.addPort": "+ Port",
  "topbar.addLabel": "+ Label",
  "topbar.inPortBit": "In Port (bit)",
  "topbar.outPortBit": "Out Port (bit)",
  "topbar.ioPortFloat": "IO Port (float)",
  "topbar.localLabel": "Local Label",
  "topbar.globalLabel": "Global Label",

  "canvas.ariaWorkspace": "Canvas workspace",
  "canvasContext.selection": "Selection",
  "canvasContext.component": "Component",
  "canvasContext.subsheet": "Subsheet",
  "canvasContext.label": "Label",
  "canvasContext.comment": "Text",
  "canvasContext.sheetPort": "Sheet Port",
  "canvasContext.connection": "Connection",
  "canvasContext.waypoint": "Waypoint",
  "canvasContext.putEverythingIntoSubsheet": "Into Subsheet",
  "canvasContext.removeConnection": "Remove Connection",
  "canvasContext.deleteWaypoint": "Delete Waypoint",

  "canvasComponentMenu.ariaLabel": "Add Component",
  "canvasComponentMenu.title": "Add Component",
  "canvasComponentMenu.filterPlaceholder": "Filter components...",
  "canvasComponentMenu.empty": "No matching components",
  "canvasComponentMenu.itemTitle": "{name} ({pins} pins)",
  "canvasComponentMenu.itemMeta": "{source} • {pins} pins",

  "componentSearch.ariaLabel": "Component Search",
  "componentSearch.title": "Find Component",
  "componentSearch.subtitle": "Scope: {scope}",
  "componentSearch.scope.sheet": "Current sheet",
  "componentSearch.scope.project": "Whole project",
  "componentSearch.placeholder": "Search component instances in {scope}...",
  "componentSearch.resultsCount": "{count} match(es)",
  "componentSearch.sheetMeta": "Sheet: {sheet}",
  "componentSearch.noResults": "No matching components.",

  "componentDialog.ariaLabel": "Component Settings",
  "componentDialog.title": "Component Settings",
  "componentDialog.instance": "Instance",
  "componentDialog.instanceName": "Instance Name",
  "componentDialog.instanceNameLocked":
    "Instance name is fixed by component runtime naming rules.",
  "componentDialog.halComponent": "HAL Component",
  "componentDialog.source": "Source",
  "componentDialog.runtime": "Runtime",
  "componentDialog.exportStage": "Export Stage",
  "componentDialog.exportStageMain": "Main HALFILE",
  "componentDialog.exportStagePostgui": "POSTGUI_HALFILE",
  "componentDialog.exportStageLockedPostgui":
    "Export stage is fixed by component definition.",
  "componentDialog.functions": "Realtime Functions (addf)",
  "componentDialog.noFunctions": "No function metadata.",
  "componentDialog.functionDefault": "_ (default)",
  "componentDialog.functionAddf": "addf",
  "componentDialog.parameters": "Parameters",
  "componentDialog.noParameters": "No parameters.",
  "componentDialog.instanceConfig": "Instance Configuration",
  "componentDialog.noInstanceConfig": "No per-instance configuration fields.",
  "componentDialog.pinInitialValues": "Pin Initial Values (setp)",
  "componentDialog.noPins": "No pins.",
  "componentDialog.optionalPlaceholder": "(optional)",
  "componentDialog.pins": "Pins",
  "componentDialog.pinFilter.all": "all",
  "componentDialog.pinFilter.in": "in",
  "componentDialog.pinFilter.out": "out",
  "componentDialog.pinFilter.io": "io",

  "threadsDialog.ariaLabel": "HAL Threads",
  "threadsDialog.title": "HAL Threads",
  "threadsDialog.subtitle":
    "Manage thread names and periods used for addf scheduling/export defaults.",
  "threadsDialog.threads": "Threads",
  "threadsDialog.help":
    "By default, projects start with one servo thread at 1000000 ns. Thread periods are stored in nanoseconds.",
  "threadsDialog.addThread": "Add Thread",
  "threadsDialog.removeThread": "Remove Thread",
  "threadsDialog.name": "Name",
  "threadsDialog.periodNsLabel": "Period (ns)",
  "threadsDialog.floatMode": "Float Support",
  "threadsDialog.floatFp": "fp",
  "threadsDialog.floatNoFp": "nofp",
  "threadsDialog.loadedViaMotmod": "Loaded via motmod",

  "projectSettings.ariaLabel": "Project Settings",
  "projectSettings.title": "Project Settings",
  "projectSettings.tabMotmod": "motmod",
  "projectSettings.tabThreads": "HAL Threads",
  "projectSettings.tabCustomComponents": "Custom Components",
  "projectSettings.tabIniEditor": "INI Editor",
  "projectSettings.motmodTitle": "Motion Module (motmod)",
  "projectSettings.motmodHelp": "Configure common motmod loadrt parameters.",
  "projectSettings.motmod.numJoints": "num_joints",
  "projectSettings.motmod.numDio": "num_dio",
  "projectSettings.motmod.numAio": "num_aio",
  "projectSettings.motmod.trajPeriodNs": "traj_period_nsec (0 = servo)",
  "projectSettings.motmod.numSpindles": "num_spindles",
  "projectSettings.motmod.numMiscError": "num_misc_error",
  "projectSettings.motmod.threadsDerived": "Derived From Threads",
  "projectSettings.motmod.threadsDerivedHelp":
    "servo/base periods and base_thread_fp come from HAL Threads (servo-thread/base-thread).",
  "projectSettings.motmod.syncStatusLabel": "System HAL projection",
  "projectSettings.motmod.syncStatusInSync": "In sync",
  "projectSettings.motmod.syncStatusOutOfSync": "Out of sync",
  "projectSettings.motmod.syncSummary":
    "Pending: +{add} add, -{remove} remove, {adopt} adopt, {ensure} ensure components, {update} update config",
  "projectSettings.motmod.syncNow": "Sync now",
  "customComponents.title": "Custom Components",
  "customComponents.help":
    "Non-.comp components (including HAL-import generated ones). If set, load string is emitted verbatim during HAL export for that component.",
  "customComponents.addComponent": "Add Component",
  "customComponents.catalogTitle": "Custom Components",
  "customComponents.editorTitle": "Component Editor",
  "customComponents.selectComponentHint":
    "Select a component from the list to edit it.",
  "customComponents.empty":
    "No custom components yet. Import a HAL config or add components outside the .comp store.",
  "customComponents.removeComponent": "Remove Component",
  "customComponents.cannotRemoveInUse":
    "Component is used by {count} placed instance(s). Remove instances first.",
  "customComponents.componentName": "HAL Component Name",
  "customComponents.stats":
    "{pins} pins • {params} params • {instances} instances",
  "customComponents.runtime": "Runtime",
  "customComponents.runtimeRt": "rt",
  "customComponents.runtimeUserspace": "userspace",
  "customComponents.runtimeUnknown": "unknown",
  "customComponents.loadString": "Load string",
  "customComponents.loadStringPlaceholder":
    "Example: loadusr -W hal_manualtoolchange",
  "customComponents.pinsTitle": "Pins",
  "customComponents.addPin": "Add Pin",
  "customComponents.noPins": "No pins.",
  "customComponents.paramsTitle": "Parameters",
  "customComponents.addParam": "Add Param",
  "customComponents.noParams": "No parameters.",
  "customComponents.paramDirection": "Direction",
  "customComponents.paramDirectionRead": "r",
  "customComponents.paramDirectionReadWrite": "rw",
  "customComponents.paramDefaultValue": "Default Value",
  "customComponents.optionalValue": "(optional)",

  "sheetSettings.ariaLabel": "Sheet Settings",
  "sheetSettings.title": "Sheet Settings",
  "sheetSettings.threadOutputsTitle": "Sheet Thread Outputs",
  "sheetSettings.threadOutputsHelp":
    "Define this sheet's local scheduling outputs. Parent sheets map subsheet outputs into their own outputs.",
  "sheetSettings.rootThreadBindingHelp":
    "Top sheet outputs can be explicitly bound to project HAL threads.",
  "sheetSettings.addThreadOutput": "Add Output",
  "sheetSettings.rootThreadBinding": "HAL thread binding",
  "sheetSettings.rootThreadBindingUnbound": "(unbound)",
  "sheetSettings.addfQueueTitle": "addf Queue (Sheet Scope)",
  "sheetSettings.addfQueueHelp":
    "Order components and subsheets together. Subsheet entries expand using that subsheet's own queue during HAL export.",
  "sheetSettings.subsheetThreadMappingsTitle": "Subsheet Thread Mappings",
  "sheetSettings.subsheetThreadMappingsHelp":
    "Map each subsheet's declared thread outputs to this sheet's thread outputs. Auto inherits the subsheet row lane from the addf queue.",
  "sheetSettings.threadMapAutoInherit": "(auto / inherit row: {thread})",
  "sheetSettings.noSubsheets": "No subsheets in this sheet.",
  "sheetSettings.resetAZ": "Reset (A-Z)",
  "sheetSettings.queueItems": "Queue Items",
  "sheetSettings.dragToReorder": "Drag to reorder",
  "sheetSettings.assignThreadOutput": "Assign local thread output",
  "sheetSettings.kindSheet": "sheet",
  "sheetSettings.kindRt": "rt",
  "sheetSettings.kindFunction": "fn",
  "sheetSettings.defaultFunction": "default",
  "sheetSettings.empty": "No RT components or subsheets in this sheet.",
  "sheetSettings.missingSheet": "missing sheet",
  "sheetSettings.missing": "missing",

  "sidebar.sheets": "Tree",
  "sidebar.expandSheet": "Expand {name}",
  "sidebar.collapseSheet": "Collapse {name}",
  "sidebar.orphan": "orphan",
  "sidebar.sheetActions": "Sheet actions",
  "sidebar.sheetSettings": "Sheet Settings",
  "sidebar.deleteSheet": "Delete Sheet",

  "projectCreation.projectLocalGenerated": "Project-local (generated)",
  "projectCreation.storeFallback": "Store: {componentId}",
  "projectCreation.storeEntry": "Store: {name}",
  "projectCreation.ariaCreateProject": "Create New Project",
  "projectCreation.title": "New Project",
  "projectCreation.subtitleChoose":
    "Choose a blank project or import a LinuxCNC machine configuration (INI + HAL).",
  "projectCreation.subtitleMachineFiles":
    "Select the INI file first, then configure which HAL files to include before component linking.",
  "projectCreation.subtitleLink":
    "Verify component links before building the imported sheet.",
  "projectCreation.blankProject": "Blank Project",
  "projectCreation.blankProjectHelp":
    "Start with an empty top sheet and existing built-in/store components.",
  "projectCreation.createBlank": "Create Blank",
  "projectCreation.importMachineConfig": "Import Machine Configuration",
  "projectCreation.importMachineConfigHelp":
    "Pick a LinuxCNC `.ini` file first. Then review parsed HALFILE entries and manually choose HAL files before continuing to component linking.",
  "projectCreation.pickMachineIniFile": "Pick INI File",
  "projectCreation.addHalFileRow": "Add Row",
  "projectCreation.continueToComponentLinking": "Continue to Component Linking",
  "projectCreation.machineConfigIniSource": "INI Source",
  "projectCreation.iniKeys": "INI keys",
  "projectCreation.selectedHalFilesList": "Selected HAL Files",
  "projectCreation.resolveIniInHalFile": "Resolve INI",
  "projectCreation.browseHalFile": "Pick HAL file",
  "projectCreation.removeHalFileRow": "Remove HAL file row",
  "projectCreation.noSelectedHalFiles":
    "No HAL files selected yet. Defaults are usually prefilled from the INI if those files exist.",
  "projectCreation.halFiles": "HAL files",
  "projectCreation.importSource": "Import Source",
  "projectCreation.components": "Components",
  "projectCreation.nets": "Nets",
  "projectCreation.setp": "setp",
  "projectCreation.addf": "addf",
  "projectCreation.placement": "Placement",
  "projectCreation.placementTitle": "Component placement heuristic",
  "projectCreation.placementRelatedGroups": "Related groups (heuristic)",
  "projectCreation.placementAlphabetical": "Alphabetical",
  "projectCreation.placementHelp":
    "Groups connected components together before laying out the imported sheet, which usually reduces long crossing wires.",
  "projectCreation.componentLinking": "Component Linking",
  "projectCreation.componentLinkingHelp":
    "Review automatic matches. Any group left as project-local will generate a component definition stored in this project.",
  "projectCreation.groupStats":
    "{instances} instances • {pins} pins • {params} params • runtime {runtime}",
  "projectCreation.autoReason": "Auto: {reason}",
  "projectCreation.linkTarget": "Link Target",
  "projectCreation.noComponentGroups": "No component groups were detected.",
  "projectCreation.parserWarnings": "Parser Warnings",
  "projectCreation.parserWarningsTruncated":
    "Showing first 20 of {count} warnings.",
  "projectCreation.createImportedProject": "Create Imported Project",

  "componentStore.ariaLabel": "Component Store",
  "componentStore.title": "Component Store",
  "componentStore.summary":
    "{components} stored components • {sources} sources",
  "componentStore.sources": "Component Sources",
  "componentStore.addDirSource": "Add Dir Source",
  "componentStore.importCompFile": "Import .comp",
  "componentStore.sourceComponentsCount": "{count} components",
  "componentStore.lastScan": "last scan {time}",
  "componentStore.refresh": "Refresh",
  "componentStore.deleteSource": "Delete Source",
  "componentStore.noSources": "No component sources yet.",
  "componentStore.storedComponents": "Stored Components",
  "componentStore.filterPlaceholder": "Filter stored components...",
  "componentStore.componentStats": "{pins} pins • {params} params",
  "componentStore.componentWarnings": "{count} warnings",
  "componentStore.dirSource": "dir source",
  "componentStore.fileImport": "file import",
  "componentStore.builtinSource": "versioned built-in store",
  "componentStore.noStoredComponents": "No stored components yet.",
  "componentStore.noMatchingComponents": "No matching stored components.",

  "iniEditor.ariaLabel": "INI Editor",
  "iniEditor.title": "INI Editor",
  "iniEditor.subtitle":
    "Edit imported LinuxCNC INI values used by HAL `[SECTION]KEY` substitutions.",
  "iniEditor.noConfigTitle": "No machine configuration loaded",
  "iniEditor.noConfigHelp":
    "Create an empty INI here, or import a machine configuration from the New Project flow.",
  "iniEditor.createEmptyConfig": "Create Empty INI",
  "iniEditor.valuesTitle": "INI Values",
  "iniEditor.enterEditMode": "Edit",
  "iniEditor.exitEditMode": "Done",
  "iniEditor.addSection": "Add Section",
  "iniEditor.addField": "Add Field",
  "iniEditor.removeSection": "Remove Section",
  "iniEditor.removeField": "Remove Field",
  "iniEditor.confirmRemoveSection": "Remove INI section [{name}]?",
  "iniEditor.confirmRemoveSectionWithFields":
    "Remove INI section [{name}] and its {count} fields?",
  "iniEditor.confirmRemoveField": "Remove INI field [{sectionName}] {key}?",
  "iniEditor.emptyDocument": "No INI sections yet. Add a section to begin.",
  "iniEditor.emptySection": "No key/value entries in this section.",

  "inspector.selection": "Selection",
  "inspector.nothingSelected": "Nothing selected.",
  "inspector.multipleSelected": "Multiple items selected.",
  "inspector.deleteSelection": "Delete Selection",
  "inspector.directConnections": "Direct Connections",
  "inspector.warnings": "Warnings",
  "inspector.openComponentSettings": "Open Component Settings",
  "inspector.refreshComponentDefinition": "Refresh Component Definition",
  "inspector.enterSubsheet": "Enter Subsheet",
  "inspector.pins": "Pins",
  "inspector.parametersAvailableInDialog":
    "{count} parameters available in dialog",
  "inspector.noParameters": "No parameters",
  "inspector.rotateNeg90": "Rotate -90deg",
  "inspector.rotatePos90": "Rotate +90deg",
  "inspector.resetRotation": "Reset rotation",

  "store.status.ready": "Ready",
  "store.status.updatedSheetAddfQueue":
    "Updated sheet addf queue ({count} entries)",
  "store.status.addedWireWaypoint": "Added wire waypoint ({count})",
  "store.status.createdNewProject": "Created new project",
  "store.status.failedCreateProject": "Failed to create project: {error}",
  "store.status.openedProject": "Opened project",
  "store.status.failedLoadPreparedProject":
    "Failed to load prepared project: {error}",
  "store.status.openedProjectPath": "Opened project folder: {projectPath}",
  "store.status.failedOpenProject": "Failed to open project: {error}",
  "store.status.savedProjectPath": "Saved project folder: {projectPath}",
  "store.status.failedSaveProject": "Failed to save project: {error}",
  "store.status.builtProject":
    "Built project output ({count} files): {buildDir}",
  "store.status.failedBuildProject": "Build failed: {error}",
  "store.status.createdEmptyMachineConfig": "Created empty machine INI",
  "store.status.addedIniSection": "Added INI section",
  "store.status.removedIniSection": "Removed INI section",
  "store.status.updatedIniSectionName": "Updated INI section name",
  "store.status.addedIniField": "Added INI field",
  "store.status.removedIniField": "Removed INI field",
  "store.status.updatedIniKey": "Updated INI key",
  "store.status.updatedIniValue": "Updated INI value",
  "store.status.selectedComponentNotCustom":
    "Selected component is not a custom component",
  "store.status.addedCustomComponent": "Added custom component {componentName}",
  "store.status.removedCustomComponent":
    "Removed custom component {componentName}",
  "store.status.cannotRemoveCustomComponentInUse":
    "Cannot remove custom component {componentName}: {count} placed instance(s) still use it",
  "store.status.updatedCustomComponent":
    "Updated custom component {componentName}",
  "store.status.updatedCustomComponentLoad":
    "Updated custom component load string: {componentName}",
  "store.status.addedCustomComponentPin":
    "Added pin to custom component {componentName}",
  "store.status.removedCustomComponentPin":
    "Removed pin {pinName} from custom component {componentName}",
  "store.status.updatedCustomComponentPin":
    "Updated pin {pinName} on custom component {componentName}",
  "store.status.updatedCustomComponentPinDirection":
    "Updated custom component pin direction: {componentName}.{pinName} -> {direction}",
  "store.status.addedCustomComponentParam":
    "Added parameter to custom component {componentName}",
  "store.status.removedCustomComponentParam":
    "Removed parameter {paramName} from custom component {componentName}",
  "store.status.updatedCustomComponentParam":
    "Updated parameter {paramName} on custom component {componentName}",
  "store.status.addedSheetThreadOutput": "Added sheet thread output",
  "store.status.updatedSheetThreadOutputName":
    "Updated sheet thread output name",
  "store.status.updatedSheetThreadOutputHalBinding":
    "Updated sheet thread output HAL binding",
  "store.status.removedSheetThreadOutput": "Removed sheet thread output",
  "store.status.updatedSubsheetThreadMapping":
    "Updated subsheet thread mapping",
  "store.status.addedHalThread": "Added HAL thread",
  "store.status.removedHalThread": "Removed HAL thread {name}",
  "store.status.updatedHalThreadName": "Updated HAL thread name to {name}",
  "store.status.updatedHalThreadPeriod": "Updated HAL thread period ({name})",
  "store.status.updatedHalThreadFloatMode":
    "Updated HAL thread float mode ({name}) to {mode}",
  "store.status.updatedMotmodConfig": "Updated motmod settings",
  "store.status.motmodProjectionAlreadyInSync":
    "Motmod system projection is already in sync",
  "store.status.syncedMotmodProjection":
    "Synced motmod projection (+{added}, -{removed}, {adopted} adopted, {ensured} ensured, {updated} updated)",
  "store.status.cannotRemoveLastHalThread":
    "At least one HAL thread must exist",
  "store.status.cannotRemoveRequiredHalThread":
    "Cannot remove required HAL thread {name}",
  "store.status.cannotRenameRequiredHalThread":
    "Cannot rename required HAL thread {name}",
  "store.status.requiredHalThreadForcedFp":
    "HAL thread {name} is required to run with fp mode",
  "store.status.duplicateHalThreadName":
    "HAL thread name already exists: {name}",
  "store.status.noMachineConfigLoaded":
    "No imported machine configuration is loaded",
  "store.status.importedCompToStore":
    "Imported .comp to store: {componentName}",
  "store.status.addedDirSource":
    "Added dir source {path}: {components} components, {removed} removed ({errors} errors)",
  "store.status.refreshedSource":
    "Refreshed source {path}: {components} components, {removed} removed ({errors} errors)",
  "store.status.sourceRefreshFailed": "Source refresh failed: {error}",
  "store.status.deletedSource":
    "Deleted source {path} ({removed} components removed)",
  "store.status.deleteSourceFailed": "Delete source failed: {error}",
  "store.status.selectedComponentNotStoredComp":
    "Selected component is not a stored .comp component",
  "store.status.refreshedComponent": "Refreshed component: {componentName}",
  "store.status.refreshFailed": "Refresh failed: {error}",
  "store.status.componentPlacementDisabled":
    "Component '{componentName}' is system-managed and cannot be placed manually",
  "store.status.cannotDeleteSystemManagedComponent":
    "System-managed components cannot be deleted",
  "store.status.removedSelectionSkippedSystemManaged":
    "Removed selection (skipped {count} system-managed components)",
  "store.status.placedComponent": "Placed component {componentName}",
  "store.status.createdSubsheet": "Created subsheet {name}",
  "store.status.cannotPlaceSheetInsideItself":
    "Cannot place a sheet inside itself",
  "store.status.sheetAlreadyPlaced": "Sheet is already placed",
  "store.status.cannotCreateRecursiveSheetHierarchy":
    "Cannot create recursive sheet hierarchy",
  "store.status.placedSubsheet": "Placed subsheet {name}",
  "store.status.cannotDeleteRootSheet": "Cannot delete the root sheet",
  "store.status.deletedSheet":
    "Deleted sheet {name} ({count} sheet definitions removed)",
  "store.status.addedLabel": "Added {scope} label",
  "store.status.addedComment": "Added text comment",
  "store.status.addedSheetPort": "Added sheet port",
  "store.status.cannotSubsheetEmptySelection":
    "Select at least one node or label to create a subsheet",
  "store.status.cannotSubsheetOnlyPortsSelection":
    "Sheet ports cannot be moved into a subsheet directly",
  "store.status.putSelectionIntoSubsheet":
    "Put selection into subsheet {name} ({ports} ports created)",
  "store.status.removedSelection": "Removed selection",
  "store.status.selectedEndpointDetailed":
    "Selected endpoint {name} ({direction} {type})",
  "store.status.selectedEndpoint": "Selected endpoint",
  "store.status.invalidConnection": "Invalid connection",
  "store.status.connectedEndpoints": "Connected endpoints",
  "store.status.attachedEndpointToLabel": "Attached endpoint to label",
  "store.status.removedConnection": "Removed connection",
  "store.status.updatedWireRoute": "Updated wire route",
  "store.status.removedLabelAnchor": "Removed label anchor",
  "store.warning.importError": "Import error {filePath}: {error}",
} as const;

export type TranslationKey = keyof typeof en;
