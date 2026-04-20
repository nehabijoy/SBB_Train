// Setup
const margin = { top: 30, right: 30, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand().range([0, width]).padding(0.2);
const y = d3.scaleLinear().range([height, 0]);

const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
const yAxis = svg.append("g");

svg.append("text").attr("x", width / 2).attr("y", height + 40).style("text-anchor", "middle").text("Hour of the Day");
svg.append("text").attr("transform", "rotate(-90)").attr("y", -40).attr("x", -height / 2).style("text-anchor", "middle").text("Average Delay (Minutes)");

//Storing CSV data
let globalData = [];

//Loading CSV data for chart render
d3.csv("Data/aggregated_delays.csv").then(function(data) {
    
    //strings from CSV into numbers
    globalData = data.map(d => ({
        year: d.year,
        hour: parseInt(d.hour),
        avgDelay: parseFloat(d.delay_minutes)
    }));

    document.getElementById("btn-2019").addEventListener("click", () => updateChart('2019'));
    document.getElementById("btn-2020").addEventListener("click", () => updateChart('2020'));
    document.getElementById("btn-2026").addEventListener("click", () => updateChart('2026'));

    //Starting chart shown
    updateChart('2020');

}).catch(error => {
    d3.select("#chart-title").text(`Data/aggregated_delays.csv file not found.`);
    console.error(error);
});

//Updates chart to show data for selected year.
function updateChart(year) {
    d3.select("#chart-title").text(`Average Train Delays by Hour (${year})`);

    document.querySelectorAll('.d3-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${year}`).classList.add('active');

    const yearData = globalData.filter(d => d.year === year).sort((a, b) => d3.ascending(a.hour, b.hour));

    if (yearData.length === 0) return;

    x.domain(yearData.map(d => d.hour));
    
    const maxDelay = d3.max(yearData, d => d.avgDelay) || 0;
    const minDelay = d3.min(yearData, d => d.avgDelay) || 0;
    
    y.domain([Math.min(-1, minDelay), Math.max(5, maxDelay)]); 

    //Transitions
    const zeroLineY = y(0);
    xAxis.transition().duration(500).attr("transform", `translate(0,${zeroLineY})`).call(d3.axisBottom(x));
    yAxis.transition().duration(500).call(d3.axisLeft(y));

    //Adding all data to chart
    const bars = svg.selectAll(".bar").data(yearData, d => d.hour);

    bars.exit().transition().duration(500).attr("y", y(0)).attr("height", 0).remove();

    const barsEnter = bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.hour))
        .attr("width", x.bandwidth())
        .attr("y", y(0))
        .attr("height", 0);

    barsEnter.merge(bars)
        .transition().duration(500)
        .attr("x", d => x(d.hour))
        .attr("width", x.bandwidth())
        .attr("y", d => d.avgDelay > 0 ? y(d.avgDelay) : y(0))
        .attr("height", d => Math.abs(y(d.avgDelay) - y(0)))
        .attr("fill", d => d.avgDelay > 0 ? "#d9534f" : "#5bc0de");
    }