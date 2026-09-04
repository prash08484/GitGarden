import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import './hashmap.css'

const generateActivityData = (startDate, endDate) => {
  const data = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const count = Math.floor(Math.random() * 50);
    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: count,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data;
};

const getPanelColors = (maxCount) => {
  const colors = {};
  for (let i = 0; i <= maxCount; i++) {
    const greenValue = Math.floor((i / maxCount) * 255);
    colors[i] = `rgb(0, ${greenValue}, 0)`;
  }

  return colors;
};

const HeatMapProfile = () => {
  const [activityData, setActivityData] = useState([]);
  const [panelColors, setPanelColors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const startDate = "2025-03-06";
      const endDate = "2026-03-06";
      const data = generateActivityData(startDate, endDate);
      setActivityData(data);

      const maxCount = Math.max(...data.map((d) => d.count));
      setPanelColors(getPanelColors(maxCount));
    };

    fetchData();
  }, []);


  return (
    <div className="HeatMapWrapper">
      <h4>Recent Contributions</h4>
      <HeatMap
        className="HeatMapProfile"
        value={activityData}
        weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
        startDate={new Date("2025-03-06")}
        rectSize={window.innerWidth < 600 ? 12 : 18}
        space={4}
        rectProps={{ rx: 3 }}
        panelColors={panelColors}
      />



    </div>
  );
};

export default HeatMapProfile;