import { StreamLanguage } from "@codemirror/language";

const HAL_KEYWORDS =
  /(?:loadrt|loadusr|waitusr|unload|lock|unlock|net|linkps|linksp|unlinkp|newsig|delsig|setp|getp|ptype|sets|gets|stype|addf|delf|show|list|save|status|start|stop|source|echo|unecho|quit|exit)\b/;

export const linuxcncHalLanguage = StreamLanguage.define({
  languageData: {
    commentTokens: { line: "#" },
  },
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/#.*/)) return "comment";
    if (stream.match(/"(?:[^"\\]|\\.)*(?:"|$)/)) return "string";
    if (stream.match(/\[[A-Za-z_]\w*\][A-Za-z_]\w*/)) return "atom";
    if (stream.match(/(?:<=>|=>|<=)/)) return "operator";
    if (stream.match(/(?:true|false|null)\b/)) return "bool";
    if (
      stream.match(
        /0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)*|0[bB][01]+(?:_[01]+)*|0[0-7]+(?:_[0-7]+)*/,
      )
    ) {
      return "number";
    }
    if (
      stream.match(
        /\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?(?:[Ee][+-]?\d+(?:_\d+)*)?|\.\d+(?:_\d+)*(?:[Ee][+-]?\d+(?:_\d+)*)?/,
      )
    ) {
      return "number";
    }
    if (stream.match(HAL_KEYWORDS)) return "keyword";
    stream.next();
    return null;
  },
});
