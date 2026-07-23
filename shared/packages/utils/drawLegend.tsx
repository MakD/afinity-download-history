import { D3Selection, LegendPosition } from "../types"

interface DrawLegendConfig {
    items: {
        color: string
        text: string
        logo: string
    }[]
    strokeColor: string
    backgroundColor: string
    legendPosition: LegendPosition
    chartWidth: number
    chartHeight: number
}

const drawLegend = (selection: D3Selection, { items, strokeColor, backgroundColor, legendPosition, chartWidth, chartHeight }: DrawLegendConfig) => {
    const legendXPadding = 7
    const legendYPadding = 6
    const xkcdCharWidth = 7
    const xkcdCharHeight = 20
    const colorBlockWidth = 8

    const legend = selection.append("svg")
    const backgroundLayer = legend.append("svg")
    const textLayer = legend.append("svg")
    let maxTextLength = 0

    // Calculate background dimensions first
    items.forEach((item) => {
        maxTextLength = Math.max(item.text.length, maxTextLength)
    })

    let bboxWidth = maxTextLength * (xkcdCharWidth + 0.5) + colorBlockWidth + legendXPadding
    const backgroundWidth = Math.max(bboxWidth + legendXPadding * 2, maxTextLength * xkcdCharWidth + colorBlockWidth + legendXPadding * 2 + 6)
    const backgroundHeight = items.length * xkcdCharHeight + legendYPadding * 2

    // Calculate position based on legendPosition
    let legendX = 8
    let legendY = 5

    if (legendPosition === "bottom-right") {
        legendX = chartWidth - backgroundWidth - 8
        legendY = chartHeight - backgroundHeight - 15
    }

    items.forEach((item, i) => {
        // draw color dot
        textLayer
            .append("rect")
            .style("fill", item.color)
            .attr("width", colorBlockWidth)
            .attr("height", colorBlockWidth)
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("filter", "url(#xkcdify)")
            .attr("x", legendX + legendXPadding)
            .attr("y", legendY + 12 + xkcdCharHeight * i)
        // draw text
        textLayer
            .append("text")
            .style("font-size", "15px")
            .style("fill", strokeColor)
            .attr("x", legendX + legendXPadding + colorBlockWidth + 6)
            .attr("y", legendY + 12 + xkcdCharHeight * i + 8)
            .text(item.text)
    })

    // Update bboxWidth with actual width if possible
    if (textLayer.node()?.getBBox) {
        bboxWidth = textLayer.node()?.getBBox().width as number
    }

    // add background
    backgroundLayer
        .append("rect")
        .style("fill", backgroundColor)
        .attr("fill-opacity", 0.85)
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("filter", "url(#xkcdify)")
        .attr("width", backgroundWidth)
        .attr("height", backgroundHeight)
        .attr("x", legendX)
        .attr("y", legendY)
}

export default drawLegend
