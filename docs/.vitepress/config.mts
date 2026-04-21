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
      { text: "Workflows", link: "/import-machine" },
      { text: "Project Settings", link: "/advanced/ini-editor" },
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
      {
        text: "Workflows",
        items: [{ text: "Import a machine", link: "/import-machine" }],
      },
      {
        text: "Build",
        items: [
          { text: "Export (HAL output)", link: "/export" },
          { text: "Build outputs", link: "/build" },
        ],
      },
      {
        text: "Project Settings",
        items: [
          { text: "INI Editor", link: "/advanced/ini-editor" },
          { text: "motmod", link: "/advanced/motmod" },
          { text: "Mesa / HostMot2", link: "/advanced/mesa" },
          { text: "Shutdown HAL", link: "/advanced/shutdown" },
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
