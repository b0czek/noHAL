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
          { text: "Getting Started", link: "/getting-started" },
          { text: "Quickstart", link: "/quickstart" },
          { text: "Core Concepts", link: "/concepts" },
        ],
      },
      {
        text: "Workflows",
        items: [
          { text: "Import Existing HAL", link: "/importing-existing-hal" },
          { text: "Build a Project", link: "/building-a-project" },
          { text: "Edit Networks", link: "/editing-networks" },
          { text: "Export", link: "/export" },
        ],
      },
      {
        text: "Advanced",
        items: [
          { text: "Sheets", link: "/sheets" },
          { text: "Threads and addf", link: "/threads-and-addf" },
          { text: "Component Store", link: "/component-store" },
        ],
      },
      {
        text: "Help",
        items: [{ text: "Export", link: "/export" }],
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
