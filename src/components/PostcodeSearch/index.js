import React, { useEffect, useState, useRef } from "react";
import styles from "./styles.scss";
import AsyncSelect from "react-select/async";
import axios from "axios";
import Fuse from "fuse.js";
import debounce from "debounce-promise";
import smoothScroll from "smoothscroll";

import smoothScrollPollyfill from "smoothscroll-polyfill";
smoothScrollPollyfill.polyfill();

// Import images
import mapPin from "./nav-icon-white.png";

// const MIN_INPUT_LENGTH = 3;
const BOUNCE_TIMEOUT = 250;

// Start of React component
export default props => {
  // Use Refs as component vars
  const componentRef = useRef({});
  const { current: component } = componentRef;

  const [suburbToPostcodeData, setSuburbToPostcodeData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  // const [postcodes, setPostcodes] = useState(null);
  // const [options, setOptions] = useState(null);
  // const [postcodeToSa3, setPostcodeToSa3] = useState(null);

  const init = async () => {
    component.filteredOptions = [];

    // NOTE: MOST OF THIS IS HANDLED BY FUSE FUZZY SEARCH NOW

    // Get some data on mount
    // TODO: Maybe make sure we actually have this data
    // and print an error or something
    // NOTE: We're using let vars here (for some reason)
    // let result = await axios.get(
    //   `${__webpack_public_path__}sa3-codes-and-names-and-states.json`
    // );

    // // Sort SA3 areas
    // const sa3s = result.data.sort((a, b) =>
    //   a.SA3_NAME.localeCompare(b.SA3_NAME)
    // );

    // Map to options that React select can use
    // const sa3sAsOptions = sa3s.map(sa3 => ({
    //   value: sa3.SA3_CODE,
    //   label: sa3.SA3_NAME,
    // }));

    // setOptions(sa3sAsOptions);

    // result = await axios.get(
    //   `${__webpack_public_path__}postcode-to-sa3-lookup.json`
    // );

    // setPostcodeToSa3(result.data);

    let result = await axios.get(
      `${__webpack_public_path__}suburb-to-postcode.json`
    );

    const s2pLookup = result.data;
    let suburbPostcodes = [];

    // Turn into array
    for (const suburb in s2pLookup) {
      const newSuburbObject = { suburb: suburb, postcode: s2pLookup[suburb] };
      suburbPostcodes.push(newSuburbObject);
    }

    setSuburbToPostcodeData(suburbPostcodes);

    result = await axios.get(`${__webpack_public_path__}postcodes.json`);

    // setPostcodes(result.data);
    // For some reason the debounce has a problem with component state
    // so let's use this component object thing.
    component.postcodes = result.data;
  };

  const customStyles = {
    container: provided => ({
      ...provided,
      fontFamily: "ABCSans, sans-serif",
      backgroundImage:
        "linear-gradient(90deg, rgb(62, 146, 200) 0%, rgb(62, 146, 200) 52px, rgba(8,29,134,0) 52px, rgba(0,212,255,0) 100%);",
    }),
    input: () => ({
      fontFamily: "ABCSans, sans-serif",
      "& input": {
        font: "inherit",
      },
    }),
    menu: (provided, state) => ({
      ...provided,
      borderRadius: 0,
      zIndex: 2, // So Scrolly stage doesn't go over the top
    }),
    control: (provided, state) => ({
      ...provided,
      // fontFamily: "ABCSans, sans-serif",
      borderRadius: 0,
      borderWidth: "2px",
      borderColor: "rgb(62, 146, 200)",
      backgroundColor: "transparent",
      backgroundImage: `url(${mapPin})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "auto 75%",
      backgroundPosition: "10px 45%",
      fontSize: "16px",
      cursor: "pointer",
      padding: "5px 4px 3px 58px",
      fontWeight: "400",
      boxShadow: "none",
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      display: "none",
    }),
    indicatorSeparator: (provided, state) => ({
      ...provided,
      display: "none",
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      minHeight: "40px",
    }),
  };

  const formatOptionLabel = ({ value, label, ratio }) => {
    const calculatedPercent =
      Math.round(ratio * 100) < 1 ? "<1" : Math.round(ratio * 100);
    return (
      <div style={{ display: "flex" }}>
        <div>{label}</div>
        {/* {ratio && (
          <div style={{ marginLeft: "12px", color: "#666" }}>
           <small>{calculatedPercent === 100 ? "100" : calculatedPercent}&#37;</small>
          </div>
        )} */}
      </div>
    );
  };

  // Fires when user sets postcode
  const handleChange = option => {
    props.handleSelection(option);
    setSelectedOption(option);

    // Handle clear the select
    if (option === null) {
      component.filteredOptions = [];
      return;
    }

    // Select element and scroll to it
    let [firstPanel] = Array.from(
      document.querySelectorAll("#postcodesearch ~ [data-mount]")
    );

    if (!firstPanel) return;

    // Use an NPM module to scroll because native scolling is not consistent across browsers
    smoothScroll(firstPanel);
  };

  const promiseOptions = async inputValue => {
    // If user enters digits assume postcode search
    if (/^\d{0,4}$/.test(inputValue)) {
      const filteredPostcodes = component.postcodes.filter(entry =>
        entry.toString().startsWith(inputValue)
      );

      const mappedOptions = filteredPostcodes.map(postcode => ({
        value: parseInt(postcode),
        label: postcode,
        postcode: parseInt(postcode),
        type: "postcode",
      }));

      return mappedOptions;
    }

    // Otherwise we do a fuzzy suburb search
    const fuzzyOptions = component.fuse.search(inputValue).map(entry => {
      return {
        value: entry.item.suburb,
        label: entry.item.suburb,
        postcode: entry.item.postcode,
        type: "suburb",
      };
    });

    return fuzzyOptions;
  };

  // Initial effect run once at start
  useEffect(() => {
    init();
    component.debouncedPromiseOptions = debounce(
      promiseOptions,
      BOUNCE_TIMEOUT
    );
  }, []);

  useEffect(() => {
    if (!suburbToPostcodeData) return;

    component.fuse = new Fuse(suburbToPostcodeData, {
      minMatchCharLength: 2,
      threshold: 0.4,
      distance: 50,
      keys: ["suburb"],
    });
  }, [suburbToPostcodeData]);

  const customFilterOption = (option, rawInput) => {
    const words = rawInput.split(" ");
    const pleaseInclude = words.reduce(
      (acc, cur) =>
        acc && option.label.toLowerCase().includes(cur.toLowerCase()),
      true
    );

    if (pleaseInclude)
      component.filteredOptions = [...component.filteredOptions, option];

    return pleaseInclude;
  };

  return (
    <div className={styles.root}>
      <AsyncSelect
        placeholder={"Search your suburb or postcode"}
        cacheOptions={false}
        loadOptions={component.debouncedPromiseOptions}
        onChange={(option, { action }) => {
          if (action === "select-option") {
            component.filteredOptions = [];
            handleChange(option);
          }
        }}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        // isClearable={true}
        noOptionsMessage={({ inputValue }) => {
          if (inputValue.length < 3) return "Search your suburb or postcode";
          return "Nothing found...";
        }}
        filterOption={customFilterOption}
        onInputChange={(input, { action }) => {
          if (action === "input-change") {
            component.filteredOptions = [];
          }

          if (action === "input-blur") {
            if (component.filteredOptions[0]) {
              const option = component.filteredOptions[0].data;
              props.handleSelection(option);
              handleChange(component.filteredOptions[0].data);
            }
          }
        }}
        // blurInputOnSelect={true}
        value={selectedOption}
      />
    </div>
  );
};
