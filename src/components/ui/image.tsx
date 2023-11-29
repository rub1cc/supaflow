import BaseImage, { ImageProps } from "next/image";
import { useState } from "react";

interface Props extends ImageProps {}

export function Image(props: Props) {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <BaseImage
      className={`
  duration-700 ease-in-out group-hover:opacity-75
  ${
    isLoading ? "scale-110 blur-2xl grayscale" : "scale-100 blur-0 grayscale-0"
  })`}
      onLoadingComplete={() => setIsLoading(false)}
      {...props}
    />
  );
}
