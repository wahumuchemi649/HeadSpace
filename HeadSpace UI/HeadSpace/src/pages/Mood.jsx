import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

// Register chart.js modules
ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

function MoodChart() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Mood Score",
        data: [3, 4, 5, 6, 5, 4, 7], // Example mood values (1–10)
        fill: false,
        borderColor: "#3d1d77",
        pointBackgroundColor: "#61dafb",
        tension: 0.4, // smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 10,
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default MoodChart;
