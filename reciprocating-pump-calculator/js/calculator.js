/**
 * Reciprocating Pump Performance Calculator
 * Mathematical, DOM Controller & Chart Engine (calculator.js)
 * Implements SI physics formulas, step-by-step breakdown, HTML5 Canvas curves, and DOM reactivity.
 */

(function (window) {
  'use strict';

  // 1. Predefined Apparatus Constants
  var CONSTANTS = {
    D: 0.055,       // Cylinder diameter (m)
    A: 0.0023578,   // Cylinder area (m²)
    L: 0.04,        // Stroke length (m)
    At: 0.1,        // Collecting tank area (m²)
    eta_m: 0.8,     // Motor efficiency (-)
    eta_t: 0.7,     // Transmission efficiency (-)
    EMC: 3200,      // Energy meter constant (pulses/kWh)
    P: 10,          // Energy meter pulses (pulses)
    hpg: 1.065,     // Pressure gauge height correction (m)
    rho: 1000,      // Density of water (kg/m³)
    g: 9.81         // Acceleration due to gravity (m/s²)
  };

  // 2. Reference Sample Experimental Readings (Available on request via Load Sample Values)
  var SAMPLE_READINGS = [
    { rpm: 149, pd: 2.5, ps: 250, r: 0.06,  t: 20, tp: 21 }, // Reading 1
    { rpm: 146, pd: 4.0, ps: 290, r: 0.08,  t: 20, tp: 16 }, // Reading 2
    { rpm: 147, pd: 6.0, ps: 300, r: 0.085, t: 20, tp: 13 }  // Reading 3
  ];

  // Zero Initial State
  var ZERO_READINGS = [
    { rpm: 0, pd: 0, ps: 0, r: 0, t: 0, tp: 0 },
    { rpm: 0, pd: 0, ps: 0, r: 0, t: 0, tp: 0 },
    { rpm: 0, pd: 0, ps: 0, r: 0, t: 0, tp: 0 }
  ];

  // Helper formatting functions
  function formatNum(val, decimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '—';
    return Number(val).toFixed(decimals !== undefined ? decimals : 2);
  }

  /**
   * Pure Math Calculation Engine
   * Calculates all intermediate values and efficiencies for a single reading set.
   */
  function calculateReadingData(input) {
    var rpm = input.rpm;
    var pd = input.pd;
    var ps = input.ps;
    var r = input.r;
    var t = input.t;
    var tp = input.tp;

    // Safety checks against division by zero or non-positive run parameters
    if (tp <= 0 || t <= 0 || rpm <= 0 || r <= 0) {
      return null;
    }

    // A. Input Power (Ei) in kW
    // Ei = (P / tp) * (3600 / EMC)
    var Ei = (CONSTANTS.P / tp) * (3600 / CONSTANTS.EMC);

    // B. Shaft Power (Es) in kW
    // Es = Ei * eta_m * eta_t
    var Es = Ei * CONSTANTS.eta_m * CONSTANTS.eta_t;

    // C. Actual Discharge (Qact) in m³/s
    // Qact = (At * R) / t
    var Qact = (CONSTANTS.At * r) / t;

    // D. Theoretical Discharge (Qtheo) in m³/s (Double-acting)
    // Qtheo = (2 * A * L * N) / 60
    var Qtheo = (2 * CONSTANTS.A * CONSTANTS.L * rpm) / 60;

    // E. Total Head (H) in metres of water
    // H = 10 * (Pd + Ps / 760) + hpg
    var H = 10 * (pd + (ps / 760)) + CONSTANTS.hpg;

    // F. Pump Output (Eo) in kW
    // Eo = (rho * g * Qact * H) / 1000
    var Eo = (CONSTANTS.rho * CONSTANTS.g * Qact * H) / 1000;

    // Final Efficiencies
    // A. Overall Efficiency (%)
    var eta_overall = (Ei > 0) ? (Eo / Ei) * 100 : 0;

    // B. Volumetric Efficiency (%)
    var eta_volumetric = (Qtheo > 0) ? (Qact / Qtheo) * 100 : 0;

    // C. Pump Efficiency (%)
    var eta_pump = (Es > 0) ? (Eo / Es) * 100 : 0;

    return {
      inputs: { rpm: rpm, pd: pd, ps: ps, r: r, t: t, tp: tp },
      Ei: Ei,
      Es: Es,
      Qact: Qact,
      Qtheo: Qtheo,
      H: H,
      Eo: Eo,
      eta_overall: eta_overall,
      eta_volumetric: eta_volumetric,
      eta_pump: eta_pump
    };
  }

  /**
   * Generates step-by-step mathematical explanations for a reading.
   */
  function generateSteps(res, readingNum) {
    if (!res) return [];

    var inp = res.inputs;
    var steps = [];

    // Step 1: Input Power (Ei)
    steps.push({
      title: '1. Input Power (Ei)',
      formula: 'Ei = (P / tp) × (3600 / EMC)',
      substitution: 'Ei = (' + CONSTANTS.P + ' / ' + inp.tp + ') × (3600 / ' + CONSTANTS.EMC + ')',
      working: 'Ei = ' + formatNum(CONSTANTS.P / inp.tp, 4) + ' × ' + formatNum(3600 / CONSTANTS.EMC, 4),
      result: 'Ei = ' + formatNum(res.Ei, 4) + ' kW (' + formatNum(res.Ei, 3) + ' kW)'
    });

    // Step 2: Shaft Power (Es)
    steps.push({
      title: '2. Shaft Power (Es)',
      formula: 'Es = Ei × ηm × ηt',
      substitution: 'Es = ' + formatNum(res.Ei, 4) + ' × ' + CONSTANTS.eta_m + ' × ' + CONSTANTS.eta_t,
      working: 'Es = ' + formatNum(res.Ei, 4) + ' × ' + (CONSTANTS.eta_m * CONSTANTS.eta_t),
      result: 'Es = ' + formatNum(res.Es, 4) + ' kW (' + formatNum(res.Es, 3) + ' kW)'
    });

    // Step 3: Actual Discharge (Qact)
    steps.push({
      title: '3. Actual Discharge (Qact)',
      formula: 'Qact = (At × R) / t',
      substitution: 'Qact = (' + CONSTANTS.At + ' × ' + inp.r + ') / ' + inp.t,
      working: 'Qact = ' + formatNum(CONSTANTS.At * inp.r, 5) + ' / ' + inp.t,
      result: 'Qact = ' + formatNum(res.Qact, 6) + ' m³/s (' + formatNum(res.Qact * 1000, 3) + ' L/s)'
    });

    // Step 4: Theoretical Discharge (Qtheo)
    steps.push({
      title: '4. Theoretical Discharge (Qtheo) [Double-Acting]',
      formula: 'Qtheo = (2 × A × L × N) / 60',
      substitution: 'Qtheo = (2 × ' + CONSTANTS.A + ' × ' + CONSTANTS.L + ' × ' + inp.rpm + ') / 60',
      working: 'Qtheo = (' + formatNum(2 * CONSTANTS.A * CONSTANTS.L * inp.rpm, 6) + ') / 60',
      result: 'Qtheo = ' + formatNum(res.Qtheo, 6) + ' m³/s (' + formatNum(res.Qtheo * 1000, 3) + ' L/s)'
    });

    // Step 5: Total Head (H)
    steps.push({
      title: '5. Total Head (H)',
      formula: 'H = 10 × (Pd + Ps / 760) + hpg',
      substitution: 'H = 10 × (' + inp.pd + ' + ' + inp.ps + ' / 760) + ' + CONSTANTS.hpg,
      working: 'H = 10 × (' + inp.pd + ' + ' + formatNum(inp.ps / 760, 4) + ') + ' + CONSTANTS.hpg + ' = ' + formatNum(10 * (inp.pd + (inp.ps / 760)), 3) + ' + ' + CONSTANTS.hpg,
      result: 'H = ' + formatNum(res.H, 2) + ' metres of water'
    });

    // Step 6: Pump Output (Eo)
    steps.push({
      title: '6. Pump Output Power (Eo)',
      formula: 'Eo = (ρ × g × Qact × H) / 1000',
      substitution: 'Eo = (' + CONSTANTS.rho + ' × ' + CONSTANTS.g + ' × ' + formatNum(res.Qact, 6) + ' × ' + formatNum(res.H, 3) + ') / 1000',
      working: 'Eo = 9.81 × ' + formatNum(res.Qact, 6) + ' × ' + formatNum(res.H, 3),
      result: 'Eo = ' + formatNum(res.Eo, 4) + ' kW (' + formatNum(res.Eo, 3) + ' kW)'
    });

    // Step 7: Overall Efficiency (ηoverall)
    steps.push({
      title: '7. Overall Efficiency (ηoverall)',
      formula: 'ηoverall = (Eo / Ei) × 100',
      substitution: 'ηoverall = (' + formatNum(res.Eo, 4) + ' / ' + formatNum(res.Ei, 4) + ') × 100',
      working: 'ηoverall = ' + formatNum(res.Eo / res.Ei, 5) + ' × 100',
      result: 'ηoverall = ' + formatNum(res.eta_overall, 2) + ' %'
    });

    // Step 8: Volumetric Efficiency (ηvolumetric)
    steps.push({
      title: '8. Volumetric Efficiency (ηvolumetric)',
      formula: 'ηvolumetric = (Qact / Qtheo) × 100',
      substitution: 'ηvolumetric = (' + formatNum(res.Qact, 6) + ' / ' + formatNum(res.Qtheo, 6) + ') × 100',
      working: 'ηvolumetric = ' + formatNum(res.Qact / res.Qtheo, 5) + ' × 100',
      result: 'ηvolumetric = ' + formatNum(res.eta_volumetric, 2) + ' %'
    });

    // Step 9: Pump Efficiency (ηpump)
    steps.push({
      title: '9. Pump Efficiency (ηpump)',
      formula: 'ηpump = (Eo / Es) × 100',
      substitution: 'ηpump = (' + formatNum(res.Eo, 4) + ' / ' + formatNum(res.Es, 4) + ') × 100',
      working: 'ηpump = ' + formatNum(res.Eo / res.Es, 5) + ' × 100',
      result: 'ηpump = ' + formatNum(res.eta_pump, 2) + ' %'
    });

    return steps;
  }

  // State store
  var state = {
    results: [null, null, null],
    activeDetailTab: 0,
    activeChartTab: 'head_eff' // 'head_q', 'head_eff', 'head_power'
  };

  /**
   * DOM Input Extraction
   */
  function getInputsFromDOM() {
    var readings = [];
    for (var i = 1; i <= 3; i++) {
      var rpmElem = document.getElementById('rpm_' + i);
      var pdElem  = document.getElementById('pd_'  + i);
      var psElem  = document.getElementById('ps_'  + i);
      var rElem   = document.getElementById('r_'   + i);
      var tElem   = document.getElementById('t_'   + i);
      var tpElem  = document.getElementById('tp_'  + i);

      readings.push({
        index: i,
        rpm: rpmElem ? rpmElem.value : '',
        pd:  pdElem  ? pdElem.value  : '',
        ps:  psElem  ? psElem.value  : '',
        r:   rElem   ? rElem.value   : '',
        t:   tElem   ? tElem.value   : '',
        tp:  tpElem  ? tpElem.value  : '',
        elements: {
          rpm: rpmElem,
          pd:  pdElem,
          ps:  psElem,
          r:   rElem,
          t:   tElem,
          tp:  tpElem
        }
      });
    }
    return readings;
  }

  /**
   * Populate inputs from data array
   */
  function populateInputs(readingsData) {
    for (var i = 0; i < 3; i++) {
      var idx = i + 1;
      var data = readingsData[i] || {};
      var rpmElem = document.getElementById('rpm_' + idx);
      var pdElem  = document.getElementById('pd_'  + idx);
      var psElem  = document.getElementById('ps_'  + idx);
      var rElem   = document.getElementById('r_'   + idx);
      var tElem   = document.getElementById('t_'   + idx);
      var tpElem  = document.getElementById('tp_'  + idx);

      if (rpmElem) rpmElem.value = data.rpm !== undefined ? data.rpm : 0;
      if (pdElem)  pdElem.value  = data.pd  !== undefined ? data.pd  : 0;
      if (psElem)  psElem.value  = data.ps  !== undefined ? data.ps  : 0;
      if (rElem)   rElem.value   = data.r   !== undefined ? data.r   : 0;
      if (tElem)   tElem.value   = data.t   !== undefined ? data.t   : 0;
      if (tpElem)  tpElem.value  = data.tp  !== undefined ? data.tp  : 0;

      // Clear any invalid classes
      [rpmElem, pdElem, psElem, rElem, tElem, tpElem].forEach(function (el) {
        if (el) el.classList.remove('is-invalid');
      });
    }
  }

  /**
   * Run Calculation across all 3 readings and update UI
   */
  function runCalculation() {
    var rawReadings = getInputsFromDOM();
    var allErrors = [];
    var calculatedResults = [];

    var alertContainer = document.getElementById('calculator-alert-container');
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }

    rawReadings.forEach(function (raw, idx) {
      var isZeroState = window.PumpValidator ? window.PumpValidator.isInitialState(raw) : false;

      if (isZeroState) {
        // Initial state: clear invalid highlights and set clean neutral state
        if (raw.elements) {
          Object.keys(raw.elements).forEach(function (k) {
            if (raw.elements[k]) raw.elements[k].classList.remove('is-invalid');
          });
        }
        calculatedResults.push(null);
        return;
      }

      var validation = window.PumpValidator ? window.PumpValidator.validateReading(raw, idx + 1) : { isValid: true, values: raw, errors: [] };

      // Update input styling for actively entered readings
      if (window.PumpValidator && raw.elements) {
        window.PumpValidator.setInputState(raw.elements.rpm, !isNaN(parseFloat(raw.rpm)) && parseFloat(raw.rpm) > 0);
        window.PumpValidator.setInputState(raw.elements.pd,  !isNaN(parseFloat(raw.pd))  && parseFloat(raw.pd) >= 0);
        window.PumpValidator.setInputState(raw.elements.ps,  !isNaN(parseFloat(raw.ps))  && parseFloat(raw.ps) >= 0);
        window.PumpValidator.setInputState(raw.elements.r,   !isNaN(parseFloat(raw.r))   && parseFloat(raw.r) > 0);
        window.PumpValidator.setInputState(raw.elements.t,   !isNaN(parseFloat(raw.t))   && parseFloat(raw.t) > 0);
        window.PumpValidator.setInputState(raw.elements.tp,  !isNaN(parseFloat(raw.tp))  && parseFloat(raw.tp) > 0);
      }

      if (validation.isValid) {
        var res = calculateReadingData(validation.values);
        calculatedResults.push(res);
      } else {
        calculatedResults.push(null);
        allErrors = allErrors.concat(validation.errors);
      }
    });

    state.results = calculatedResults;

    // Display alerts only if active errors exist
    if (allErrors.length > 0 && alertContainer) {
      var errorList = allErrors.map(function (e) { return '<li>' + e + '</li>'; }).join('');
      alertContainer.innerHTML = '<div class="alert alert-warning"><strong>Input Notice:</strong> Please check the following highlighted values:<ul style="margin-top:6px; padding-left:20px;">' + errorList + '</ul></div>';
      alertContainer.style.display = 'block';
    }

    // Update DOM Views
    updateEfficiencyCards(calculatedResults);
    updateComparisonTable(calculatedResults);
    renderCalculationDetails(calculatedResults, state.activeDetailTab);
    renderPerformanceChart();
  }

  /**
   * Update Efficiency Cards
   */
  function updateEfficiencyCards(results) {
    for (var i = 0; i < 3; i++) {
      var idx = i + 1;
      var res = results[i];

      var overallValElem = document.getElementById('card_overall_' + idx);
      var overallBarElem = document.getElementById('card_overall_bar_' + idx);
      var volValElem     = document.getElementById('card_vol_' + idx);
      var volBarElem     = document.getElementById('card_vol_bar_' + idx);
      var pumpValElem    = document.getElementById('card_pump_' + idx);
      var pumpBarElem    = document.getElementById('card_pump_bar_' + idx);

      if (res) {
        if (overallValElem) overallValElem.textContent = formatNum(res.eta_overall, 2) + ' %';
        if (overallBarElem) overallBarElem.style.width = Math.min(Math.max(res.eta_overall, 0), 100) + '%';

        if (volValElem)     volValElem.textContent = formatNum(res.eta_volumetric, 2) + ' %';
        if (volBarElem)     volBarElem.style.width = Math.min(Math.max(res.eta_volumetric, 0), 100) + '%';

        if (pumpValElem)    pumpValElem.textContent = formatNum(res.eta_pump, 2) + ' %';
        if (pumpBarElem)    pumpBarElem.style.width = Math.min(Math.max(res.eta_pump, 0), 100) + '%';
      } else {
        if (overallValElem) overallValElem.textContent = '0.00 %';
        if (overallBarElem) overallBarElem.style.width = '0%';
        if (volValElem)     volValElem.textContent = '0.00 %';
        if (volBarElem)     volBarElem.style.width = '0%';
        if (pumpValElem)    pumpValElem.textContent = '0.00 %';
        if (pumpBarElem)    pumpBarElem.style.width = '0%';
      }
    }
  }

  /**
   * Update Detailed Comparison Table
   */
  function updateComparisonTable(results) {
    for (var i = 0; i < 3; i++) {
      var idx = i + 1;
      var res = results[i];

      var r_ei     = document.getElementById('res_ei_' + idx);
      var r_es     = document.getElementById('res_es_' + idx);
      var r_qact   = document.getElementById('res_qact_' + idx);
      var r_qtheo  = document.getElementById('res_qtheo_' + idx);
      var r_head   = document.getElementById('res_head_' + idx);
      var r_eo     = document.getElementById('res_eo_' + idx);
      var r_ovr    = document.getElementById('res_overall_' + idx);
      var r_vol    = document.getElementById('res_vol_' + idx);
      var r_pump   = document.getElementById('res_pump_' + idx);

      if (res) {
        if (r_ei)    r_ei.textContent    = formatNum(res.Ei, 4);
        if (r_es)    r_es.textContent    = formatNum(res.Es, 4);
        if (r_qact)  r_qact.textContent  = formatNum(res.Qact, 6) + ' (' + formatNum(res.Qact * 1000, 3) + ' L/s)';
        if (r_qtheo) r_qtheo.textContent = formatNum(res.Qtheo, 6) + ' (' + formatNum(res.Qtheo * 1000, 3) + ' L/s)';
        if (r_head)  r_head.textContent  = formatNum(res.H, 2);
        if (r_eo)    r_eo.textContent    = formatNum(res.Eo, 4);
        if (r_ovr)   r_ovr.textContent   = formatNum(res.eta_overall, 2);
        if (r_vol)   r_vol.textContent   = formatNum(res.eta_volumetric, 2);
        if (r_pump)  r_pump.textContent  = formatNum(res.eta_pump, 2);
      } else {
        if (r_ei)    r_ei.textContent    = '0.000';
        if (r_es)    r_es.textContent    = '0.000';
        if (r_qact)  r_qact.textContent  = '0.000000';
        if (r_qtheo) r_qtheo.textContent = '0.000000';
        if (r_head)  r_head.textContent  = '0.00';
        if (r_eo)    r_eo.textContent    = '0.000';
        if (r_ovr)   r_ovr.textContent   = '0.00';
        if (r_vol)   r_vol.textContent   = '0.00';
        if (r_pump)  r_pump.textContent  = '0.00';
      }
    }
  }

  /**
   * Render Calculation Details for selected tab (Reading 1, 2, or 3)
   */
  function renderCalculationDetails(results, activeIndex) {
    var container = document.getElementById('calc-details-content');
    if (!container) return;

    var res = results[activeIndex];
    var readingLabel = 'Reading ' + (activeIndex + 1);

    if (!res) {
      container.innerHTML = '<div class="alert alert-info" style="margin-bottom:0;">Enter experimental measurements for <strong>' + readingLabel + '</strong> in the table above to view real-time formulas and substituted step-by-step calculations.</div>';
      return;
    }

    var steps = generateSteps(res, activeIndex + 1);
    var html = '<div class="doc-calc-grid">';

    steps.forEach(function (step) {
      html += '<div class="doc-calc-step">' +
                '<h3 class="doc-step-title">' + step.title + '</h3>' +
                '<div class="doc-formula-box"><strong>Formula:</strong> ' + step.formula + '</div>' +
                '<div class="doc-sub-text"><strong>Substituted:</strong> ' + step.substitution + '</div>' +
                '<div class="doc-sub-text"><strong>Simplified:</strong> ' + step.working + '</div>' +
                '<div class="doc-result-line">Result: ' + step.result + '</div>' +
              '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Switch Calculation Details Active Tab
   */
  function setActiveDetailTab(index) {
    state.activeDetailTab = index;
    var tabBtns = document.querySelectorAll('.calc-tab-btn');
    tabBtns.forEach(function (btn, i) {
      if (i === index) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    renderCalculationDetails(state.results, index);
  }

  /**
   * Native HTML5 Canvas Performance Curve Plotter
   */
  function renderPerformanceChart() {
    var canvas = document.getElementById('pumpChart');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    var width = canvas.parentElement.clientWidth || 800;
    var height = 380;
    var dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Extract valid data points sorted by Total Head (H)
    var points = [];
    state.results.forEach(function (r, idx) {
      if (r && !isNaN(r.H) && isFinite(r.H) && r.H > 0) {
        points.push({
          reading: idx + 1,
          H: r.H,
          Qact: r.Qact * 1000, // convert to L/s for readable plotting
          Qtheo: r.Qtheo * 1000,
          Ei: r.Ei,
          Es: r.Es,
          Eo: r.Eo,
          overall: r.eta_overall,
          volumetric: r.eta_volumetric,
          pump: r.eta_pump
        });
      }
    });

    if (points.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Enter readings in the table above to dynamically generate performance curves.', width / 2, height / 2);
      return;
    }

    points.sort(function (a, b) { return a.H - b.H; });

    // Chart margins
    var padLeft = 60;
    var padRight = 40;
    var padTop = 45;
    var padBottom = 55;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;

    // Determine scale bounds
    var minX = 0;
    var maxX = Math.max.apply(null, points.map(function (p) { return p.H; })) * 1.15;
    if (maxX <= 0) maxX = 80;

    var minY = 0;
    var maxY = 100;
    var yAxisTitle = '';
    var series = [];

    if (state.activeChartTab === 'head_eff') {
      maxY = 100;
      yAxisTitle = 'Efficiency (%)';
      series = [
        { name: 'Volumetric Efficiency (ηvol)', color: '#059669', key: 'volumetric' },
        { name: 'Pump Efficiency (ηpump)', color: '#d97706', key: 'pump' },
        { name: 'Overall Efficiency (ηoverall)', color: '#0284c7', key: 'overall' }
      ];
    } else if (state.activeChartTab === 'head_q') {
      var maxQ = Math.max.apply(null, points.map(function (p) { return Math.max(p.Qact, p.Qtheo); })) * 1.25;
      maxY = maxQ > 0 ? maxQ : 1.0;
      yAxisTitle = 'Discharge (L/s)';
      series = [
        { name: 'Actual Discharge (Qact)', color: '#0284c7', key: 'Qact' },
        { name: 'Theoretical Discharge (Qtheo)', color: '#94a3b8', key: 'Qtheo', dashed: true }
      ];
    } else {
      var maxP = Math.max.apply(null, points.map(function (p) { return Math.max(p.Ei, p.Es, p.Eo); })) * 1.25;
      maxY = maxP > 0 ? maxP : 1.0;
      yAxisTitle = 'Power (kW)';
      series = [
        { name: 'Input Electrical Power (Ei)', color: '#dc2626', key: 'Ei' },
        { name: 'Shaft Brake Power (Es)', color: '#d97706', key: 'Es' },
        { name: 'Pump Output Power (Eo)', color: '#059669', key: 'Eo' }
      ];
    }

    // Gridlines and Y-ticks
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';

    var yTicks = 5;
    for (var i = 0; i <= yTicks; i++) {
      var val = (maxY / yTicks) * i;
      var y = padTop + plotH - (val / maxY) * plotH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();
      ctx.fillText(formatNum(val, maxY < 5 ? 2 : 0), padLeft - 8, y + 4);
    }

    // Gridlines and X-ticks
    var xTicks = 5;
    ctx.textAlign = 'center';
    for (var j = 0; j <= xTicks; j++) {
      var xVal = (maxX / xTicks) * j;
      var x = padLeft + (xVal / maxX) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();
      ctx.fillText(formatNum(xVal, 0), x, padTop + plotH + 18);
    }

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Total Operating Head H (metres of water)', padLeft + plotW / 2, height - 12);

    ctx.save();
    ctx.translate(16, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisTitle, 0, 0);
    ctx.restore();

    // Plot Series Curves
    series.forEach(function (s) {
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = 2.5;

      if (s.dashed) {
        ctx.setLineDash([5, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      points.forEach(function (p, idx) {
        var x = padLeft + (p.H / maxX) * plotW;
        var yVal = p[s.key];
        var y = padTop + plotH - (yVal / maxY) * plotH;

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Marker Dots
      points.forEach(function (p) {
        var x = padLeft + (p.H / maxX) * plotW;
        var yVal = p[s.key];
        var y = padTop + plotH - (yVal / maxY) * plotH;

        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // Draw Legend
    var legendX = padLeft + 10;
    var legendY = 22;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';

    series.forEach(function (s) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY - 4);
      ctx.lineTo(legendX + 18, legendY - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(legendX + 9, legendY - 4, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillText(s.name, legendX + 24, legendY);
      legendX += ctx.measureText(s.name).width + 38;
    });
  }

  /**
   * Download Comprehensive Calculation Report as Text File
   */
  function downloadReport() {
    var rawReadings = getInputsFromDOM();
    var report = '========================================================================\n';
    report += '       PERFORMANCE TEST OF RECIPROCATING PUMP - EXPERIMENTAL REPORT      \n';
    report += '========================================================================\n';
    report += 'Generated Date: ' + new Date().toLocaleString() + '\n\n';

    report += '1. APPARATUS CONSTANTS\n';
    report += '------------------------------------------------------------------------\n';
    report += 'Cylinder Diameter (D)           : ' + CONSTANTS.D + ' m\n';
    report += 'Cylinder Area (A)               : ' + CONSTANTS.A + ' m²\n';
    report += 'Stroke Length (L)               : ' + CONSTANTS.L + ' m\n';
    report += 'Collecting Tank Area (At)       : ' + CONSTANTS.At + ' m²\n';
    report += 'Motor Efficiency (ηm)           : ' + CONSTANTS.eta_m + '\n';
    report += 'Transmission Efficiency (ηt)    : ' + CONSTANTS.eta_t + '\n';
    report += 'Energy Meter Constant (EMC)     : ' + CONSTANTS.EMC + ' pulses/kWh\n';
    report += 'Energy Meter Pulses (P)         : ' + CONSTANTS.P + ' pulses\n';
    report += 'Pressure Gauge Correction (hpg) : ' + CONSTANTS.hpg + ' m\n';
    report += 'Density of Water (ρ)            : ' + CONSTANTS.rho + ' kg/m³\n';
    report += 'Acceleration due to Gravity (g) : ' + CONSTANTS.g + ' m/s²\n\n';

    report += '2. EXPERIMENTAL OBSERVATIONS\n';
    report += '------------------------------------------------------------------------\n';
    report += 'Parameter                       | Reading 1   | Reading 2   | Reading 3   \n';
    report += '------------------------------------------------------------------------\n';
    report += 'Pump RPM (N)                    | ' + padRight(rawReadings[0].rpm, 11) + ' | ' + padRight(rawReadings[1].rpm, 11) + ' | ' + padRight(rawReadings[2].rpm, 11) + '\n';
    report += 'Gauge Pressure (Pd) [kg/cm²]    | ' + padRight(rawReadings[0].pd, 11)  + ' | ' + padRight(rawReadings[0].pd, 11)  + ' | ' + padRight(rawReadings[2].pd, 11)  + '\n';
    report += 'Vacuum Pressure (Ps) [mmHg]     | ' + padRight(rawReadings[0].ps, 11)  + ' | ' + padRight(rawReadings[1].ps, 11)  + ' | ' + padRight(rawReadings[2].ps, 11)  + '\n';
    report += 'Water Rise (R) [m]              | ' + padRight(rawReadings[0].r, 11)   + ' | ' + padRight(rawReadings[1].r, 11)   + ' | ' + padRight(rawReadings[2].r, 11)   + '\n';
    report += 'Water Rise Time (t) [s]         | ' + padRight(rawReadings[0].t, 11)   + ' | ' + padRight(rawReadings[1].t, 11)   + ' | ' + padRight(rawReadings[2].t, 11)   + '\n';
    report += 'Energy Meter Time (tp) [s]      | ' + padRight(rawReadings[0].tp, 11)  + ' | ' + padRight(rawReadings[1].tp, 11)  + ' | ' + padRight(rawReadings[2].tp, 11)  + '\n\n';

    report += '3. CALCULATED PERFORMANCE RESULTS\n';
    report += '------------------------------------------------------------------------\n';
    report += 'Parameter                       | Reading 1   | Reading 2   | Reading 3   \n';
    report += '------------------------------------------------------------------------\n';

    var r1 = state.results[0] || {};
    var r2 = state.results[1] || {};
    var r3 = state.results[2] || {};

    report += 'Input Power (Ei) [kW]           | ' + padRight(formatNum(r1.Ei, 4), 11) + ' | ' + padRight(formatNum(r2.Ei, 4), 11) + ' | ' + padRight(formatNum(r3.Ei, 4), 11) + '\n';
    report += 'Shaft Power (Es) [kW]           | ' + padRight(formatNum(r1.Es, 4), 11) + ' | ' + padRight(formatNum(r2.Es, 4), 11) + ' | ' + padRight(formatNum(r3.Es, 4), 11) + '\n';
    report += 'Actual Discharge (Qact) [m³/s]  | ' + padRight(formatNum(r1.Qact, 6), 11) + ' | ' + padRight(formatNum(r2.Qact, 6), 11) + ' | ' + padRight(formatNum(r3.Qact, 6), 11) + '\n';
    report += 'Theor. Discharge (Qtheo) [m³/s] | ' + padRight(formatNum(r1.Qtheo, 6), 11) + ' | ' + padRight(formatNum(r2.Qtheo, 6), 11) + ' | ' + padRight(formatNum(r3.Qtheo, 6), 11) + '\n';
    report += 'Total Head (H) [m of water]     | ' + padRight(formatNum(r1.H, 2), 11) + ' | ' + padRight(formatNum(r2.H, 2), 11) + ' | ' + padRight(formatNum(r3.H, 2), 11) + '\n';
    report += 'Pump Output (Eo) [kW]           | ' + padRight(formatNum(r1.Eo, 4), 11) + ' | ' + padRight(formatNum(r2.Eo, 4), 11) + ' | ' + padRight(formatNum(r3.Eo, 4), 11) + '\n';
    report += 'Overall Efficiency (ηoverall) % | ' + padRight(formatNum(r1.eta_overall, 2), 11) + ' | ' + padRight(formatNum(r2.eta_overall, 2), 11) + ' | ' + padRight(formatNum(r3.eta_overall, 2), 11) + '\n';
    report += 'Volumetric Efficiency (ηvol) %  | ' + padRight(formatNum(r1.eta_volumetric, 2), 11) + ' | ' + padRight(formatNum(r2.eta_volumetric, 2), 11) + ' | ' + padRight(formatNum(r3.eta_volumetric, 2), 11) + '\n';
    report += 'Pump Efficiency (ηpump) %       | ' + padRight(formatNum(r1.eta_pump, 2), 11) + ' | ' + padRight(formatNum(r2.eta_pump, 2), 11) + ' | ' + padRight(formatNum(r3.eta_pump, 2), 11) + '\n\n';

    report += '4. STEP-BY-STEP CALCULATION DETAILS (SAMPLE READING 1)\n';
    report += '------------------------------------------------------------------------\n';
    if (state.results[0]) {
      var steps = generateSteps(state.results[0], 1);
      steps.forEach(function (s) {
        report += s.title + '\n';
        report += '  Formula     : ' + s.formula + '\n';
        report += '  Substituted : ' + s.substitution + '\n';
        report += '  Simplified  : ' + s.working + '\n';
        report += '  Result      : ' + s.result + '\n\n';
      });
    } else {
      report += 'No experimental readings entered for Reading 1.\n\n';
    }

    report += '========================================================================\n';
    report += '                      END OF LABORATORY REPORT                          \n';
    report += '========================================================================\n';

    var blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Reciprocating_Pump_Performance_Report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download Excel-compatible CSV File
   */
  function downloadCSV() {
    var raw = getInputsFromDOM();
    var r1 = state.results[0] || {};
    var r2 = state.results[1] || {};
    var r3 = state.results[2] || {};

    var csv = 'Reciprocating Pump Performance Test - Experimental Data & Results\n\n';
    csv += 'Parameter,Symbol,Unit,Reading 1,Reading 2,Reading 3\n';
    csv += 'Pump Speed,N,RPM,' + raw[0].rpm + ',' + raw[1].rpm + ',' + raw[2].rpm + '\n';
    csv += 'Delivery Gauge Pressure,Pd,kg/cm2,' + raw[0].pd + ',' + raw[1].pd + ',' + raw[2].pd + '\n';
    csv += 'Suction Vacuum Pressure,Ps,mmHg,' + raw[0].ps + ',' + raw[1].ps + ',' + raw[2].ps + '\n';
    csv += 'Water Rise in Tank,R,m,' + raw[0].r + ',' + raw[1].r + ',' + raw[2].r + '\n';
    csv += 'Time for Water Rise,t,s,' + raw[0].t + ',' + raw[1].t + ',' + raw[2].t + '\n';
    csv += 'Energy Meter Time,tp,s,' + raw[0].tp + ',' + raw[1].tp + ',' + raw[2].tp + '\n\n';

    csv += 'Input Electrical Power,Ei,kW,' + formatNum(r1.Ei, 4) + ',' + formatNum(r2.Ei, 4) + ',' + formatNum(r3.Ei, 4) + '\n';
    csv += 'Shaft Brake Power,Es,kW,' + formatNum(r1.Es, 4) + ',' + formatNum(r2.Es, 4) + ',' + formatNum(r3.Es, 4) + '\n';
    csv += 'Actual Discharge,Qact,m3/s,' + formatNum(r1.Qact, 6) + ',' + formatNum(r2.Qact, 6) + ',' + formatNum(r3.Qact, 6) + '\n';
    csv += 'Theoretical Discharge,Qtheo,m3/s,' + formatNum(r1.Qtheo, 6) + ',' + formatNum(r2.Qtheo, 6) + ',' + formatNum(r3.Qtheo, 6) + '\n';
    csv += 'Total Operating Head,H,m of water,' + formatNum(r1.H, 2) + ',' + formatNum(r2.H, 2) + ',' + formatNum(r3.H, 2) + '\n';
    csv += 'Pump Output Hydraulic Power,Eo,kW,' + formatNum(r1.Eo, 4) + ',' + formatNum(r2.Eo, 4) + ',' + formatNum(r3.Eo, 4) + '\n';
    csv += 'Overall Efficiency,eta_overall,%,' + formatNum(r1.eta_overall, 2) + ',' + formatNum(r2.eta_overall, 2) + ',' + formatNum(r3.eta_overall, 2) + '\n';
    csv += 'Volumetric Efficiency,eta_vol,%,' + formatNum(r1.eta_volumetric, 2) + ',' + formatNum(r2.eta_volumetric, 2) + ',' + formatNum(r3.eta_volumetric, 2) + '\n';
    csv += 'Pump Efficiency,eta_pump,%,' + formatNum(r1.eta_pump, 2) + ',' + formatNum(r2.eta_pump, 2) + ',' + formatNum(r3.eta_pump, 2) + '\n';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Reciprocating_Pump_Results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function padRight(str, len) {
    str = String(str !== undefined && str !== null ? str : '');
    while (str.length < len) {
      str += ' ';
    }
    return str;
  }

  /**
   * Initialize Calculator Event Listeners
   */
  function initCalculator() {
    // Populate with 0 initially as requested
    populateInputs(ZERO_READINGS);

    // Initial neutral evaluation
    runCalculation();

    // Attach live input listeners to all input fields
    var inputs = document.querySelectorAll('.input-table input');
    inputs.forEach(function (input) {
      // Auto-select 0 on click/focus so user can type immediately
      input.addEventListener('focus', function () {
        if (this.value === '0') {
          this.select();
        }
      });
      input.addEventListener('input', function () {
        runCalculation();
      });
      input.addEventListener('change', function () {
        runCalculation();
      });
    });

    // Calculate Button
    var calcBtn = document.getElementById('btn-calculate');
    if (calcBtn) {
      calcBtn.addEventListener('click', function () {
        runCalculation();
        var resultsCard = document.getElementById('results-dashboard');
        if (resultsCard) {
          resultsCard.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Load Sample Values Button
    var sampleBtn = document.getElementById('btn-sample');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', function () {
        populateInputs(SAMPLE_READINGS);
        runCalculation();
      });
    }

    // Reset to 0 Button
    var resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        populateInputs(ZERO_READINGS);
        runCalculation();
      });
    }

    // Print Button
    var printBtn = document.getElementById('btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // Download Report Button (Text)
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function () {
        downloadReport();
      });
    }

    // Download CSV Button
    var downloadCsvBtn = document.getElementById('btn-download-csv');
    if (downloadCsvBtn) {
      downloadCsvBtn.addEventListener('click', function () {
        downloadCSV();
      });
    }

    // Tab buttons for calculation details
    var tabBtns = document.querySelectorAll('.calc-tab-btn');
    tabBtns.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        setActiveDetailTab(index);
      });
    });

    // Chart tab switching
    var chartTabBtns = document.querySelectorAll('.chart-tab-btn');
    chartTabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        chartTabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.activeChartTab = btn.getAttribute('data-chart') || 'head_eff';
        renderPerformanceChart();
      });
    });

    // Window resize redrawing for responsive chart canvas
    window.addEventListener('resize', function () {
      renderPerformanceChart();
    });
  }

  window.PumpCalculator = {
    CONSTANTS: CONSTANTS,
    SAMPLE_READINGS: SAMPLE_READINGS,
    calculateReadingData: calculateReadingData,
    generateSteps: generateSteps,
    initCalculator: initCalculator,
    runCalculation: runCalculation,
    populateInputs: populateInputs,
    downloadReport: downloadReport,
    downloadCSV: downloadCSV,
    renderPerformanceChart: renderPerformanceChart
  };

  // Run on DOM Ready if calculator elements exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('rpm_1')) {
        initCalculator();
      }
    });
  } else {
    if (document.getElementById('rpm_1')) {
      initCalculator();
    }
  }

})(window);
