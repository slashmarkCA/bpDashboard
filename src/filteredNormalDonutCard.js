// filteredNormalDonutCard.js
// ============================================================
// Date-filtered hierarchical Normal vs Not Normal donut
// ============================================================

console.log('[DONUT] loading filteredNormalDonutCard.js');

let normalDonutChart = null;

const COLORS = {
  NormalInner: '#30693c',
  NormalOuter: '#d1e3d5',
  Elevated: '#7fb13d',
  Stage1: '#efcec9',
  Stage2: '#ebb6ad',
  Crisis: '#ad322d',
  NotNormal: '#c44a37'
};

function renderNormalDonut(filteredData) {
  const canvas = document.getElementById('normalDonutChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (!filteredData || filteredData.length === 0) {
    if (normalDonutChart) {
      normalDonutChart.destroy();
      normalDonutChart = null;
    }
    return;
  }

  // Calculate totals for percentages
  const totalReadings = filteredData.length;
  const counts = { Normal: 0, Elevated: 0, Stage1: 0, Stage2: 0, Crisis: 0 };

  filteredData.forEach(r => {
    switch (r.ReadingCategory) {
      case 'Normal': counts.Normal++; break;
      case 'Elevated': counts.Elevated++; break;
      case 'Hypertension Stage 1': counts.Stage1++; break;
      case 'Hypertension Stage 2': counts.Stage2++; break;
      case 'Hypertensive Crisis': counts.Crisis++; break;
    }
  });

  const notNormalTotal = counts.Elevated + counts.Stage1 + counts.Stage2 + counts.Crisis;

  const data = {
    datasets: [
      {
        // 🔸 OUTER RING — CHILDREN (25% thickness)
        data: [counts.Normal, counts.Elevated, counts.Stage1, counts.Stage2, counts.Crisis],
        backgroundColor: [COLORS.NormalOuter, COLORS.Elevated, COLORS.Stage1, COLORS.Stage2, COLORS.Crisis],
        borderWidth: 1,
        weight: 1 // Weight 1 of 4 total parts
      },
      {
        // 🔸 INNER RING — PARENTS (75% thickness)
        data: [counts.Normal, notNormalTotal],
        backgroundColor: [COLORS.NormalInner, COLORS.NotNormal],
        borderWidth: 1,
        weight: 3 // Weight 3 of 4 total parts
      }
    ]
  };

  if (normalDonutChart) {
    normalDonutChart.destroy();
  }

  normalDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '40%',
      // Restrict internal events to click/touch to stop distracting hovers
      events: ['click', 'touchstart'],
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percentage = ((value / totalReadings) * 100).toFixed(0) + '%';

              let labelTitle = '';
              if (context.datasetIndex === 1) {
                const innerLabels = ['Normal Category', 'Not Normal Category'];
                labelTitle = innerLabels[context.dataIndex];
              } else {
                const outerLabels = ['Normal', 'Elevated', 'Hypertension Stage 1', 'Hypertension Stage 2', 'Hypertensive Crisis'];
                labelTitle = outerLabels[context.dataIndex];
              }

              return [`${labelTitle}: `, `Total: ${value}`, `${percentage} of Total Readings`];
            }
          }
        }
      }
    }
  });

  // 🖱️ THE EVENT HANDLER: Clear tooltips when mouse leaves the canvas
  canvas.onmouseleave = () => {
    if (normalDonutChart) {
      normalDonutChart.setActiveElements([]); // Clears selection
      normalDonutChart.update();              // Re-renders to hide tooltip
    }
  };
}

window.updateNormalDonutCard = renderNormalDonut;