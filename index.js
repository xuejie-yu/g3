//randomly generate the data for 30 days with 4 data sample each day
const generateData = () => {
  const start = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const data = [];
  for (let i = 0; i < 30 * 4; i++) {
    data.push({
      value: Math.floor(Math.random() * 100),
      date: new Date(start + i * 6 * 60 * 60 * 1000).toISOString()
    });
  }
  return data;
};

//shorten the iso time stamp for display
const shortenTimeStampe = (isoTime) => {
  return isoTime.replace("2020-", "").replace("T", " ").substr(0, 11);
}

// filter the data by start and end time range and then merge into specified number of buckets
const processData = (data, bucket, start, end) => {
  if (start && end) {
    data = data.filter(d => 
      new Date(d.date).getTime() >= start && new Date(d.date).getTime() <= end
    );
  }
  bucket = data.length > bucket ? bucket : data.length;
  const gData = [];
  for (let i = 0; i < bucket; i++) {
    gData[i] = [];
  }
  const dates = data.map(d => new Date(d.date).getTime());
  const min = Math.min(...dates);
  const max = Math.max(...dates) + 1;
  const range = (max - min) / bucket;
  data.forEach(d => {
    gData[Math.floor((new Date(d.date).getTime() - min) / range)].push(d);
  });
  const pData = gData.map(group => {
    const value = group.map(d => d.value).reduce((a, v) => a + v, 0);
    const date = shortenTimeStampe(group[0].date) + "-" + shortenTimeStampe(group[group.length - 1].date);
    return {
      value,
      date
    }
  });
  return pData;
};

//draw the graph: stardard d3 flow
const drawGraph = (input, bucket) => {

  const data = processData(input, bucket);

  const height = 600;
  const width = 800;
  const margin = ({top: 20, right: 0, bottom: 130, left: 40})


  const barWidth = (width - margin.left - margin.right) / bucket - 20;

  //x axis config
  const x = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([margin.left, width - margin.right])
      .padding(0.5);

  const xLow = margin.left;
  const xHigh = width - margin.right;

  const xAxis = g => g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")  
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");

  //y axis config
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height - margin.bottom, margin.top]);

  const yAxis = g => g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));    



  const svg = d3.select("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .call(zoom);

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.date))
    .attr("y", d => y(d.value))
    .attr("fill", "lightblue")
    .attr("height", d => y(0) - y(d.value))
    .attr("width", x.bandwidth());

  svg.append("g")
      .attr("class", "x-axis")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y-axis")
      .call(yAxis);

  function zoom(svg) {

    const extent = [[margin.left, margin.top], [width - margin.right, height - margin.top]];

    svg.call(d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent(extent)
        .extent(extent)
        .on("zoom", zoomed));

    function zoomed() {

      //calculate new x axis position
      const [xLow_new, xHigh_new] = [margin.left, width - margin.right].map(d => d3.event.transform.applyX(d));

      //get max and min date
      const dates = input.map(d => new Date(d.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates) + 1;

      //calculate the time range of data to be displayed in the svg
      const start = Math.floor((margin.left - xLow_new) * (maxDate - minDate) / (xHigh_new - xLow_new) + minDate);

      const end =  Math.floor((width - margin.right - xLow_new) * (maxDate - minDate) / (xHigh_new - xLow_new) + minDate);

      //process the data only within the time range
      const data2 = processData(input, bucket, start, end);

      //redraw the bars according to new data
      x.range([margin.left, width - margin.right])
       .domain(data2.map(d => d.date));

      svg.select(".x-axis").remove();
      svg.append("g")
        .attr("class", "x-axis")
        .call(xAxis);

      svg
        .selectAll("rect")
        .data(data2)
        .join("rect")
        .attr("x", d => x(d.date))
        .attr("y", d => y(d.value))
        .attr("fill", "lightblue")
        .attr("height", d => y(0) - y(d.value))
        .attr("width", x.bandwidth());
    }
  }
}

//randomly generate the data for 30 days with 120 data points
//merge the data points to fulfil the requrement that drawing 5 bars in the graph
//with zooming and navigating along time series capability
const data = generateData();
const bars = 5;
drawGraph(data, bars);