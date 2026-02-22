let pieChart, barChart, lineChart;

// ================= DARK MODE =================
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// ================= LOADER =================
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// ================= MAIN =================
function generateCostBreakdown() {

  showLoader();

  setTimeout(() => {

    const beds = parseInt(document.getElementById("bedsInput").value);
    const area = parseFloat(document.getElementById("areaInput").value);
    const includeFood = document.getElementById("foodToggle").checked;

    const result = calculateCost(beds, area, includeFood);

    if (!result) {
      hideLoader();
      return;
    }

    const {
      operational,
      manpowerDetails,
      manpowerTotal,
      grandTotal,
      costPerBed,
      analyticsData
    } = result;

    const { manpower, food, rm, hk, wifi } = analyticsData;

    const highest = Math.max(manpower, food, rm, hk, wifi);
    const efficiency = manpowerTotal === 0 ? 0 : (operational.total / manpowerTotal).toFixed(2);

    // ================= OUTPUT =================
    document.getElementById("output").innerHTML = `

    <!-- KPI CARDS -->
    <div class="row g-4">

      <div class="col-lg-3 col-md-6">
        <div class="card p-4 text-center shadow-sm">
          <h6>Total Cost</h6>
          <h4>₹ ${grandTotal.toLocaleString()}</h4>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card p-4 text-center shadow-sm">
          <h6>Cost Per Bed</h6>
          <h4>₹ ${costPerBed.toFixed(0)}</h4>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card p-4 text-center shadow-sm">
          <h6>Highest Expense</h6>
          <h5>${highest === manpower ? "Manpower" :
            highest === food ? "Food" :
            highest === rm ? "R&M" :
            highest === hk ? "Housekeeping" : "WiFi"}</h5>
        </div>
      </div>

      <div class="col-lg-3 col-md-6">
        <div class="card p-4 text-center shadow-sm">
          <h6>Efficiency Ratio</h6>
          <h5>${efficiency} : 1</h5>
        </div>
      </div>

    </div>

    <!-- CHARTS -->
    <div class="row g-4 mt-4 mb-5">
      <div class="col-lg-4">
        <div class="card p-3 shadow-sm">
          <canvas id="pieChart"></canvas>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card p-3 shadow-sm">
          <canvas id="barChart"></canvas>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card p-3 shadow-sm">
          <canvas id="lineChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 🔥 FULL DEPARTMENT DEEP DIVE -->
    <div class="card p-4 shadow-sm">
      <h5 class="mb-3">Department Deep Dive</h5>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Department</th>
              <th>Sub Category</th>
              <th>Coverage</th>
              <th>Headcount / Units</th>
              <th>Rate (₹)</th>
              <th>Total Cost (₹)</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>

            <!-- MANPOWER -->
            ${manpowerDetails.map(row => `
              <tr>
                <td class="fw-semibold text-primary">Manpower</td>
                <td>${row.role}</td>
                <td>${row.coverage}</td>
                <td>${row.headcount}</td>
                <td>₹ ${row.salary.toLocaleString()}</td>
                <td class="fw-bold">₹ ${row.total.toLocaleString()}</td>
                <td>${((row.total / grandTotal) * 100).toFixed(1)}%</td>
              </tr>
            `).join("")}

            <tr class="table-primary fw-bold">
              <td colspan="5">Manpower Total</td>
              <td>₹ ${manpowerTotal.toLocaleString()}</td>
              <td>${((manpowerTotal / grandTotal) * 100).toFixed(1)}%</td>
            </tr>

            <!-- FOOD -->
            <tr>
              <td class="fw-semibold text-success">Food</td>
              <td>Food Cost</td>
              <td>Per Bed</td>
              <td>${beds}</td>
              <td>₹ 3,000</td>
              <td class="fw-bold">₹ ${food.toLocaleString()}</td>
              <td>${((food / grandTotal) * 100).toFixed(1)}%</td>
            </tr>

            <!-- HK -->
            <tr>
              <td class="fw-semibold text-warning">Housekeeping</td>
              <td>HK Material</td>
              <td>Per Sqft</td>
              <td>${area}</td>
              <td>₹ 0.40</td>
              <td class="fw-bold">₹ ${hk.toLocaleString()}</td>
              <td>${((hk / grandTotal) * 100).toFixed(1)}%</td>
            </tr>

            <!-- RM -->
            <tr>
              <td class="fw-semibold text-info">R&M</td>
              <td>Repair & Maintenance</td>
              <td>Per Bed</td>
              <td>${beds}</td>
              <td>₹ 98</td>
              <td class="fw-bold">₹ ${rm.toLocaleString()}</td>
              <td>${((rm / grandTotal) * 100).toFixed(1)}%</td>
            </tr>

            <!-- WIFI -->
            <tr>
              <td class="fw-semibold text-secondary">WiFi</td>
              <td>Internet Cost</td>
              <td>Per Bed</td>
              <td>${beds}</td>
              <td>₹ 179</td>
              <td class="fw-bold">₹ ${wifi.toLocaleString()}</td>
              <td>${((wifi / grandTotal) * 100).toFixed(1)}%</td>
            </tr>

            <!-- GRAND TOTAL -->
            <tr class="fw-bold table-dark">
              <td colspan="5">Grand Total</td>
              <td>₹ ${grandTotal.toLocaleString()}</td>
              <td>100%</td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
    `;

    // ✅ charts unchanged
    renderCharts(manpower, food, rm, hk, wifi, grandTotal, costPerBed);

    hideLoader();

  }, 1000);
}

// ================= COST ENGINE =================
function calculateCost(beds, area, includeFood = true) {

  if (beds <= 0 || area <= 0) {
    alert("Please enter valid Beds and Area");
    return null;
  }

  // Operational
  const operational = {
    food: includeFood ? beds * 3000 : 0,
    rm: beds * 98,
    housekeepingMaterial: area * 0.40,
    wifi: beds * 179
  };

  operational.total =
    operational.food +
    operational.rm +
    operational.housekeepingMaterial +
    operational.wifi;

  // Manpower deep dive
  const roles = [
    { role: "Zonal Head", ratio: 5000, salary: 100000 },
    { role: "City Head", ratio: 3000, salary: 70000 },
    { role: "Cluster Manager", ratio: 1000, salary: 40000 },
    { role: "Deputy Cluster Manager", ratio: 300, salary: 35000 },
    { role: "Unit Manager", ratio: 150, salary: 25000 },
    { role: "Care Desk Executive", ratio: 1000, salary: 20000 },
    { role: "R&M Supervisor", ratio: 1500, salary: 25000 },
    { role: "MST Technician", ratio: 600, salary: 20000 },
    { role: "Kitchen Helper", ratio: 35, salary: 15000 },
    { role: "Security Guard", ratio: 50, salary: 16000 },
    { role: "Housekeeping Staff", ratio: 25, salary: 16000 }
  ];

  let manpowerDetails = [];
  let manpowerTotal = 0;

  roles.forEach(r => {
    if (beds > r.ratio) {
      const headcount = Math.ceil(beds / r.ratio);
      const totalCost = headcount * r.salary;

      manpowerDetails.push({
        department: "Manpower",
        role: r.role,
        coverage: `1 per ${r.ratio} beds`,
        headcount,
        salary: r.salary,
        total: totalCost
      });

      manpowerTotal += totalCost;
    }
  });

  const grandTotal = manpowerTotal + operational.total;
  const costPerBed = grandTotal / beds;

  return {
    operational,
    manpowerDetails,
    manpowerTotal,
    grandTotal,
    costPerBed,
    analyticsData: {
      manpower: manpowerTotal,
      food: operational.food,
      rm: operational.rm,
      hk: operational.housekeepingMaterial,
      wifi: operational.wifi
    }
  };
}

// ================= CHARTS =================
function renderCharts(manpower, food, rm, hk, wifi, total, perBed) {

  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();

  const labels = ["Manpower", "Food", "R&M", "HK", "WiFi"];
  const data = [manpower, food, rm, hk, wifi];

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#6F557F", "#8B5CF6", "#6366F1", "#A78BFA", "#C4B5FD"]
      }]
    }
  });

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "#8B5CF6",
        borderRadius: 8
      }]
    }
  });

  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: ["Total", "Per Bed"],
      datasets: [{
        data: [total, perBed],
        borderColor: "#6F557F",
        tension: 0.4
      }]
    }
  });
}