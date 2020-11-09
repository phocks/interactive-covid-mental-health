// Polyfills
import "core-js/features/symbol";
import "regenerator-runtime/runtime.js";
import "intersection-observer";
import "polyfill-array-includes";
import "nodelist-foreach-polyfill";

if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, "startsWith", {
    value: function (search, rawPos) {
      var pos = rawPos > 0 ? rawPos | 0 : 0;
      return this.substring(pos, pos + search.length) === search;
    },
  });
}

// Imports
import React from "react";
import { render } from "react-dom";
import App from "./components/App";
import { loadScrollyteller } from "@abcnews/scrollyteller";
import jankdefer from "jankdefer";

import * as d3Selection from "d3-selection";
const d3 = { ...d3Selection };

import buildMountPoints from "./lib/buildMountPoints";
import { addClass } from "./lib/classHelpers";

buildMountPoints([
  "postcodesearch",
  "scrollystagemount",
  "scrollystagemount2",
  "scrollystagemount3",
  "accessingcaregraphic",
  "timegraphic",
  "distancegraphic",
  "averagechartmount",
]);

// Make stage full width
const stage = document.querySelector(".scrollystagemount");
addClass(stage, "u-full");
addClass(stage, "no-margin-collapse");

const stage2 = document.querySelector(".scrollystagemount2");
addClass(stage2, "u-full");
addClass(stage2, "no-margin-collapse");

const stage3 = document.querySelector(".scrollystagemount3");
addClass(stage3, "u-full");
addClass(stage3, "no-margin-collapse");

const accessingcaregraphic = document.querySelector(".accessingcaregraphic");
addClass(accessingcaregraphic, "no-margin-bottom");

const timegraphic = document.querySelector(".timegraphic");
addClass(timegraphic, "no-margin-bottom");

// const distancegraphic = document.querySelector(".distancegraphic");
// addClass(distancegraphic, "no-margin-bottom");

const preInit = () => {
  // Handle stuff that we don't want to hot reload
  // (but do want to wait for Odyssey)
  const heroEl = d3.select(".Header").insert("div", ":first-child");
  heroEl.classed("pre-header-hero", true);

  init();
};

const init = async () => {
  // Let's mount our scrollytellers
  const scrollyData1 = loadScrollyteller("one", "u-full", "mark");
  const scrollyData2 = loadScrollyteller("two", "u-full", "mark");
  const scrollyData3 = loadScrollyteller("three", "u-full", "mark");

  render(
    <App
      projectName={"Mental Health"}
      scrollyData1={scrollyData1}
      scrollyData2={scrollyData2}
      scrollyData3={scrollyData3}
    />,
    document.querySelector(".postcodesearch")
  );
};

if (window.__ODYSSEY__) {
  jankdefer(preInit);
} else {
  window.addEventListener("odyssey:api", preInit);
  window.addEventListener("odyssey:api", init);
}

if (module.hot) {
  module.hot.accept("./components/App", async () => {
    try {
      init();
    } catch (err) {
      const imported = await import("./components/ErrorBox");
      const ErrorBox = imported.default;
      render(<ErrorBox error={err} />, root);
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(
    `[MENTAL HEALTH INTERACTIVE] public path: ${__webpack_public_path__}`
  );
}
