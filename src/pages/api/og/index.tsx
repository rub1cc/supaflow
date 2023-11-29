import { Resvg } from "@resvg/resvg-js";
import type { NextApiRequest, NextApiResponse } from "next";
import satori from "satori";
import { fetchFont } from "../../../utils/font";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const title = req.query.title;
  const updatedAt = req.query.updatedAt;
  const steps = req.query.steps;
  const authorName = req.query.authorName;
  const authorAvatar = req.query.authorAvatar;

  const staticText = "steps·";

  const font = await fetchFont(
    `${title}${updatedAt}${steps}${staticText}${authorName}`,
    "Roboto"
  );

  const svg = await satori(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: "52px",
        color: "#171717",
        backgroundImage: `radial-gradient(ellipse at 10% 90%, #3c2d83 0%, transparent 55%),
    radial-gradient(ellipse at 90% 90%, #c33c65 0%, transparent 55%),
    radial-gradient(ellipse at 90% 10%, #4a74dc 0%, transparent 55%),
    radial-gradient(ellipse at 10% 10%, #35244f 0%, transparent 55%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "52px",
          backgroundColor: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <img
            src={authorAvatar as string || ""}
            alt={authorName + " avatar"}
            width={80}
            height={80}
            style={{
              borderRadius: 50,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <span
              style={{
                fontSize: "32px",
              }}
            >
              {authorName}
            </span>
            <span
              style={{
                fontSize: "20px",
                color: "#737373",
              }}
            >
              {steps} steps · {updatedAt}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: "68px",
            fontWeight: "bold",
          }}
        >
          {title}
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Roboto",
          data: font!,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    background: "#fff",
  });
  const pngBuffer = resvg.render().asPng();

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.end(pngBuffer);
}
