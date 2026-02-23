// Scene bounds
export const SCENE_WIDTH = 2200;
export const SCENE_HEIGHT = 1400;

// Layout geometry
export const NODE_WIDTH = 240;
export const HEADER_H = 28;
export const SIDE_ROW_H = 24;
export const BOTTOM_H = 26;
export const PIN_R = 6;
export const PORT_LABEL_H = 24;

// Pin / port spacing
export const BOTTOM_PIN_COLUMN_STEP = 30;
export const BOTTOM_PIN_PILL_W = 22;
export const BOTTOM_PIN_TEXT_PAD = 10;
export const BOTTOM_PIN_DOT_GAP = 6;

// Typography
export const FONT_SANS = "IBM Plex Sans";
export const FONT_MONO = "IBM Plex Mono";

// Text colors
export const TEXT_PRIMARY = "#d7eee7";
export const TEXT_MUTED = "#8ea8a1";
export const TEXT_SOFT = "rgba(215,238,231,0.8)";

// Shared UI surfaces / borders
export const PIN_HALO_FILL = "rgba(122, 230, 208, 0.18)";
export const PIN_STROKE = "rgba(6, 12, 15, 0.95)";
export const PENDING_BORDER = "rgba(122,230,208,0.45)";
export const SELECTED_BORDER = "rgba(122, 230, 208, 0.6)";
export const SELECTED_LABEL_BORDER = "rgba(122,230,208,0.5)";
export const NEUTRAL_BORDER = "rgba(255,255,255,0.08)";
export const CHIP_FILL = "rgba(255,255,255,0.02)";
export const PORT_PANEL_FILL = "rgba(8, 21, 27, 0.95)";
export const NODE_FILL = "rgba(10, 20, 25, 0.96)";
export const SHEET_NODE_FILL = "rgba(17, 14, 9, 0.96)";
export const SHEET_NODE_BORDER = "rgba(242, 185, 75, 0.18)";
export const HEADER_FILL = "rgba(255, 255, 255, 0.03)";
export const HEADER_DIVIDER = "rgba(255, 255, 255, 0.05)";

// Shared UI dimensions
export const CORNER_RADIUS_MD = 10;
export const PILL_RADIUS = 999;
export const PIN_HALO_RADIUS_PAD = 4;
export const BASE_STROKE_WIDTH = 1;
export const PIN_HIT_STROKE_WIDTH = 10;

// Wire geometry
export const WIRE_ENDPOINT_STUB_LEN = 14;
export const WIRE_BEZIER_PULL = 0.4;
export const WIRE_PATH_TENSION = 0.25;

// Wire styling
export const WIRE_SELECTED_STROKE = "rgba(140, 244, 224, 0.92)";
export const WIRE_DEFAULT_STROKE = "rgba(122, 230, 208, 0.75)";
export const WIRE_PENDING_STROKE = "rgba(122, 230, 208, 0.55)";
export const WIRE_SELECTED_STROKE_WIDTH = 2.75;
export const WIRE_DEFAULT_STROKE_WIDTH = 2.25;
export const WIRE_PENDING_STROKE_WIDTH = 2;
export const WIRE_HIT_STROKE_WIDTH = 14;
export const WIRE_PENDING_DASH = [8, 6];

// Waypoint handle styling
export const WAYPOINT_HANDLE_RADIUS = 6;
export const WAYPOINT_HANDLE_SELECTED_RADIUS = 7;
export const WAYPOINT_HANDLE_FILL = "rgba(8, 18, 22, 0.95)";
export const WAYPOINT_HANDLE_SELECTED_FILL = "rgba(140, 244, 224, 0.22)";
export const WAYPOINT_HANDLE_STROKE = "rgba(140, 244, 224, 0.95)";
export const WAYPOINT_HANDLE_STROKE_WIDTH = 2;
export const WAYPOINT_HANDLE_HIT_STROKE_WIDTH = 14;

// Label anchor wire styling
export const LABEL_ANCHOR_STROKE = "rgba(242, 185, 75, 0.72)";
export const LABEL_ANCHOR_STROKE_WIDTH = 1.7;
export const LABEL_ANCHOR_DASH = [7, 5];

// Theme palette: type colors
export const TYPE_FILL_BIT = "#55d48a";
export const TYPE_FILL_FLOAT = "#f2b94b";
export const TYPE_FILL_S32 = "#61a9ff";
export const TYPE_FILL_U32 = "#51d4ef";
export const TYPE_FILL_S64 = "#9f7dff";
export const TYPE_FILL_U64 = "#e178ff";
export const TYPE_FILL_PORT = "#9aa6ac";
export const TYPE_FILL_DEFAULT = "#c2d0d6";

// Theme palette: direction strokes
export const DIR_STROKE_IN = "rgba(122, 180, 255, 0.95)";
export const DIR_STROKE_OUT = "rgba(242, 185, 75, 0.95)";
export const DIR_STROKE_IO = "rgba(216, 122, 255, 0.95)";
export const DIR_STROKE_DEFAULT = "rgba(255, 255, 255, 0.7)";

// Theme palette: label fills
export const LABEL_FILL_LOCAL = "rgba(122, 230, 208, 0.14)";
export const LABEL_FILL_HIERARCHICAL = "rgba(242, 185, 75, 0.14)";
export const LABEL_FILL_GLOBAL = "rgba(233, 107, 255, 0.14)";
export const LABEL_FILL_DEFAULT = "rgba(255, 255, 255, 0.06)";

// Theme palette: direction pill fills
export const DIRECTION_PILL_FILL_IN = "rgba(122, 180, 255, 0.12)";
export const DIRECTION_PILL_FILL_OUT = "rgba(242, 185, 75, 0.12)";
export const DIRECTION_PILL_FILL_IO = "rgba(216, 122, 255, 0.12)";
