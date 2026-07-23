/**
 * Linkedom (unlike JSDOM) usually preserves SVG casing.
 * Keep these replacements as a safety net for either DOM backend.
 */
export const fixSvgCasing = (svgContent: string): string => {
  return svgContent
    .replace(/feturbulence/g, "feTurbulence")
    .replace(/fedisplacementmap/g, "feDisplacementMap")
    .replace(/filterunits/g, "filterUnits")
    .replace(/basefrequency/g, "baseFrequency")
    .replace(/xchannelselector/g, "xChannelSelector")
    .replace(/ychannelselector/g, "yChannelSelector");
};

/** @deprecated use fixSvgCasing */
export const fixJsdomSvgCasing = fixSvgCasing;

export const getChartWidthWithSize = (size: string) => {
  if (size === "mobile") {
    return 600;
  } else if (size === "laptop") {
    return 800;
  } else if (size === "desktop") {
    return 1000;
  } else {
    return 600;
  }
};

export async function getBase64Image(url: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return "";
    }
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${btoa(binary)}`;
  } catch {
    return "";
  }
}
