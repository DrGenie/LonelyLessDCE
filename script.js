/* ===================================================
   LonelyLessAustralia Decision Aid – script.js
   Updated to use main DCE coefficients and WTP values
   (no major omissions; attribute names and estimates
   now match the main mixed logit model)
   =================================================== */

(() => {
  /* ===========================
     Global state
     =========================== */

  const state = {
    currency: "AUD",                // Currency display (AUD by default)
    includeOppCost: true,           // Include opportunity cost in totals
    scenarios: [],                  // Saved scenarios
    charts: {
      uptake: null,
      bcr: null,
      epi: null,
      natCostBenefit: null,
      natEpi: null
    },
    lastResults: null,
    modelLabel: "Main sample (mixed logit)" // Label for model column
  };

  /***************************************************************************
   * Main DCE Coefficients & Cost Multipliers
   * (from main LonelyLess mixed logit model)
   ***************************************************************************/

  const mainCoefficients = {
    ASC_mean: -0.112,
    ASC_sd: 1.161,
    ASC_optout: 0.131,
    type_comm: 0.527,
    type_psych: 0.156,
    type_vr: -0.349,
    mode_virtual: -0.426,
    mode_hybrid: -0.289,
    freq_weekly: 0.617,
    freq_monthly: 0.336,
    dur_2hrs: 0.185,
    dur_4hrs: 0.213,
    dist_local: 0.059,
    dist_signif: -0.509,
    cost_cont: -0.036
  };

  const costOfLivingMultipliers = {
    NSW: 1.10,
    VIC: 1.05,
    QLD: 1.00,
    WA: 1.08,
    SA: 1.02,
    TAS: 1.03,
    ACT: 1.15,
    NT: 1.07
  };

  /***************************************************************************
   * WTP Data (AUD per person per month)
   ***************************************************************************/

  const wtpDataMain = [
    { attribute: "Community engagement", wtp: 14.47, pVal: 0.000, se: 3.31 },
    { attribute: "Psychological counselling", wtp: 4.28, pVal: 0.245, se: 3.76 },
    { attribute: "Virtual reality", wtp: -9.58, pVal: 0.009, se: 3.72 },
    { attribute: "Virtual (method)", wtp: -11.69, pVal: 0.019, se: 5.02 },
    { attribute: "Hybrid (method)", wtp: -7.95, pVal: 0.001, se: 2.51 },
    { attribute: "Weekly (freq)", wtp: 16.93, pVal: 0.000, se: 2.73 },
    { attribute: "Monthly (freq)", wtp: 9.21, pVal: 0.005, se: 3.26 },
    { attribute: "2-hour interaction", wtp: 5.08, pVal: 0.059, se: 2.69 },
    { attribute: "4-hour interaction", wtp: 5.85, pVal: 0.037, se: 2.79 },
    { attribute: "Local area accessibility", wtp: 1.62, pVal: 0.712, se: 4.41 },
    { attribute: "Wider community accessibility", wtp: -13.99, pVal: 0.000, se: 3.98 }
  ];

  /* ===========================
     Helpers
     =========================== */

  function logistic(x) {
    if (x > 50) return 1;
    if (x < -50) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function wtpFor(attributeName) {
    const row = wtpDataMain.find(d => d.attribute === attributeName);
    return row ? row.wtp : 0;
  }

  /* ===========================
     Read configuration from form
     =========================== */

  function readConfigurationFromInputs() {
    // Service type: community / psychology / VR
    const serviceType =
      (document.getElementById("service-type") || {}).value || "comm"; // "comm" | "psych" | "vr"

    // Delivery method: in-person / virtual / hybrid
    const mode =
      (document.getElementById("mode") || {}).value || "inperson"; // "inperson" | "virtual" | "hybrid"

    // Participation frequency: weekly / fortnightly / monthly
    const frequency =
      (document.getElementById("frequency") || {}).value || "weekly"; // "weekly" | "fortnightly" | "monthly"

    // Session duration: 1hr / 2hrs / 4hrs
    const duration =
      (document.getElementById("duration") || {}).value || "2hrs"; // "1hr" | "2hrs" | "4hrs"

    // Accessibility / distance: local vs wider community
    const distance =
      (document.getElementById("distance") || {}).value || "local"; // "local" | "wider"

    // Region / state for cost-of-living adjustment
    const regionEl = document.getElementById("region-select");
    const region = regionEl ? regionEl.value || "NSW" : "NSW";
    const multiplier = costOfLivingMultipliers[region] || 1.0;

    // Base cost from slider (AUD per person per month, before regional adjustment)
    const costSlider = document.getElementById("cost-slider");
    const baseCost =
      costSlider ? parseFloat(costSlider.value) || 0 : 0;

    const costPerParticipantPerMonth = baseCost * multiplier;

    // Scale: number of participants and groups
    const participantsInput = document.getElementById("trainees");
    const groupsInput = document.getElementById("cohorts");

    const participantsPerGroup = participantsInput
      ? parseInt(participantsInput.value, 10) || 0
      : 0;

    const numberOfGroups = groupsInput
      ? parseInt(groupsInput.value, 10) || 0
      : 0;

    // Programme horizon in months (optional input)
    const monthsInput = document.getElementById("programme-months");
    let programmeMonths = 12;
    if (monthsInput) {
      const mv = parseFloat(monthsInput.value);
      if (!isNaN(mv) && mv > 0) programmeMonths = mv;
    }

    const nameInput = document.getElementById("scenario-name");
    const notesInput = document.getElementById("scenario-notes");

    return {
      serviceType,           // comm / psych / vr
      mode,                  // inperson / virtual / hybrid
      frequency,             // weekly / fortnightly / monthly
      duration,              // 1hr / 2hrs / 4hrs
      distance,              // local / wider
      region,                // NSW, VIC, ...
      baseCostPerParticipantPerMonth: baseCost,
      costPerParticipantPerMonth,    // adjusted for region
      participantsPerGroup,
      numberOfGroups,
      programmeMonths,
      scenarioName: nameInput ? nameInput.value.trim() : "",
      scenarioNotes: notesInput ? notesInput.value.trim() : ""
    };
  }

  /* ===========================
     DCE utility and endorsement
     =========================== */

  function computeAttributeUtility(cfg) {
    let u = 0;

    // Service type
    if (cfg.serviceType === "comm") {
      u += mainCoefficients.type_comm;
    } else if (cfg.serviceType === "psych") {
      u += mainCoefficients.type_psych;
    } else if (cfg.serviceType === "vr") {
      u += mainCoefficients.type_vr;
    }

    // Delivery method (reference: in-person)
    if (cfg.mode === "virtual") {
      u += mainCoefficients.mode_virtual;
    } else if (cfg.mode === "hybrid") {
      u += mainCoefficients.mode_hybrid;
    }

    // Frequency (reference: fortnightly or base)
    if (cfg.frequency === "weekly") {
      u += mainCoefficients.freq_weekly;
    } else if (cfg.frequency === "monthly") {
      u += mainCoefficients.freq_monthly;
    }

    // Duration (reference: 1 hour)
    if (cfg.duration === "2hrs") {
      u += mainCoefficients.dur_2hrs;
    } else if (cfg.duration === "4hrs") {
      u += mainCoefficients.dur_4hrs;
    }

    // Accessibility / distance (reference: closest/standard)
    if (cfg.distance === "local") {
      u += mainCoefficients.dist_local;
    } else if (cfg.distance === "wider") {
      u += mainCoefficients.dist_signif;
    }

    return u;
  }

  function computeEndorsement(cfg) {
    const baseUtility = computeAttributeUtility(cfg);

    const ascProg = mainCoefficients.ASC_mean || 0;
    const ascOpt = mainCoefficients.ASC_optout || 0;
    const costBeta = mainCoefficients.cost_cont || 0;

    const costTerm = costBeta * cfg.costPerParticipantPerMonth;

    const U_prog = ascProg + baseUtility + costTerm;
    const U_opt = ascOpt;

    const expP = Math.exp(U_prog);
    const expO = Math.exp(U_opt);
    const denom = expP + expO;

    const endorseProb = denom === 0 ? 0 : expP / denom;
    const optoutProb = denom === 0 ? 1 : expO / denom;

    return {
      endorseProb,
      optoutProb,
      baseUtility,
      ascProg,
      ascOpt,
      costTerm
    };
  }

  /* ===========================
     Scenario-level WTP
     (sum of WTP for included attributes)
     =========================== */

  function computeWtpPerParticipantPerMonth(cfg) {
    let wtp = 0;

    // Service type
    if (cfg.serviceType === "comm") {
      wtp += wtpFor("Community engagement");
    } else if (cfg.serviceType === "psych") {
      wtp += wtpFor("Psychological counselling");
    } else if (cfg.serviceType === "vr") {
      wtp += wtpFor("Virtual reality");
    }

    // Delivery method
    if (cfg.mode === "virtual") {
      wtp += wtpFor("Virtual (method)");
    } else if (cfg.mode === "hybrid") {
      wtp += wtpFor("Hybrid (method)");
    }

    // Frequency
    if (cfg.frequency === "weekly") {
      wtp += wtpFor("Weekly (freq)");
    } else if (cfg.frequency === "monthly") {
      wtp += wtpFor("Monthly (freq)");
    }

    // Duration
    if (cfg.duration === "2hrs") {
      wtp += wtpFor("2-hour interaction");
    } else if (cfg.duration === "4hrs") {
      wtp += wtpFor("4-hour interaction");
    }

    // Accessibility
    if (cfg.distance === "local") {
      wtp += wtpFor("Local area accessibility");
    } else if (cfg.distance === "wider") {
      wtp += wtpFor("Wider community accessibility");
    }

    // WTP is in AUD per person per month
    return wtp;
  }

  /* ===========================
     Cost and benefit calculations
     =========================== */

  function getOppCostRate() {
    // Opportunity cost as share of direct programme cost
    return state.includeOppCost ? 0.2 : 0.0; // 20% default
  }

  function computeCostsAndBenefits(cfg) {
    const util = computeEndorsement(cfg);

    const durationMonths = cfg.programmeMonths || 12;
    const participantsPerGroup = cfg.participantsPerGroup;
    const groups = cfg.numberOfGroups;

    // Direct programme cost per group over full horizon
    const directCostPerGroup =
      cfg.costPerParticipantPerMonth * participantsPerGroup * durationMonths;

    // Opportunity cost
    const oppRate = getOppCostRate();
    const oppCostPerGroup = directCostPerGroup * oppRate;

    const totalEconomicCostPerGroup = directCostPerGroup + oppCostPerGroup;
    const totalCostAllGroups = totalEconomicCostPerGroup * groups;

    // WTP per participant per month from main WTP estimates
    const wtpPerParticipantPerMonth = computeWtpPerParticipantPerMonth(cfg);
    let wtpPerGroup = null;
    let totalWtpAllGroups = null;

    if (typeof wtpPerParticipantPerMonth === "number") {
      wtpPerGroup =
        wtpPerParticipantPerMonth *
        participantsPerGroup *
        durationMonths;
      totalWtpAllGroups = wtpPerGroup * groups;
    }

    const netBenefitAllGroups =
      totalWtpAllGroups !== null
        ? totalWtpAllGroups - totalCostAllGroups
        : null;

    const bcr =
      totalWtpAllGroups !== null && totalCostAllGroups > 0
        ? totalWtpAllGroups / totalCostAllGroups
        : null;

    const effectiveBenefit =
      totalWtpAllGroups !== null
        ? totalWtpAllGroups * util.endorseProb
        : null;

    return {
      cfg,
      util,
      durationMonths,
      directCostPerGroup,
      oppCostPerGroup,
      totalEconomicCostPerGroup,
      totalCostAllGroups,
      wtpPerParticipantPerMonth,
      wtpPerGroup,
      totalWtpAllGroups,
      netBenefitAllGroups,
      bcr,
      effectiveBenefit
    };
  }

  /* ===========================
     Formatting helpers
     =========================== */

  function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) return "-";
    return value.toLocaleString("en-AU", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    });
  }

  function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || !isFinite(value)) return "-";
    const pct = value * 100;
    return `${pct.toFixed(decimals)} %`;
  }

  function formatCurrency(valueInAud, decimals = 0) {
    if (valueInAud === null || valueInAud === undefined || isNaN(valueInAud))
      return "-";

    if (state.currency === "USD") {
      const rate = 1.5; // placeholder AUD per USD
      const valueUsd = valueInAud / rate;
      return `USD ${valueUsd.toLocaleString("en-US", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
      })}`;
    }

    return `AUD ${valueInAud.toLocaleString("en-AU", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals
    })}`;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function showToast(message, kind = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove(
      "toast-success",
      "toast-warning",
      "toast-error",
      "hidden"
    );
    if (kind === "success") toast.classList.add("toast-success");
    if (kind === "warning") toast.classList.add("toast-warning");
    if (kind === "error") toast.classList.add("toast-error");
    toast.classList.add("show");
    if (showToast._timeout) clearTimeout(showToast._timeout);
    showToast._timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  /* ===========================
     Pretty labels
     =========================== */

  function prettyServiceType(t) {
    if (t === "psych") return "Psychological counselling";
    if (t === "vr") return "Virtual reality";
    return "Community engagement";
  }

  function prettyMode(m) {
    if (m === "virtual") return "Virtual delivery";
    if (m === "hybrid") return "Hybrid (online and in person)";
    return "In-person sessions";
  }

  function prettyFrequency(f) {
    if (f === "weekly") return "Weekly participation";
    if (f === "monthly") return "Monthly participation";
    return "Fortnightly participation";
  }

  function prettyDuration(d) {
    if (d === "1hr") return "1-hour sessions";
    if (d === "4hrs") return "4-hour sessions";
    return "2-hour sessions";
  }

  function prettyDistance(d) {
    if (d === "wider") return "Wider community locations";
    return "Local area / nearby locations";
  }

  /* ===========================
     Configuration summary UI
     =========================== */

  function updateConfigSummary(results) {
    const cfg = results.cfg;
    const summaryEl = document.getElementById("config-summary");
    if (!summaryEl) return;

    summaryEl.innerHTML = "";

    const rows = [
      ["Programme type", prettyServiceType(cfg.serviceType)],
      ["Delivery method", prettyMode(cfg.mode)],
      ["Participation frequency", prettyFrequency(cfg.frequency)],
      ["Session length", prettyDuration(cfg.duration)],
      ["Accessibility", prettyDistance(cfg.distance)],
      ["Region (cost-of-living)", cfg.region],
      ["Participants per group", formatNumber(cfg.participantsPerGroup)],
      ["Number of groups", formatNumber(cfg.numberOfGroups)],
      ["Programme horizon", `${formatNumber(cfg.programmeMonths, 0)} months`],
      [
        "Cost per participant per month",
        `${formatCurrency(cfg.costPerParticipantPerMonth)} (adjusted)`
      ],
      [
        "Base cost (before regional adjustment)",
        formatCurrency(cfg.baseCostPerParticipantPerMonth)
      ],
      [
        "Model",
        state.modelLabel
      ]
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "config-summary-row";
      const left = document.createElement("div");
      left.className = "config-summary-label";
      left.textContent = label;
      const right = document.createElement("div");
      right.className = "config-summary-value";
      right.textContent = value;
      row.appendChild(left);
      row.appendChild(right);
      summaryEl.appendChild(row);
    });

    setText(
      "config-endorsement-value",
      formatPercent(results.util.endorseProb, 1)
    );

    const statusTag = document.getElementById("headline-status-tag");
    const headline = document.getElementById("headline-recommendation");
    const briefing = document.getElementById("headline-briefing-text");

    if (!statusTag || !headline || !briefing) return;

    statusTag.className = "status-pill status-neutral";
    statusTag.textContent = "Assessment pending";

    if (results.bcr !== null) {
      if (results.bcr >= 1.5) {
        statusTag.className = "status-pill status-good";
        statusTag.textContent = "Strong value for money";
      } else if (results.bcr >= 1.0) {
        statusTag.className = "status-pill status-warning";
        statusTag.textContent = "Borderline value for money";
      } else {
        statusTag.className = "status-pill status-poor";
        statusTag.textContent = "Costs likely exceed benefits";
      }
    }

    headline.textContent =
      results.bcr === null
        ? "Configure the intervention and cost assumptions to see whether the benefits of reducing loneliness are likely to justify the costs."
        : `With an estimated endorsement of ${formatPercent(
            results.util.endorseProb,
            1
          )}, a benefit–cost ratio of ${
            results.bcr ? results.bcr.toFixed(2) : "-"
          } and total costs of ${formatCurrency(
            results.totalCostAllGroups
          )}, this configuration offers a ${
            results.bcr && results.bcr >= 1 ? "promising" : "weaker"
          } balance between value and cost.`;

    briefing.textContent =
      `In this scenario, a ${prettyServiceType(
        cfg.serviceType
      ).toLowerCase()} programme is delivered as ${prettyMode(
        cfg.mode
      ).toLowerCase()} with ${prettyFrequency(
        cfg.frequency
      ).toLowerCase()} ${prettyDuration(
        cfg.duration
      ).toLowerCase()} in ${prettyDistance(
        cfg.distance
      ).toLowerCase()}. It targets ${formatNumber(
        cfg.participantsPerGroup,
        0
      )} participants per group across ${formatNumber(
        cfg.numberOfGroups,
        0
      )} groups over ${formatNumber(
        cfg.programmeMonths,
        0
      )} months. ` +
      `The main DCE model implies that around ${formatPercent(
        results.util.endorseProb,
        1
      )} of older adults would be willing to take up this offer at a cost of ${formatCurrency(
        cfg.costPerParticipantPerMonth
      )} per person per month (after adjusting for cost-of-living in ${cfg.region}). ` +
      `Total economic costs are approximately ${formatCurrency(
        results.totalCostAllGroups
      )}, while preference-based benefits are around ${formatCurrency(
        results.totalWtpAllGroups || 0
      )}, giving a benefit–cost ratio of ${
        results.bcr ? results.bcr.toFixed(2) : "-"
      } under the current assumptions.`;
  }

  /* ===========================
     Results tab
     =========================== */

  function updateResultsTab(results) {
    setText(
      "endorsement-rate",
      formatPercent(results.util.endorseProb, 1)
    );
    setText("optout-rate", formatPercent(results.util.optoutProb, 1));

    setText(
      "wtp-per-trainee",
      results.wtpPerParticipantPerMonth === null
        ? "-"
        : formatCurrency(results.wtpPerParticipantPerMonth, 1)
    );
    setText(
      "wtp-total-cohort",
      results.wtpPerGroup === null
        ? "-"
        : formatCurrency(results.wtpPerGroup)
    );

    setText(
      "prog-cost-per-cohort",
      formatCurrency(results.directCostPerGroup)
    );
    setText(
      "total-cost",
      formatCurrency(results.totalEconomicCostPerGroup)
    );

    setText(
      "net-benefit",
      results.netBenefitAllGroups === null
        ? "-"
        : formatCurrency(results.netBenefitAllGroups)
    );
    setText(
      "bcr",
      results.bcr === null ? "-" : results.bcr.toFixed(2)
    );

    // Reach and endorsement (interpreted as community reach)
    const totalParticipants =
      results.cfg.participantsPerGroup * results.cfg.numberOfGroups;
    const endorsedParticipants =
      totalParticipants * results.util.endorseProb;

    setText(
      "epi-graduates",
      formatNumber(endorsedParticipants, 0)
    );
    setText(
      "epi-outbreaks",
      formatNumber(totalParticipants, 0)
    );
    setText(
      "epi-benefit",
      results.totalWtpAllGroups === null
        ? "-"
        : formatCurrency(results.totalWtpAllGroups)
    );

    updateCharts(results);
  }

  /* ===========================
     Charts (Chart.js)
     =========================== */

  function updateCharts(results) {
    const ChartLib = window.Chart;
    if (!ChartLib) return;

    // Uptake chart
    const uptakeCtx = document.getElementById("chart-uptake");
    if (uptakeCtx) {
      if (state.charts.uptake) state.charts.uptake.destroy();
      state.charts.uptake = new ChartLib(uptakeCtx, {
        type: "doughnut",
        data: {
          labels: ["Endorse programme", "Prefer status quo"],
          datasets: [
            {
              data: [
                Math.round(results.util.endorseProb * 100),
                Math.round(results.util.optoutProb * 100)
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const v = ctx.parsed;
                  return `${ctx.label}: ${v.toFixed(1)} %`;
                }
              }
            }
          }
        }
      });
    }

    // Cost vs benefit chart
    const bcrCtx = document.getElementById("chart-bcr");
    if (bcrCtx) {
      if (state.charts.bcr) state.charts.bcr.destroy();
      state.charts.bcr = new ChartLib(bcrCtx, {
        type: "bar",
        data: {
          labels: ["Total economic cost", "Total WTP benefit"],
          datasets: [
            {
              data: [
                results.totalCostAllGroups || 0,
                results.totalWtpAllGroups || 0
              ]
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              ticks: {
                callback(value) {
                  return value >= 1_000_000
                    ? (value / 1_000_000).toFixed(1) + "m"
                    : value >= 1_000
                    ? (value / 1_000).toFixed(1) + "k"
                    : value;
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(ctx) {
                  return formatCurrency(ctx.parsed.y);
                }
              }
            }
          }
        }
      });
    }

    // Reach chart (interpreted as participants reached)
    const epiCtx = document.getElementById("chart-epi");
    if (epiCtx) {
      if (state.charts.epi) state.charts.epi.destroy();
      const totalParticipants =
        results.cfg.participantsPerGroup * results.cfg.numberOfGroups;
      const endorsedParticipants =
        totalParticipants * results.util.endorseProb;
      state.charts.epi = new ChartLib(epiCtx, {
        type: "bar",
        data: {
          labels: ["Total participants", "Participants in endorsed programme"],
          datasets: [
            {
              data: [totalParticipants, endorsedParticipants]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  /* ===========================
     Costing tab
     =========================== */

  function updateCostingTab(results) {
    const summary = document.getElementById("cost-breakdown-summary");
    if (summary) {
      summary.innerHTML = "";

      const items = [
        {
          label: "Direct programme cost per group",
          value: formatCurrency(results.directCostPerGroup)
        },
        {
          label: "Opportunity cost per group",
          value: formatCurrency(results.oppCostPerGroup)
        },
        {
          label: "Total economic cost per group",
          value: formatCurrency(results.totalEconomicCostPerGroup)
        },
        {
          label: "Total economic cost (all groups)",
          value: formatCurrency(results.totalCostAllGroups)
        }
      ];

      items.forEach(it => {
        const card = document.createElement("div");
        card.className = "cost-summary-card";
        const l = document.createElement("div");
        l.className = "cost-summary-label";
        l.textContent = it.label;
        const v = document.createElement("div");
        v.className = "cost-summary-value";
        v.textContent = it.value;
        card.appendChild(l);
        card.appendChild(v);
        summary.appendChild(card);
      });
    }

    const tbody = document.getElementById("cost-components-list");
    if (tbody) {
      tbody.innerHTML = "";
      const durationMonths = results.durationMonths;
      const ppg = results.cfg.participantsPerGroup;

      const shares = [
        { label: "Facilitators and staff time", share: 0.45 },
        { label: "Venue and overheads", share: 0.25 },
        { label: "Materials and digital tools", share: 0.15 },
        { label: "Coordination and management", share: 0.15 }
      ];

      shares.forEach(comp => {
        const amountPerGroup =
          results.directCostPerGroup * comp.share;
        const perParticipantPerMonth =
          durationMonths > 0 && ppg > 0
            ? amountPerGroup / (durationMonths * ppg)
            : 0;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${comp.label}</td>
          <td>${(comp.share * 100).toFixed(0)} %</td>
          <td class="numeric-cell">${formatCurrency(amountPerGroup)}</td>
          <td class="numeric-cell">${formatCurrency(perParticipantPerMonth)}</td>
          <td>Illustrative share of direct programme cost (can be refined for specific implementations).</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  /* ===========================
     National simulation tab
     =========================== */

  function updateNationalSimulation(results) {
    const totalCost = results.totalCostAllGroups;
    const totalBenefit = results.totalWtpAllGroups || 0;
    const net = results.netBenefitAllGroups || (totalBenefit - totalCost);
    const bcrNat =
      totalCost > 0 ? totalBenefit / totalCost : results.bcr;

    const totalParticipants =
      results.cfg.participantsPerGroup * results.cfg.numberOfGroups;
    const endorsedParticipants =
      totalParticipants * results.util.endorseProb;

    setText("nat-total-cost", formatCurrency(totalCost));
    setText("nat-total-benefit", formatCurrency(totalBenefit));
    setText("nat-net-benefit", formatCurrency(net));
    setText(
      "nat-bcr",
      bcrNat === null ? "-" : bcrNat.toFixed(2)
    );
    setText(
      "nat-total-wtp",
      formatCurrency(totalBenefit)
    );
    setText("nat-graduates", formatNumber(endorsedParticipants, 0));
    setText("nat-outbreaks", formatNumber(totalParticipants, 0));

    const summary = document.getElementById("natsim-summary-text");
    if (summary) {
      summary.textContent =
        `At this scale the programme would reach around ${formatNumber(
          totalParticipants,
          0
        )} older adults, with approximately ${formatNumber(
          endorsedParticipants,
          0
        )} participating in the endorsed configuration given current preferences. ` +
        `Total economic costs are about ${formatCurrency(
          totalCost
        )}, with preference-based benefits of ${formatCurrency(
          totalBenefit
        )} and a national benefit–cost ratio of ${
          bcrNat ? bcrNat.toFixed(2) : "-"
        }.`;
    }

    const ChartLib = window.Chart;
    if (!ChartLib) return;

    const natCostCtx = document.getElementById("chart-nat-cost-benefit");
    if (natCostCtx) {
      if (state.charts.natCostBenefit) state.charts.natCostBenefit.destroy();
      state.charts.natCostBenefit = new ChartLib(natCostCtx, {
        type: "bar",
        data: {
          labels: ["Total economic cost", "Total WTP benefit"],
          datasets: [
            {
              data: [totalCost || 0, totalBenefit || 0]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }

    const natEpiCtx = document.getElementById("chart-nat-epi");
    if (natEpiCtx) {
      if (state.charts.natEpi) state.charts.natEpi.destroy();
      state.charts.natEpi = new ChartLib(natEpiCtx, {
        type: "bar",
        data: {
          labels: ["Total participants", "Participants in endorsed programme"],
          datasets: [
            {
              data: [totalParticipants || 0, endorsedParticipants || 0]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  /* ===========================
     Sensitivity / DCE benefits tab
     =========================== */

  function updateSensitivityTab() {
    const baseResults = state.lastResults;
    if (!baseResults) return;

    const scenarios = [
      {
        label: "Current configuration",
        results: baseResults
      },
      ...state.scenarios.map(s => ({
        label: s.name || "Saved scenario",
        results: s.results
      }))
    ];

    const mainBody = document.getElementById("dce-benefits-table-body");
    if (mainBody) {
      mainBody.innerHTML = "";
      scenarios.forEach(sc => {
        const r = sc.results;
        const cost = r.totalCostAllGroups;
        const totalWtp = r.totalWtpAllGroups;
        const endorsement = r.util.endorseProb;
        const effective =
          totalWtp !== null ? totalWtp * endorsement : null;
        const npvDce =
          totalWtp !== null ? totalWtp - cost : null;
        const bcrDce =
          totalWtp !== null && cost > 0 ? totalWtp / cost : null;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${sc.label}</td>
          <td class="numeric-col">${formatCurrency(cost)}</td>
          <td class="numeric-col">${formatCurrency(totalWtp || 0)}</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">${formatPercent(endorsement, 1)}</td>
          <td class="numeric-col">${effective === null ? "-" : formatCurrency(effective)}</td>
          <td class="numeric-col">${bcrDce === null ? "-" : bcrDce.toFixed(2)}</td>
          <td class="numeric-col">${npvDce === null ? "-" : formatCurrency(npvDce)}</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
        `;
        mainBody.appendChild(tr);
      });
    }

    const detailBody = document.getElementById("sensitivity-table-body");
    if (detailBody) {
      detailBody.innerHTML = "";
      scenarios.forEach(sc => {
        const r = sc.results;
        const costPerGroup = r.totalEconomicCostPerGroup;
        const endRate = r.util.endorseProb;
        const totalWtp = r.totalWtpAllGroups;
        const npvDce =
          totalWtp !== null ? totalWtp - r.totalCostAllGroups : null;
        const bcrDce =
          totalWtp !== null && r.totalCostAllGroups > 0
            ? totalWtp / r.totalCostAllGroups
            : null;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${sc.label}</td>
          <td>${state.modelLabel}</td>
          <td class="numeric-col">${formatPercent(endRate, 1)}</td>
          <td class="numeric-col">${formatCurrency(costPerGroup)}</td>
          <td class="numeric-col">${formatCurrency(totalWtp || 0)}</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">${bcrDce === null ? "-" : bcrDce.toFixed(2)}</td>
          <td class="numeric-col">${npvDce === null ? "-" : formatCurrency(npvDce)}</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">-</td>
          <td class="numeric-col">${
            totalWtp === null ? "-" : formatCurrency(totalWtp * endRate)
          }</td>
          <td class="numeric-col">-</td>
        `;
        detailBody.appendChild(tr);
      });
    }
  }

  /* ===========================
     Saved scenarios
     =========================== */

  function saveCurrentScenario() {
    if (!state.lastResults) {
      showToast("Apply a configuration before saving a scenario.", "warning");
      return;
    }

    const cfg = state.lastResults.cfg;
    const name =
      cfg.scenarioName || `Scenario ${state.scenarios.length + 1}`;
    const scenario = {
      id: Date.now(),
      name,
      cfg: { ...cfg },
      results: state.lastResults
    };
    state.scenarios.push(scenario);
    updateScenarioTable();
    updateSensitivityTab();
    showToast("Scenario saved.", "success");
  }

  function updateScenarioTable() {
    const tbody = document.querySelector("#scenario-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.scenarios.forEach(s => {
      const r = s.results;
      const cfg = r.cfg;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" /></td>
        <td>${s.name}</td>
        <td>
          <span class="chip chip-tier">${prettyServiceType(cfg.serviceType)}</span>
          <span class="chip chip-mentorship">${prettyFrequency(cfg.frequency)}</span>
        </td>
        <td>${cfg.serviceType}</td>
        <td>${cfg.mode}</td>
        <td>${cfg.frequency}</td>
        <td>${cfg.duration}</td>
        <td>${cfg.distance}</td>
        <td class="numeric-cell">${formatNumber(cfg.numberOfGroups, 0)}</td>
        <td class="numeric-cell">${formatNumber(cfg.participantsPerGroup, 0)}</td>
        <td class="numeric-cell">${formatCurrency(cfg.costPerParticipantPerMonth)}</td>
        <td>${state.modelLabel}</td>
        <td class="numeric-cell">${formatPercent(r.util.endorseProb, 1)}</td>
        <td class="numeric-cell">${
          r.wtpPerParticipantPerMonth === null
            ? "-"
            : formatCurrency(r.wtpPerParticipantPerMonth, 1)
        }</td>
        <td class="numeric-cell">${
          r.totalWtpAllGroups === null
            ? "-"
            : formatCurrency(r.totalWtpAllGroups)
        }</td>
        <td class="numeric-cell">${
          r.bcr === null ? "-" : r.bcr.toFixed(2)
        }</td>
        <td class="numeric-cell">${formatCurrency(r.totalCostAllGroups)}</td>
        <td class="numeric-cell">${
          r.totalWtpAllGroups === null
            ? "-"
            : formatCurrency(r.totalWtpAllGroups)
        }</td>
        <td class="numeric-cell">${
          r.netBenefitAllGroups === null
            ? "-"
            : formatCurrency(r.netBenefitAllGroups)
        }</td>
        <td class="numeric-cell">${
          cfg.numberOfGroups * cfg.participantsPerGroup
        }</td>
        <td>${cfg.scenarioNotes || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ===========================
     Export utilities
     =========================== */

  function exportTableToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) {
      showToast("Table not found for export.", "error");
      return;
    }
    if (!window.XLSX) {
      showToast("Excel export library not loaded.", "error");
      return;
    }
    const wb = window.XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    window.XLSX.writeFile(wb, filename);
  }

  function exportElementToPdf(elementId, filename) {
    const el = document.getElementById(elementId);
    if (!el) {
      showToast("Content not found for PDF export.", "error");
      return;
    }
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) {
      showToast("PDF export library not loaded.", "error");
      return;
    }
    const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    doc.html(el, {
      callback: function (pdf) {
        pdf.save(filename);
      },
      margin: [24, 24, 24, 24],
      autoPaging: "text"
    });
  }

  /* ===========================
     Tabs
     =========================== */

  function setupTabs() {
    const links = document.querySelectorAll(".tab-link");
    const panels = document.querySelectorAll(".tab-panel");

    links.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabKey = btn.getAttribute("data-tab");
        links.forEach(b => b.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const panel = document.getElementById(`tab-${tabKey}`);
        if (panel) panel.classList.add("active");
      });
    });
  }

  /* ===========================
     Tooltips
     =========================== */

  function setupTooltips() {
    let currentBubble = null;

    function hideBubble() {
      if (currentBubble && currentBubble.parentNode) {
        currentBubble.parentNode.removeChild(currentBubble);
      }
      currentBubble = null;
    }

    document.addEventListener("mouseover", e => {
      const target = e.target.closest(".info-icon");
      if (!target || !target.dataset.tooltip) return;

      hideBubble();

      const bubble = document.createElement("div");
      bubble.className = "tooltip-bubble";
      bubble.innerHTML = `<p>${target.dataset.tooltip}</p><div class="tooltip-arrow"></div>`;
      document.body.appendChild(bubble);
      currentBubble = bubble;

      const rect = target.getBoundingClientRect();
      const bRect = bubble.getBoundingClientRect();
      bubble.style.left = `${rect.left + window.scrollX}px`;
      bubble.style.top = `${rect.bottom + 8 + window.scrollY}px`;
      const arrow = bubble.querySelector(".tooltip-arrow");
      if (arrow) {
        arrow.style.top = "-4px";
        arrow.style.left = "12px";
      }
    });

    document.addEventListener("mouseout", e => {
      if (e.relatedTarget && e.relatedTarget.closest(".tooltip-bubble")) {
        return;
      }
      hideBubble();
    });

    document.addEventListener("scroll", hideBubble);
  }

  /* ===========================
     Slider display and toggles
     =========================== */

  function setupSliderDisplay() {
    const slider = document.getElementById("cost-slider");
    const display = document.getElementById("cost-display");
    const regionEl = document.getElementById("region-select");
    if (!slider || !display) return;

    const update = () => {
      const val = parseFloat(slider.value) || 0;
      const region = regionEl ? regionEl.value || "NSW" : "NSW";
      const multiplier = costOfLivingMultipliers[region] || 1.0;
      const adjusted = val * multiplier;
      display.textContent =
        `${formatCurrency(val)} (base) – ${formatCurrency(adjusted)} after ${region} adjustment`;
    };
    slider.addEventListener("input", update);
    if (regionEl) regionEl.addEventListener("change", update);
    update();
  }

  function setupCurrencyToggle() {
    const buttons = document.querySelectorAll(".pill-toggle[data-currency]");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.currency = btn.dataset.currency || "AUD";
        if (state.lastResults) {
          refreshAll(state.lastResults, { skipToast: true });
        }
      });
    });
  }

  function setupOppToggle() {
    const btn = document.getElementById("opp-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      btn.classList.toggle("on");
      const labelSpan = btn.querySelector(".switch-label");
      if (labelSpan) {
        if (btn.classList.contains("on")) {
          labelSpan.textContent = "Opportunity cost included";
          state.includeOppCost = true;
        } else {
          labelSpan.textContent = "Opportunity cost excluded";
          state.includeOppCost = false;
        }
      }
      if (state.lastResults) {
        const cfg = state.lastResults.cfg;
        const newResults = computeCostsAndBenefits(cfg);
        state.lastResults = newResults;
        refreshAll(newResults, { skipToast: true });
      }
    });
  }

  /* ===========================
     Results modal
     =========================== */

  function setupResultsModal() {
    const openBtn = document.getElementById("open-snapshot");
    const modal = document.getElementById("results-modal");
    const closeBtn = document.getElementById("close-modal");
    const body = document.getElementById("modal-body");
    if (!openBtn || !modal || !closeBtn || !body) return;

    openBtn.addEventListener("click", () => {
      if (!state.lastResults) {
        showToast("Apply a configuration to open a summary.", "warning");
        return;
      }
      const r = state.lastResults;
      const cfg = r.cfg;
      body.innerHTML = `
        <h3>Headline summary</h3>
        <p>
          The selected configuration offers a ${prettyServiceType(
            cfg.serviceType
          ).toLowerCase()} programme, delivered as ${prettyMode(
        cfg.mode
      ).toLowerCase()} with ${prettyFrequency(
        cfg.frequency
      ).toLowerCase()} ${prettyDuration(
        cfg.duration
      ).toLowerCase()} in ${prettyDistance(
        cfg.distance
      ).toLowerCase()}. It is expected to run for ${formatNumber(
        cfg.programmeMonths,
        0
      )} months.
        </p>
        <p>
          The main DCE model suggests that around ${formatPercent(
            r.util.endorseProb,
            1
          )} of older adults would endorse and take up this offer at ${formatCurrency(
        cfg.costPerParticipantPerMonth
      )} per person per month in ${cfg.region}. Total economic costs are approximately ${formatCurrency(
        r.totalCostAllGroups
      )}, compared with preference-based benefits of ${formatCurrency(
        r.totalWtpAllGroups || 0
      )}. This implies a benefit–cost ratio of ${
        r.bcr ? r.bcr.toFixed(2) : "-"
      } and net benefits of ${
        r.netBenefitAllGroups === null
          ? "-"
          : formatCurrency(r.netBenefitAllGroups)
      } under the current assumptions.
        </p>
        <h3>Key indicators</h3>
        <ul>
          <li>Endorsement: ${formatPercent(r.util.endorseProb, 1)}</li>
          <li>Cost per participant per month (adjusted): ${formatCurrency(
            cfg.costPerParticipantPerMonth
          )}</li>
          <li>Total economic cost (all groups): ${formatCurrency(
            r.totalCostAllGroups
          )}</li>
          <li>Total WTP benefit (all groups): ${formatCurrency(
            r.totalWtpAllGroups || 0
          )}</li>
          <li>Benefit–cost ratio: ${
            r.bcr ? r.bcr.toFixed(2) : "-"
          }</li>
        </ul>
      `;
      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    });

    modal.addEventListener("click", e => {
      if (e.target === modal) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ===========================
     Guided tour (optional)
     =========================== */

  function setupGuidedTour() {
    const startBtn = document.getElementById("btn-start-tour");
    const overlay = document.getElementById("tour-overlay");
    const pop = document.getElementById("tour-popover");
    const titleEl = document.getElementById("tour-title");
    const contentEl = document.getElementById("tour-content");
    const indicator = document.getElementById("tour-step-indicator");
    const nextBtn = document.getElementById("tour-next");
    const prevBtn = document.getElementById("tour-prev");
    const closeBtn = document.getElementById("tour-close");
    if (!startBtn || !overlay || !pop) return;

    const steps = Array.from(
      document.querySelectorAll("[data-tour-step]")
    ).map(el => ({
      el,
      title: el.getAttribute("data-tour-title") || "Step",
      content: el.getAttribute("data-tour-content") || "",
      key: el.getAttribute("data-tour-step") || ""
    }));

    let idx = 0;

    function showStep(i) {
      if (!steps.length) return;
      if (i < 0) i = 0;
      if (i >= steps.length) i = steps.length - 1;
      idx = i;
      const step = steps[idx];
      const rect = step.el.getBoundingClientRect();

      overlay.classList.remove("hidden");
      pop.classList.remove("hidden");

      titleEl.textContent = step.title;
      contentEl.textContent = step.content;
      indicator.textContent = `Step ${idx + 1} of ${steps.length}`;

      const top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX;
      pop.style.top = `${top}px`;
      pop.style.left = `${left}px`;
    }

    function endTour() {
      overlay.classList.add("hidden");
      pop.classList.add("hidden");
    }

    startBtn.addEventListener("click", () => {
      showStep(0);
    });

    nextBtn.addEventListener("click", () => {
      showStep(idx + 1);
    });

    prevBtn.addEventListener("click", () => {
      showStep(idx - 1);
    });

    closeBtn.addEventListener("click", endTour);
    overlay.addEventListener("click", endTour);
  }

  /* ===========================
     Refresh all views
     =========================== */

  function refreshAll(results, options = {}) {
    state.lastResults = results;
    updateConfigSummary(results);
    updateResultsTab(results);
    updateCostingTab(results);
    updateNationalSimulation(results);
    updateSensitivityTab();
    if (!options.skipToast) {
      showToast("Configuration applied. Results updated.", "success");
    }
  }

  /* ===========================
     Buttons and init
     =========================== */

  function setupButtons() {
    const applyBtn = document.getElementById("update-results");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const cfg = readConfigurationFromInputs();
        const results = computeCostsAndBenefits(cfg);
        refreshAll(results);
      });
    }

    const saveBtn = document.getElementById("save-scenario");
    if (saveBtn) {
      saveBtn.addEventListener("click", saveCurrentScenario);
    }

    const exportScenExcel = document.getElementById("export-excel");
    if (exportScenExcel) {
      exportScenExcel.addEventListener("click", () =>
        exportTableToExcel("scenario-table", "lonelyless_scenarios.xlsx")
      );
    }

    const exportScenPdf = document.getElementById("export-pdf");
    if (exportScenPdf) {
      exportScenPdf.addEventListener("click", () =>
        exportElementToPdf("tab-scenarios", "lonelyless_policy_brief.pdf")
      );
    }

    const exportSensExcel = document.getElementById(
      "export-sensitivity-benefits-excel"
    );
    if (exportSensExcel) {
      exportSensExcel.addEventListener("click", () =>
        exportTableToExcel("dce-benefits-table", "lonelyless_sensitivity.xlsx")
      );
    }

    const exportSensPdf = document.getElementById(
      "export-sensitivity-benefits-pdf"
    );
    if (exportSensPdf) {
      exportSensPdf.addEventListener("click", () =>
        exportElementToPdf("tab-sensitivity", "lonelyless_sensitivity.pdf")
      );
    }

    const refreshSensBtn = document.getElementById(
      "refresh-sensitivity-benefits"
    );
    if (refreshSensBtn) {
      refreshSensBtn.addEventListener("click", () =>
        updateSensitivityTab()
      );
    }
  }

  function init() {
    setupTabs();
    setupTooltips();
    setupSliderDisplay();
    setupCurrencyToggle();
    setupOppToggle();
    setupResultsModal();
    setupGuidedTour();
    setupButtons();

    // Apply default configuration once on load
    const cfg = readConfigurationFromInputs();
    const results = computeCostsAndBenefits(cfg);
    refreshAll(results, { skipToast: true });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
