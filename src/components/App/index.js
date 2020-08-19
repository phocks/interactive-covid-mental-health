import React, { useState, useEffect } from "react";
import styles from "./styles.scss";
import { Portal } from "react-portal";
import Scrollyteller from "@abcnews/scrollyteller";

import PostcodeSearch from "../PostcodeSearch";
import BackgroundStage from "../BackgroundStage";
import CustomPanel from "../CustomPanel";
import MultiChart from "../MultiChart";

let storyKeys = require("./story-keys.json");

const dataObject = {
  data1: require("./allied-data.json"),
  data2: require("./gp-focus.json")
};

export default props => {
  const [userSa3, setUserSa3] = useState(null);
  const [chartData, setChartData] = useState(storyKeys.one.dataKey);
  const [currentKey, setCurrentKey] = useState(storyKeys.one);

  

  const onMarker = config => {
    console.log(config);

    if (config.key) {
      console.log(storyKeys[config.key]);
      setCurrentKey(storyKeys[config.key]);
      setChartData(dataObject[storyKeys[config.key].dataKey])
    }
  };

  
  useEffect(() => {

  }, []); // Init effect

  // useEffect(() => {
  //   if (!userPostcode) return;
  //   if (typeof lookupData === "undefined") {
  //     console.error("There was a problem loading lookup data...");
  //     return;
  //   }

  //   const filteredLookup = lookupData.filter(entry => {
  //     if (entry.postcode.toString() === userPostcode) {
  //       return true;
  //     } else return false;
  //   });

  //   // Get the single largest ratio area
  //   const largestRatio = filteredLookup.reduce((prev, current) =>
  //     prev.ratio > current.ratio ? prev : current
  //   );

  //   console.log(filteredLookup);
  //   console.log(largestRatio);

  //   setUserSa3(largestRatio.sa3);
  // }, [userPostcode]);

  return (
    <>
      <div className={styles.root}>
        <PostcodeSearch />
      </div>

      <Portal node={document.querySelector(".scrollystagemount")}>
        <Scrollyteller
          panels={props.scrollyData.panels}
          onMarker={onMarker}
          panelComponent={CustomPanel}
        >
          <BackgroundStage>
            <MultiChart
              data={chartData}
              yMax={currentKey.yMax}
              style={"line"}
            />
          </BackgroundStage>
        </Scrollyteller>
      </Portal>
    </>
  );
};
