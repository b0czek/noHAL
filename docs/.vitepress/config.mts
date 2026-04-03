import { defineConfig } from "vitepress";

export default defineConfig({
  title: "NoHAL",
  description: "User manual for NoHAL, a visual HAL IDE for LinuxCNC.",
  base: "/noHAL/",
  srcExclude: ["README.md"],
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "/assets/icon.svg",
    nav: [
      { text: "Guide", link: "/installation" },
      { text: "Workflows", link: "/quickstart" },
      { text: "Advanced", link: "/sheets" },
      { text: "Help", link: "/troubleshooting" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Overview", link: "/" },
          { text: "Installation", link: "/installation" },
        ],
      },
      {
        text: "Concepts",
        items: [
          { text: "Concepts Overview", link: "/concepts" },
          { text: "Component", link: "/concepts/component" },
          { text: "Sheet", link: "/concepts/sheet" },
          { text: "Wiring", link: "/concepts/wiring" },
          { text: "Threading", link: "/concepts/threading" },
          { text: "Component Store", link: "/concepts/component-store" },
        ],
      },
    ],
    search: {
      provider: "local",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/b0czek/noHAL" }],
    editLink: {
      pattern: "https://github.com/b0czek/noHAL/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Built with VitePress. Written for NoHAL users.",
      copyright: "Copyright © Dariusz Majnert",
    },
  },
});
