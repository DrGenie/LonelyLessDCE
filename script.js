/* ===================================================
   LonelyLessAustralia Decision Aid – script.js
   Premium, STEPS-style DCE + CBA logic
   NOTE: Coefficients below are placeholders – replace
   with LonelyLess DCE estimates before use in practice.
   =================================================== */

(() => {
  /* ===========================
     Global state
     =========================== */

  const state = {
    modelKey: "average",           // "average" | "supportive" | "conservative"
    currency: "AUD",               // "AUD" | "USD" (display only)
    includeOppCost: true,
    scenarios: [],
    charts: {
      uptake: null,
      bcr: null,
      epi: null,
      natCostBenefit: null,
      natEpi: null
    },
    lastResults: null
  };

  /* ===========================
     Placeholder DCE models
     Replace with LonelyLess estimates
     =========================== */

  // Units: utilities are logit coefficients; costPer100 is per 100 AUD/participant/month
  const MODELS = {
    average: {
      label: "Average preference model",
      ascProgram: 0.25,
      ascOptOut: -0.5,
      tier: {
        frontline: 0.0,      // e.g. light-touch programme
        intermediate: 0.25,  // moderate support
        advanced: 0.5        // intensive support
      },
      career: {
        certificate: 0.0,    // e.g. generic community service
        uniqual: 0.1,        // health or social care integration
        career_path: 0.2     // strong integration with health & social care
      },
      mentorship: {
        low: 0.0,
        medium: 0.35,
        high: 0.6
      },
      delivery: {
        blended: 0.2,        // mixed home / community / online
        inperson: 0.15,
        online: -0.2
      },
      response: {
        30: 0.0,             // e.g. slow impact on loneliness
        15: 0.3,
        7: 0.55              // faster reduction in loneliness
      },
      costPer100: -0.02      // more negative = more cost-sensitive
    },
    supportive: {
      label: "Supportive group",
      ascProgram: 0.4,
      ascOptOut: -1.0,
      tier: {
        frontline: 0.0,
        intermediate: 0.35,
        advanced: 0.7
      },
      career: {
        certificate: 0.0,
        uniqual: 0.15,
        career_path: 0.25
      },
      mentorship: {
        low: 0.0,
        medium: 0.45,
        high: 0.75
      },
      delivery: {
        blended: 0.25,
        inperson: 0.15,
        online: -0.3
      },
      response: {
        30: 0.0,
        15: 0.35,
        7: 0.7
      },
      costPer100: -0.03
    },
    conservative: {
      label: "More cautious group",
      ascProgram: 0.1,
      ascOptOut: 0.5,
      tier: {
        frontline: 0.0,
        intermediate: 0.1,
        advanced: 0.15
      },
      career: {
        certificate: 0.0,
        uniqual: 0.05,
        career_path: 0.1
      },
      mentorship: {
        low: 0.0,
        medium: 0.2,
        high: 0.35
      },
      delivery: {
        blended: 0.1,
        inperson: 0.0,
        online: -0.15
      },
      response: {
        30: 0.0,
        15: 0.2,
        7: 0.3
      },
      costPer100: -0.01      // weaker cost sensitivity
    }
  };

  // Length of intervention (months) by programme tier
  function getDurationMonths(tier) {
    if (tier === "intermediate") return 6;
    if (tier === "advanced") return 12;
    return 3; // frontline / light-touch
  }

  // Opp. cost as share of direct programme cost (placeholder)
  function getOppCostRate() {
    return 0.2; // 20% – adjust as needed
  }

  /* ===========================
     Utility and endorsement
     =========================== */

  function logistic(x) {
    if (x > 50) return 1;
    if (x < -50) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function getModel() {
    if (state.modelKey === "supportive") return MODELS.supportive;
    if (state.modelKey === "conservative") return MODELS.conservative;
    return MODELS.average;
  }

  function computeDesignUtility(cfg, model) {
    const uTier = model.tier[cfg.tier] || 0;
    const uCareer = model.career[cfg.career] || 0;
    const uMentor = model.mentorship[cfg.mentorship] || 0;
    const uDelivery = model.delivery[cfg.delivery] || 0;
    const uResponse = model.response[cfg.response] || 0;
    return uTier + uCareer + uMentor + uDelivery + uResponse;
  }

  function computeEndorsement(cfg) {
    const model = getModel();
    const base = computeDesignUtility(cfg, model);
    const ascProg = typeof model.ascProgram === "number" ? model.ascProgram : 0;
    const ascOpt = typeof model.ascOptOut === "number" ? model.ascOptOut : 0;
    const costPer100 = model.costPer100 || 0;

    const costHundreds = cfg.costPerParticipantPerMonth / 100;
    const costTerm = costPer100 * costHundreds;

    const U_prog = ascProg + base + costTerm;
    const U_opt = ascOpt; // status quo

    const expP = Math.exp(U_prog);
    const expO = Math.exp(U_opt);
    const denom = expP + expO;

    const endorseProb = denom === 0 ? 0 : expP / denom;
    const optoutProb = denom === 0 ? 1 : expO / denom;

    return {
      endorseProb,
      optoutProb,
      model,
      baseUtility: base,
      ascProg,
      ascOpt,
      costTerm
    };
  }

  /* ===========================
     WTP (placeholder implementation)
     =========================== */

  function computeWtpPerParticipantPerMonth(cfg, model) {
    const costPer100 = model.costPer100 || 0;
    if (!costPer100) return null;

    // Utility difference between this configuration and a notional "baseline"
    const baselineCfg = {
      tier: "frontline",
      career: "certificate",
      mentorship: "low",
      delivery: "blended",
      response: "30",
      costPerParticipantPerMonth: cfg.costPerParticipantPerMonth
    };

    const uCurrent = computeDesignUtility(cfg, model);
    const uBase = computeDesignUtility(baselineCfg, model);
    const delta = uCurrent - uBase;

    // WTP in units of 100 AUD/participant/month
    const wtpPer100 = -delta / costPer100;
    const wtp = wtpPer100 * 100;

    if (!isFinite(wtp)) return null;
    return wtp;
  }

  /* ===========================
     Cost and benefit calculations
     =========================== */

  function computeCostsAndBenefits(cfg) {
    const util = computeEndorsement(cfg);
    const model = util.model;

    const durationMonths = getDurationMonths(cfg.tier);
    const participantsPerGroup = cfg.participantsPerGroup;
    const groups = cfg.numberOfGroups;

    const directCostPerGroup =
      cfg.costPerParticipantPerMonth * participantsPerGroup * durationMonths;

    const oppRate = getOppCostRate();
    const oppCostPerGroup = state.includeOppCost
      ? directCostPerGroup * oppRate
      : 0;

    const totalEconomicCostPerGroup = directCostPerGroup + oppCostPerGroup;
    const totalCostAllGroups = totalEconomicCostPerGroup * groups;

    const wtpPerParticipantPerMonth = computeWtpPerParticipantPerMonth(
      cfg,
      model
    );
    let totalWtpAllGroups = null;
    let wtpPerGroup = null;

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
      const rate = 1.5; // placeholder AUD per USD – adjust in advanced settings if needed
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
     Read configuration from form
     =========================== */

  function readConfigurationFromInputs() {
    const tier = (document.getElementById("program-tier") || {}).value || "frontline";
    const career = (document.getElementById("career-track") || {}).value || "certificate";
    const mentorship = (document.getElementById("mentorship") || {}).value || "low";
    const delivery = (document.getElementById("delivery") || {}).value || "blended";
    const response = (document.getElementById("response") || {}).value || "30";

    const costSlider = document.getElementById("cost-slider");
    const participantsInput = document.getElementById("trainees");
    const groupsInput = document.getElementById("cohorts");

    const costPerParticipantPerMonth = costSlider
      ? parseFloat(costSlider.value) || 0
      : 0;

    const participantsPerGroup = participantsInput
      ? parseInt(participantsInput.value, 10) || 0
      : 0;

    const numberOfGroups = groupsInput
      ? parseInt(groupsInput.value, 10) || 0
      : 0;

    const nameInput = document.getElementById("scenario-name");
    const notesInput = document.getElementById("scenario-notes");

    return {
      tier,
      career,
      mentorship,
      delivery,
      response,
      costPerParticipantPerMonth,
      participantsPerGroup,
      numberOfGroups,
      scenarioName: nameInput ? nameInput.value.trim() : "",
      scenarioNotes: notesInput ? notesInput.value.trim() : ""
    };
  }

  /* ===========================
     Update UI – configuration summary
     =========================== */

  function updateConfigSummary(results) {
    const cfg = results.cfg;

    const summaryEl = document.getElementById("config-summary");
    if (!summaryEl) return;

    summaryEl.innerHTML = "";

    const rows = [
      ["Programme intensity", prettyTier(cfg.tier)],
      ["Delivery mode", prettyDelivery(cfg.delivery)],
      ["Support intensity", prettyMentorship(cfg.mentorship)],
      ["Time to noticeable impact", prettyResponse(cfg.response)],
      ["Participants per group", formatNumber(cfg.participantsPerGroup)],
      ["Number of groups", formatNumber(cfg.numberOfGroups)],
      [
        "Cost per participant per month",
        formatCurrency(cfg.costPerParticipantPerMonth)
      ],
      [
        "Model",
        getModel().label
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
        ? "Set a configuration to see whether the benefits of the programme are likely to justify the costs under the current assumptions."
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
      `In this scenario, a ${prettyTier(cfg.tier)} programme delivered ` +
      `${prettyDelivery(cfg.delivery)} with ${prettyMentorship(
        cfg.mentorship
      )} support is offered to ${formatNumber(
        cfg.participantsPerGroup
      )} participants in each group across ${formatNumber(
        cfg.numberOfGroups
      )} groups. The estimated endorsement rate among stakeholders is ${formatPercent(
        results.util.endorseProb,
        1
      )}. ` +
      `Total economic costs over the whole programme are approximately ${formatCurrency(
        results.totalCostAllGroups
      )}, while preference-based willingness-to-pay benefits are around ${formatCurrency(
        results.totalWtpAllGroups || 0
      )}, implying a benefit–cost ratio of ${
        results.bcr ? results.bcr.toFixed(2) : "-"
      } under the current assumptions.`;
  }

  function prettyTier(tier) {
    if (tier === "intermediate") return "moderate-intensity programme";
    if (tier === "advanced") return "high-intensity programme";
    return "light-touch programme";
  }

  function prettyDelivery(d) {
    if (d === "inperson") return "in-person in community settings";
    if (d === "online") return "fully online";
    return "blended across home, community and online";
  }

  function prettyMentorship(m) {
    if (m === "high") return "high level of structured contact";
    if (m === "medium") return "moderate contact and follow-up";
    return "lighter-touch contact";
  }

  function prettyResponse(r) {
    if (String(r) === "7") return "within around 2 months";
    if (String(r) === "15") return "within 3–6 months";
    return "over a longer period";
  }

  /* ===========================
     Update UI – results tab
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
        : formatCurrency(results.wtpPerParticipantPerMonth)
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

    // Simple “epidemiological” panel interpreted as reach
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
     Charts with Chart.js
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
                  return value >= 1000
                    ? (value / 1000000).toFixed(1) + "m"
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

    // “Epidemiological” chart interpreted as reach
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
        { id: "facilitator", label: "Facilitators and staff time", share: 0.45 },
        { id: "venue", label: "Venue and overheads", share: 0.25 },
        { id: "materials", label: "Materials and digital tools", share: 0.15 },
        { id: "coordination", label: "Coordination and management", share: 0.15 }
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
          <td>Share of direct programme cost (illustrative split).</td>
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
        )} receiving the endorsed configuration given current preferences. ` +
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

  function getBenefitDefinition() {
    const sel = document.getElementById("benefit-definition-select");
    return sel ? sel.value : "wtp_only";
  }

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
          <td>${getModel().label}</td>
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
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" /></td>
        <td>${s.name}</td>
        <td>
          <span class="chip chip-tier">${prettyTier(r.cfg.tier)}</span>
          <span class="chip chip-mentorship">${prettyMentorship(r.cfg.mentorship)}</span>
        </td>
        <td>${r.cfg.tier}</td>
        <td>${r.cfg.career}</td>
        <td>${r.cfg.mentorship}</td>
        <td>${r.cfg.delivery}</td>
        <td>${r.cfg.response}</td>
        <td class="numeric-cell">${formatNumber(r.cfg.numberOfGroups, 0)}</td>
        <td class="numeric-cell">${formatNumber(r.cfg.participantsPerGroup, 0)}</td>
        <td class="numeric-cell">${formatCurrency(r.cfg.costPerParticipantPerMonth)}</td>
        <td>${getModel().label}</td>
        <td class="numeric-cell">${formatPercent(r.util.endorseProb, 1)}</td>
        <td class="numeric-cell">${
          r.wtpPerParticipantPerMonth === null
            ? "-"
            : formatCurrency(r.wtpPerParticipantPerMonth)
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
          r.cfg.numberOfGroups * r.cfg.participantsPerGroup
        }</td>
        <td>${r.cfg.scenarioNotes || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ===========================
     Export utilities (Excel / PDF)
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
    if (!slider || !display) return;
    const update = () => {
      const val = parseFloat(slider.value) || 0;
      display.textContent = formatCurrency(val);
    };
    slider.addEventListener("input", update);
    update();
  }

  function setupModelToggle() {
    const buttons = document.querySelectorAll(".pill-toggle[data-model]");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.modelKey = btn.dataset.model === "lc2"
          ? "supportive"
          : btn.dataset.model === "lc1"
          ? "conservative"
          : "average";
        if (state.lastResults) {
          const cfg = state.lastResults.cfg;
          const newResults = computeCostsAndBenefits(cfg);
          state.lastResults = newResults;
          refreshAll(newResults, { skipToast: true });
        }
      });
    });
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
          The selected configuration offers a ${prettyTier(
            cfg.tier
          )} programme delivered ${prettyDelivery(
        cfg.delivery
      )} with ${prettyMentorship(
        cfg.mentorship
      )} support. It is expected to reach ${formatNumber(
        cfg.participantsPerGroup * cfg.numberOfGroups,
        0
      )} older adults in total.
        </p>
        <p>
          The estimated endorsement rate is ${formatPercent(
            r.util.endorseProb,
            1
          )}. Total economic costs are approximately ${formatCurrency(
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
          <li>Cost per participant per month: ${formatCurrency(
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
     Guided tour (minimal)
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
     Init
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
    setupModelToggle();
    setupCurrencyToggle();
    setupOppToggle();
    setupResultsModal();
    setupGuidedTour();
    setupButtons();

    // Apply default configuration once
    const cfg = readConfigurationFromInputs();
    const results = computeCostsAndBenefits(cfg);
    refreshAll(results, { skipToast: true });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
