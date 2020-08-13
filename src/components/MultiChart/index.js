import React, { useRef, useLayoutEffect, useEffect } from "react";
import * as d3Select from "d3-selection";
import * as d3Scale from "d3-scale";
import * as d3Fetch from "d3-fetch";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import useWindowSize from "./useWindowSize";
import styles from "./styles.scss";

const d3 = {
  ...d3Select,
  ...d3Scale,
  ...d3Fetch,
  ...d3Array,
  ...d3Axis,
  ...d3ScaleChromatic
};

// Test data
const wineQuality = require("./wineQuality.json");

// const xVar = "Alcohol";
// const yVar = "Citric Acid";
// const titleHeight = 40;
// const figPadding = 15;
// const yAxisWidth = 42;
// const xAxisHeight = 35;
// const textHeight = 14;

let svg;
let margin;
let scaleX;
let scaleY;
let xAxis;
let yAxis;
let xAxisGroup;
let yAxisGroup;
let dots;
let width;
let height;

export default props => {
  const root = useRef();
  const windowSize = useWindowSize();

  const initComponent = () => {
    margin = {
      top: window.innerHeight * 0.2,
      right: window.innerWidth * 0.1,
      bottom: window.innerHeight * 0.1,
      left: window.innerWidth * 0.1
    };

    svg = d3.select(root.current);

    width = svg.node().getBoundingClientRect().width;
    height = window.innerHeight;

    const data = [
      { xfield: 4, yfield: 55 },
      { xfield: 5, yfield: 66 },
      { xfield: 5, yfield: 76 }
    ];

    scaleX = d3
      .scalePoint()
      .domain([
        "start",
        1,
        "spacer2",
        2,
        "spacer3",
        3,
        "spacer4",
        4,
        "spacer5",
        5,
        "end"
      ])
      .range([margin.left, width - margin.right]);

    scaleY = d3
      .scaleLinear()
      .domain([100, 1]) // This is what is written on the Axis: from 0 to 100
      .range([margin.top, height - margin.bottom]);

    xAxis = g =>
      g.attr("transform", `translate(0,${height - margin.bottom})`).call(
        d3
          .axisBottom(scaleX)
          .tickFormat("")
          // .ticks([8])
          .tickValues([
            "start",
            "spacer2",
            "spacer3",
            "spacer4",
            "spacer5",
            "end"
          ])
        // .tickSize(-200)
      );

    // yAxis = g => {
    //   return g.attr("transform", `translate(0,${height - margin.bottom})`).call(
    //     d3
    //       .axisLeft(scaleX)
    //       .tickFormat("")
    //       .ticks(5)
    //     // .tickSize(-200)
    //   );
    // };

    yAxis = svg =>
      svg
        .attr("transform", `translate(${margin.left},0)`)
        .call(
          d3
            .axisLeft(scaleY)
            .tickPadding([6])
            .tickSize(-(width - margin.left - margin.right))
          // .tickFormat(formatTick)
        )
        .call(g => g.select(".domain").remove())
        .call(g =>
          g
            .selectAll(".tick line")
            .attr("stroke-opacity", 0.5)
            .attr("stroke-dasharray", "2,2")
        )
        .call(
          g => g.selectAll(".tick text")
          // .attr("x", 0)
          // .attr("y", 0)
        );

    //d3.axisBottom(scaleX).tickSize(3);

    // Draw the axis
    xAxisGroup = svg.append("g").call(xAxis);
    yAxisGroup = svg.append("g").call(yAxis);

    svg.attr("width", width);
    svg.attr("height", height);

    dots = svg
      .append("g")
      .attr("class", "dots")
      .selectAll()
      .data(data)
      .enter()
      .append("circle")
      .attr("fill", "#435699")
      .attr("cx", d => scaleX(d.xfield))
      .attr("cy", d => scaleY(d.yfield))
      .attr("r", 4);
  };

  useLayoutEffect(() => {
    // Init layout effect after delay
    setTimeout(() => {
      initComponent();
    }, 500);
  }, []);

  // Detect and handle window resize events
  useLayoutEffect(() => {
    if (!svg) return;

    // Recalculate margins
    margin = {
      top: window.innerHeight * 0.2,
      right: window.innerWidth * 0.1,
      bottom: window.innerHeight * 0.1,
      left: window.innerWidth * 0.1
    };

    // console.log("Resize detected...");
    // console.log(svg.node().getBoundingClientRect());

    width = svg.node().getBoundingClientRect().width;
    height = window.innerHeight;

    scaleX.range([margin.left, width - margin.right]);
    scaleY.range([margin.top, height - margin.bottom]);

    svg.attr("width", width);
    svg.attr("height", height);

    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    dots.attr("cx", d => scaleX(d.xfield)).attr("cy", d => scaleY(d.yfield));
  }, [windowSize.width, windowSize.height]);

  // useEffect(() => {
  //   updateChart(props);
  // }, [props]); // TODO: be more specific with your change checkers

  // Example effect to update chart on window resize
  // useEffect(() => {
  //   const onResize = () => updateChart(props);
  //   window.addEventListener("resize", onResize);
  //   return () => window.removeEventListener("resize", onResize);
  // }, [props]);

  // function updateChart(props) {
  //   // TODO: update the SVG
  // }

  return (
    <div className={styles.root}>
      <svg className={"scatter-plot"} ref={root}></svg>
    </div>
  );
};

function scatterPlot({
  chart,
  width,
  height,
  data,
  xfield,
  yfield,
  xpadding,
  ypadding,
  colorField,
  size,
  title,
  xlabel,
  ylabel,
  xgrid,
  ygrid
}) {
  let topPadding = titleHeight + figPadding;
  let leftPadding = figPadding + yAxisWidth;
  let bottomPadding = figPadding + xAxisHeight;
  let w = width - leftPadding - figPadding - 1;
  let h = height - topPadding - bottomPadding;

  let x = linearScale(data, xfield, [0, w], xpadding);
  let y = linearScale(data, yfield, [h, 0], ypadding);

  // Add x axis
  let xAxis = d3
    .axisBottom(x)
    .tickPadding(4)
    .ticks(6)
    .tickSizeOuter(0);

  chart
    .append("g")
    .attr("class", "x axis")
    .attr(
      "transform",
      "translate(" + leftPadding + "," + (h + topPadding) + ")"
    )
    .call(xAxis);

  // Add x axis label
  chart
    .append("text")
    .attr(
      "transform",
      "translate(" + (leftPadding + w / 2) + " ," + (height - figPadding) + ")"
    )
    .style("text-anchor", "middle")
    .text(xlabel);

  // x axis
  // Ref: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
  if (xgrid) {
    chart
      .append("g")
      .attr("class", "x grid")
      .attr("transform", "translate(" + leftPadding + "," + topPadding + ")")
      .call(
        xAxis
          .tickSize(h)
          .tickFormat("")
          .ticks(5)
      );
  }

  // Add y axis
  let yAxis = d3
    .axisLeft(y)
    .tickSizeOuter(1)
    .ticks(3);

  chart
    .append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + leftPadding + "," + topPadding + ")")
    .call(yAxis);

  // Add y axis label
  chart
    .append("text")
    .attr(
      "transform",
      "rotate(-90)," +
        "translate(" +
        (0 - topPadding - h / 2) +
        " ," +
        (figPadding + textHeight / 2) +
        ")"
    )
    .style("text-anchor", "middle")
    .text(ylabel);

  // y grid
  if (ygrid) {
    chart
      .append("g")
      .attr("class", "y grid")
      .attr("transform", "translate(" + leftPadding + "," + topPadding + ")")
      .call(yAxis.tickSize(-w).tickFormat(""));
  }

  // create a new group, use `selectAll` to build an empty
  // list context
  let dots = chart
    .append("g")
    .attr("class", "dots")
    .selectAll()
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => leftPadding + x(d[xfield]))
    .attr("cy", d => topPadding + y(d[yfield]))
    .attr("r", size);

  // add Legend
  if (colorField) {
    let color = d3.scaleOrdinal(d3.schemeSet2);
    color.domain(pointScale(data, colorField).domain());

    // Or single color?
    // let color = d3.scaleOrdinal(d3.schemeReds[9].slice(3))
    // color.domain(pointScale(data, colorField).domain())

    dots = dots.attr("fill", d => color(d[colorField]));

    // draw legend
    let legend = chart
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        "translate(" + (leftPadding + w - 97) + "," + (topPadding + 20) + ")"
      );

    // legend background
    let legendBox = legend
      .append("rect")
      .attr("class", "legend-box")
      .attr("x", "-1.5em")
      .attr("y", "-2em")
      .attr("width", 105)
      .attr("height", 60);

    // draw legend title
    legend
      .append("text")
      .attr("class", "legend-label")
      .attr("transform", "translate(-11," + -9 + ")")
      .text(colorField);

    // add wrapper for legend items
    legend = legend
      .selectAll()
      .data(color.domain())
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr(
        "transform",
        (d, i) =>
          "translate(" + (i % 3) * 32 + "," + Math.floor(i / 3) * 15 + ")"
      );

    // draw legend colored rectangles
    legend
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", color);

    // draw legend text
    legend
      .append("text")
      .attr("x", -3)
      .attr("y", 5)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => d);
  }

  // Add title
  chart
    .append("text")
    .attr("class", "title")
    .attr("text-anchor", "middle")
    .attr("x", w / 2 + leftPadding)
    .attr("y", figPadding + titleHeight / 2)
    .text(title);

  return chart;
}

/**
 * Create linear scale from the values of some field.
 * Always maps to a 0 to X range so it can be used to
 * generate actual coordinates on the plotting canvas.
 */
function linearScale(data, field, range, padding) {
  const vals = data.map(d => d[field]);
  const minVal = d3.min(vals);
  const maxVal = d3.max(vals);
  // Use `padding` to add some spaces between min max
  // by default add 3% on both sides
  const width = maxVal - minVal;
  const pad = padding
    ? padding
    : [x => x - 0.03 * width, x => x + 0.03 * width];
  const mi = applyPadding(minVal, pad[0]);
  const ma = applyPadding(maxVal, pad[1]);
  return d3
    .scaleLinear()
    .domain([mi, ma])
    .range(range);
}

function applyPadding(x, ratio) {
  if (typeof ratio == "function") {
    return ratio(x);
  }
  return x * ratio;
}

/**
 * Categorical scale as being used in axes
 */
function pointScale(data, field, rangeMax, padding = 0.5) {
  let vals = {};
  data.forEach(d => {
    vals[d[field]] = 0 || vals[d[field]];
    vals[d[field]] += 1;
  });
  return d3
    .scalePoint()
    .domain(Object.keys(vals).sort())
    .range([0, rangeMax])
    .padding(padding);
}
