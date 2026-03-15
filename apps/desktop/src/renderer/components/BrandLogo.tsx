import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "../lib/utils";

type BrandLogoProps = Omit<JSX.ImgHTMLAttributes<HTMLImageElement>, "src">;
const nohalIconUrl = new URL("../../../assets/icon.svg", import.meta.url).href;

export default function BrandLogo(props: BrandLogoProps) {
  const [local, rest] = splitProps(props, ["alt", "class"]);

  return (
    <img
      {...rest}
      src={nohalIconUrl}
      alt={local.alt ?? ""}
      class={cn("rounded-2xl", local.class)}
      draggable={false}
    />
  );
}
