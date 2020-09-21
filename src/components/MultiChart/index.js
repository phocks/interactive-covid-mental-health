import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import useWindowSize from "./useWindowSize";
import { Fade } from "@material-ui/core";
import styles from "./styles.scss";

// D3 imports
import * as d3Select from "d3-selection";
import * as d3Scale from "d3-scale";
import * as d3Fetch from "d3-fetch";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3ScaleChromatic from "d3-scale-chromatic";
import * as d3Transition from "d3-transition";
import * as d3Format from "d3-format";
import * as d3Shape from "d3-shape";

// Combine them all into a single object
const d3 = {
  ...d3Select,
  ...d3Scale,
  ...d3Fetch,
  ...d3Array,
  ...d3Axis,
  ...d3ScaleChromatic,
  ...d3Transition,
  ...d3Format,
  ...d3Shape,
};

// Local library imports
import {
  sortData,
  calculateMargins,
  xTicks5,
  xTicks6,
  generateAverageData,
} from "./lib";

// File scoped constants
const TRANSITION_DURATION = 0;
const dotRadius = 5;
const LINE_ANIMATION_DURATION = 2000;
const TICK_TEXT_MARGIN = 4;

// Load our data and assign to object
const dataObject = {
  allied: sortData(
    require("./data/allied-data.json"),
    "Medicare benefits per 100 people ($)"
  ),
  distressed: require("./data/distressed-data.json"),
  gpFocus: require("./data/gp-focus.json"),
};

// The main React function component
const MultiChart = (props) => {
  const { xField, yField, ...restProps } = props;
  const root = useRef(); // SVG element ref
  const windowSize = useWindowSize();

  // Set up transition function
  const t = d3.transition().duration(750);

  // TODO: change this to have a prop that differentiates between chart types
  const xTicks = props.chartType === "line" ? xTicks5 : xTicks6;

  // Initialise state
  const [isDocked, setIsDocked] = useState(null);
  const [hasBeenDocked, setHasBeenDocked] = useState(false)
  const [margin, setMargin] = useState({
    top: 0, // Proper margins are calculated later
    right: 0,
    bottom: 0,
    left: 0,
  });
  const [svgWidth, setSvgWidth] = useState(0);

  // Instance vars using refs
  // This object will stick around over the lifetime
  // of the component. We attach SVG elements etc to this
  // using component.svg = d3.select...... etc etc.
  const componentRef = useRef({});
  const { current: component } = componentRef;

  const lineGenerator = d3
    .line()
    .defined((d) => !isNaN(d[yField]))
    .x((d) => scaleX(d[xField]))
    .y((d) => scaleY(d[yField]));

  // Format y tick values with $ or % depending on type
  const formatYTicks = (x) => {
    if (props.chartType === "line") return `${x}%`;
    else if (props.chartType === "dot") {
      if (x === 0) return `$${x}`;
      const commaFormatter = d3.format(",");
      return `${commaFormatter(x)}`;
    } else return x;
  };

  const initChart = () => {
    // Set component scoped SVG selection
    component.svg = d3.select(root.current);

    // Add our x & y axes groups to component scoped ref
    // (We actually draw the axes later in the initial window size effect)
    component.xAxis = component.svg.append("g").classed("x-axis", true);
    component.yAxis = component.svg.append("g").classed("y-axis", true);
  };

  // const createChart = () => {
  //   const initialSvg = d3.select(root.current);

  //   width = initialSvg.node().getBoundingClientRect().width;
  //   height = window.innerHeight;

  //   margin = calculateMargins(width, height);

  //   scaleX = d3
  //     .scalePoint()
  //     .domain(xTicks)
  //     .range([margin.left, width - margin.right]);

  //   scaleY = d3
  //     .scaleLinear()
  //     .domain([0, props.yMax])
  //     .range([height - margin.bottom, margin.top]);

  //   xAxis = (g) =>
  //     g.attr("transform", `translate(0,${height - margin.bottom})`).call(
  //       d3
  //         .axisBottom(scaleX)
  //         .tickFormat("")
  //         .tickValues(xTicks.filter((tick) => typeof tick === "string"))
  //     );

  //   yAxis = makeYAxis;

  //   // Draw the axis
  //   initialXAxisGroup = initialSvg.append("g").call(xAxis);
  //   initialYAxisGroup = initialSvg.append("g").call(yAxis);

  //   initialSvg.attr("width", width);
  //   initialSvg.attr("height", height);

  //   // ADD LINE BACK LATER
  //   // if (props.solidLine) {
  //   //   // Create the path
  //   //   chartSolidPath = initialSvg
  //   //     .append("path")
  //   //     .attr("fill", "none")
  //   //     .attr("stroke", "none")
  //   //     .attr("stroke-width", 2)
  //   //     .attr("stroke", props.dotColor)
  //   //     .attr("stroke-linejoin", "round")
  //   //     .attr("stroke-linecap", "round")
  //   //     .data([dataObject[props.dataKey]])
  //   //     .attr("d", lineGenerator);

  //   //   // Get the length of the line
  //   //   const totalLength = chartSolidPath.node().getTotalLength();

  //   //   // Animate the path
  //   //   // TODO: focus on animations later
  //   //   chartSolidPath
  //   //     .attr("stroke-dasharray", `${totalLength},${totalLength}`)
  //   //     .attr("stroke-dashoffset", totalLength)
  //   //     .transition()
  //   //     .duration(LINE_ANIMATION_DURATION)
  //   //     .attr("stroke-dashoffset", 0);
  //   // }

  //   if (props.averageLine) {
  //     const averageData = generateAverageData(
  //       dataObject[props.dataKey],
  //       xField,
  //       yField
  //     );

  //     // Create the path
  //     chartAveragePath = initialSvg
  //       .append("path")
  //       .data([averageData])
  //       .attr("fill", "none")
  //       .attr("stroke", "#929292")
  //       .attr("stroke-width", 1)
  //       .attr("stroke-dasharray", `2, 2`)
  //       .attr("d", lineGenerator);
  //   }

  //   console.log(isDocked);

  //   const initialDots = initialSvg
  //     .selectAll("circle")
  //     .data(dataObject[props.dataKey])
  //     .join("circle")
  //     .style("stroke", "rgba(255, 255, 255, 0.6)")
  //     .style("stroke-width", "1.5")
  //     .style("fill", props.dotColor)
  //     .style("transition", "opacity 1s")
  //     .style("opacity", isDocked ? 1.0 : 0.0)
  //     .attr("cx", (d) => {
  //       if (d[xField] === "National") {
  //         return 200;
  //       }

  //       return scaleX(d[xField]);
  //     })
  //     .attr("cy", (d) => scaleY(d[yField]))
  //     .attr("r", dotRadius);

  //   setSvg(initialSvg);
  //   setDots(initialDots);
  //   setSolidPath(chartSolidPath);
  //   setAveragePath(chartAveragePath);
  //   setXAxisGroup(initialXAxisGroup);
  //   setYAxisGroup(initialYAxisGroup);
  // };

  const processLine = () => {
    component.svg
      .selectAll("circle")
      .data(dataObject[props.dataKey])
      .join(
        (enter) =>
          enter
            .append("circle")
            .attr("cy", (d) => component.scaleY(0))
            .style("stroke", "rgba(255, 255, 255, 0.6)")
            .style("stroke-width", "1.5")
            .style("fill", props.dotColor)
            .attr("cx", (d) => {
              if (d[xField] === "National") {
                return -2000000;
              }

              return component.scaleX(d[xField]);
            })
            .attr("r", dotRadius)
            .call((enter) =>
              enter.transition(t).attr("cy", (d) => component.scaleY(d[yField]))
            ),
        (update) =>
          update.attr("cx", (d) => {
            if (d[xField] === "National") {
              return -2000000;
            }

            return component.scaleX(d[xField]);
          }),
        (exit) => exit.remove()
      );
  };

  // Initial layout effect run once on mount
  useLayoutEffect(() => {
    // Use intersection observer to trigger animation to start
    // only afer we scroll the chart into view
    let callback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsDocked(true);
        } else if (!entry.isIntersecting) {
          setIsDocked(false);
        }
      });
    };

    let observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.99,
    });

    observer.observe(root.current);

    // Init layout effect after delay
    // setTimeout(() => {
    // createChart();
    // }, 2000);

    // Do on unmount
    return () => {
      component.svg = null;
      observer.disconnect();
    };
  }, []);

  // Handle initial chart draw and also chart updates
  useLayoutEffect(() => {
    // Wait till we have an svg mounted
    if (!component.svg) return;

    const width = component.svg.node().getBoundingClientRect().width;
    const height = window.innerHeight;

    component.svg.attr("width", width);
    component.svg.attr("height", height);

    // Recalculate margins
    const margin = calculateMargins(width, height);

    // Update component state for calculated values
    setMargin(margin);
    setSvgWidth(width);

    // Just make local scale functions again
    component.scaleX = d3
      .scalePoint()
      .domain(xTicks)
      .range([margin.left, width - margin.right]);

    component.scaleY = d3
      .scaleLinear()
      .domain([0, props.yMax])
      .range([height - margin.bottom, margin.top]);

    // Recalculate axis generators
    const makeXAxis = (g) =>
      g.attr("transform", `translate(0,${height - margin.bottom})`).call(
        d3
          .axisBottom(component.scaleX)
          .tickFormat("")
          .tickValues(xTicks.filter((tick) => typeof tick === "string"))
          .tickSize(props.chartType === "line" ? 0 : 6)
      );

    const makeYAxis = (group) =>
      group
        .attr("transform", `translate(${margin.left},0)`)
        .call(
          d3
            .axisLeft(component.scaleY)
            .tickPadding([3])
            .tickSize(-(width - margin.left - margin.right))
            .ticks(5)
            .tickFormat(formatYTicks)
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .selectAll(".tick line")
            .style("stroke", "#a4a4a4")
            .style("stroke-opacity", 0.5)
            .style("stroke-width", 1)
            .style("shape-rendering", "crispEdges")
        )
        .call((g) => g.selectAll(".tick text"));

    // Actually update the axes in the SVG
    component.xAxis.call(makeXAxis);
    component.yAxis.call(makeYAxis);

    if (hasBeenDocked) processLine();

    //   if (props.solidLine && solidPath) {
    //     // Resize the path
    //     solidPath.attr("d", lineGenerator);
    //   }

    //   if (props.averageLine && averagePath) {
    //     averagePath.attr("d", lineGenerator);
    //   }

    //   dots
    //     .attr("cx", (d) => scaleX(d[xField]))
    //     .attr("cy", (d) => scaleY(d[yField]));
  }, [windowSize.width, windowSize.height, props.chartType]);

  // Handle chart data change (will usually be via scrollyteller marks)
  useLayoutEffect(() => {
    if (!component.svg) return;

    //   scaleX.domain(props.xNumberOfTicks === 5 ? xTicks5 : xTicks6);
    //   scaleY.domain([0, props.yMax]);

    //   yAxis = makeYAxis;

    //   xAxisGroup.transition().duration(TRANSITION_DURATION).call(xAxis);

    //   yAxisGroup.transition().duration(TRANSITION_DURATION).call(yAxis);

    //   // Check if we want a solid line between dots
    //   if (props.solidLine) {
    //     if (solidPath) solidPath.remove();

    //     const newSolidPath = svg
    //       .append("path")
    //       .attr("fill", "none")
    //       .attr("stroke", "none")
    //       .attr("stroke-width", 2)
    //       .attr("stroke", props.dotColor)
    //       .attr("stroke-linejoin", "round")
    //       .attr("stroke-linecap", "round")
    //       .data([dataObject[props.dataKey]])
    //       .attr("d", lineGenerator);

    //     // // Get the length of the line
    //     // const totalLength = path.node().getTotalLength();

    //     // // Animate the path
    //     // // TODO: focus on animations later
    //     // path
    //     //   .attr("stroke-dasharray", `${totalLength},${totalLength}`)
    //     //   .attr("stroke-dashoffset", totalLength)
    //     //   .transition()
    //     //   .duration(LINE_ANIMATION_DURATION)
    //     //   .attr("stroke-dashoffset", 0);

    //     setSolidPath(newSolidPath);
    //   } else if (solidPath) solidPath.remove();

    //   // Check if we want to average the dots and plot a dotted line
    //   if (props.averageLine) {
    //     if (averagePath) averagePath.remove();

    //     const averageData = generateAverageData(
    //       dataObject[props.dataKey],
    //       xField,
    //       yField
    //     );

    //     // Create the path
    //     const newAveragePath = svg
    //       .append("path")
    //       .data([averageData])
    //       .attr("fill", "none")
    //       .attr("stroke", "#929292")
    //       .attr("stroke-width", 1)
    //       .attr("stroke-dasharray", `2, 2`)
    //       .attr("d", lineGenerator);

    //     setAveragePath(newAveragePath);
    //   } else if (averagePath) averagePath.remove();

    //   // TODO: we need to handle extra data in the join I think
    //   // see here: https://observablehq.com/@d3/selection-join
    //   // NOTE: Fixed now. We needed to explicitly set attributes
    //   // and styles etc.
    //   const newDots = svg
    //     .selectAll("circle")
    //     .data(dataObject[props.dataKey])
    //     .join("circle")
    //     .style("stroke", "rgba(255, 255, 255, 0.6)")
    //     .style("stroke-width", "1.5")
    //     .style("fill", props.dotColor)
    //     .style("transition", "opacity 1s")
    //     .attr("cx", (d) => {
    //       if (d[xField] === "National") {
    //         return -200000;
    //       }

    //       return scaleX(d[xField]);
    //     })
    //     .attr("cy", (d) => scaleY(d[yField]))
    //     .attr("r", dotRadius);

    //   // Make sure dots are on top so raise them up
    //   newDots.raise();

    //   setDots(newDots);
  }, [props.yMax, props.xNumberOfTicks, props.dataKey]);

  // Detect docked or not
  useEffect(() => {
    if (!component.svg) {
      // Attach the chart once we know if we are docked
      // (or not)
      initChart();
      return;
    }

    console.log(`Component is ${isDocked ? "DOCKED" : "UNDOCKED"}`);

    if (isDocked) {
      // Start doing something
      console.log("Attaching dots!");
      setHasBeenDocked(true);

      processLine();
    } else {
      // Do something else (or nothing)
    }
  }, [isDocked]);

  // Calculate values for return
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = window.innerHeight - margin.top - margin.bottom;

  return (
    <div className={styles.root}>
      <div
        className={styles.highlightBars}
        style={{ top: margin.top, left: margin.left, width: chartWidth }}
      >
        {props.chartType === "line" && (
          <>
            <span
              className={styles.lineHighlightBar}
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "2px solid #f0f0f0",
                backgroundColor: "rgba(191, 191, 191, 0.1)",
              }}
            ></span>
            <span
              className={styles.lineHighlightBar}
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "2px solid #f0f0f0",
                backgroundColor: "rgba(191, 191, 191, 0.1)",
              }}
            ></span>
            <span
              className={styles.lineHighlightBar}
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "2px solid #f0f0f0",
                backgroundColor: "rgba(191, 191, 191, 0.1)",
              }}
            ></span>
            <span
              className={styles.lineHighlightBar}
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "2px solid #f0f0f0",
                backgroundColor: "rgba(191, 191, 191, 0.1)",
              }}
            ></span>
            <span
              className={styles.lineHighlightBar}
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                backgroundColor: "rgba(191, 191, 191, 0.1)",
              }}
            ></span>
          </>
        )}

        {props.chartType === "dot" && (
          <>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "1px solid #f0f0f0",
              }}
            ></span>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "1px solid #f0f0f0",
              }}
            ></span>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "1px solid #f0f0f0",
              }}
            ></span>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "1px solid #f0f0f0",
              }}
            ></span>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
                borderRight: "1px solid #f0f0f0",
              }}
            ></span>
            <span
              style={{
                height: `${chartHeight}px`,
                flexGrow: 1,
              }}
            ></span>
          </>
        )}
      </div>
      <svg className={"scatter-plot"} ref={root}></svg>
      <div className={styles.devInfo}>{isDocked ? "DOCKED" : "UNDOCKED"}</div>

      <div
        className={styles.chartTitle}
        style={{ top: margin.top, left: margin.left }}
      >
        <Fade in={props.chartType !== "line"}>
          <span>Medicare rebates per 100 people ($)</span>
        </Fade>
      </div>

      {props.chartType === "line" && (
        <div
          className={styles.tickTextContainer}
          style={{
            bottom: margin.bottom,
            left: margin.left,
            width: `${chartWidth}px`,
          }}
        >
          <div className={styles.tickTextBox}>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>

          <div className={styles.tickDescription}>
            <div
              style={{
                width: `${chartWidth / 5 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Most disadvantaged
            </div>
            <div
              style={{
                width: `${chartWidth / 5 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Least disadvantaged
            </div>
          </div>
        </div>
      )}

      {props.chartType === "dot" && (
        <div
          className={styles.tickTextContainer}
          style={{
            bottom: margin.bottom,
            left: margin.left,
            width: `${chartWidth}px`,
          }}
        >
          <div className={styles.dotTickTextBox}>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Remote
            </span>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Outer regional
            </span>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Inner regional
            </span>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Major city low advantage
            </span>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Major city medium advantage
            </span>
            <span
              style={{
                width: `${chartWidth / 6 - TICK_TEXT_MARGIN}px`,
              }}
            >
              Major city high advantage
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Set default props
MultiChart.defaultProps = {
  chartType: "dot",
  dotColor: "red",
  xField: "SA3 group",
  yField: "Medicare benefits per 100 people ($)",
};

export default MultiChart;
