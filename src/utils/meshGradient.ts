import React from "react";

/**
 * Generates a soft pastel multi-point mesh gradient style
 * for quiz cards on the dashboard without needing any static icon in the center.
 */
export const getMeshGradientStyle = (
  seed: number | string = 0,
): React.CSSProperties => {
  const numericSeed =
    typeof seed === "number"
      ? Math.abs(seed)
      : Math.abs(
          seed
            .split("")
            .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0),
        );

  const pastelPalettes = [
    // 0: Soft Sky & Baby Blue Pastel
    {
      bg: "#e0f2fe", // sky-100
      p1: "radial-gradient(at 15% 20%, #bae6fd 0px, transparent 55%)", // sky-200
      p2: "radial-gradient(at 85% 15%, #a7f3d0 0px, transparent 50%)", // emerald-200
      p3: "radial-gradient(at 35% 85%, #c7d2fe 0px, transparent 60%)", // indigo-200
      p4: "radial-gradient(at 80% 80%, #ddd6fe 0px, transparent 50%)", // violet-200
    },
    // 1: Soft Matcha & Mint Pastel
    {
      bg: "#dcfce7", // green-100
      p1: "radial-gradient(at 20% 15%, #bbf7d0 0px, transparent 55%)", // green-200
      p2: "radial-gradient(at 80% 20%, #fef08a 0px, transparent 50%)", // yellow-200
      p3: "radial-gradient(at 15% 80%, #bae6fd 0px, transparent 60%)", // sky-200
      p4: "radial-gradient(at 85% 85%, #a7f3d0 0px, transparent 50%)", // emerald-200
    },
    // 2: Soft Peach & Apricot Pastel
    {
      bg: "#ffedd5", // orange-100
      p1: "radial-gradient(at 15% 20%, #fed7aa 0px, transparent 55%)", // orange-200
      p2: "radial-gradient(at 85% 15%, #fde68a 0px, transparent 50%)", // amber-200
      p3: "radial-gradient(at 30% 85%, #fecdd3 0px, transparent 60%)", // rose-200
      p4: "radial-gradient(at 80% 80%, #fed7aa 0px, transparent 50%)", // orange-200
    },
    // 3: Soft Lavender & Lilac Pastel
    {
      bg: "#f3e8ff", // purple-100
      p1: "radial-gradient(at 15% 15%, #e9d5ff 0px, transparent 55%)", // purple-200
      p2: "radial-gradient(at 85% 25%, #fbcfe8 0px, transparent 50%)", // pink-200
      p3: "radial-gradient(at 25% 85%, #c7d2fe 0px, transparent 60%)", // indigo-200
      p4: "radial-gradient(at 80% 80%, #ddd6fe 0px, transparent 50%)", // violet-200
    },
    // 4: Soft Cotton Candy & Rose Pastel
    {
      bg: "#fce7f3", // pink-100
      p1: "radial-gradient(at 20% 20%, #fbcfe8 0px, transparent 55%)", // pink-200
      p2: "radial-gradient(at 80% 15%, #bae6fd 0px, transparent 50%)", // sky-200
      p3: "radial-gradient(at 15% 80%, #e9d5ff 0px, transparent 60%)", // purple-200
      p4: "radial-gradient(at 85% 85%, #fecdd3 0px, transparent 50%)", // rose-200
    },
    // 5: Soft Buttercup & Cream Pastel
    {
      bg: "#fef9c3", // yellow-100
      p1: "radial-gradient(at 20% 15%, #fef08a 0px, transparent 55%)", // yellow-200
      p2: "radial-gradient(at 80% 20%, #fed7aa 0px, transparent 50%)", // orange-200
      p3: "radial-gradient(at 15% 85%, #bbf7d0 0px, transparent 60%)", // green-200
      p4: "radial-gradient(at 80% 85%, #fde68a 0px, transparent 50%)", // amber-200
    },
  ];

  const palette = pastelPalettes[numericSeed % pastelPalettes.length];
  return {
    backgroundColor: palette.bg,
    backgroundImage: `${palette.p1}, ${palette.p2}, ${palette.p3}, ${palette.p4}`,
  };
};
