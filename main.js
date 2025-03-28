$(document).ready(function () {
  let svg = $("#us-map");
  let connectionsVisible = false;
  let organizationData = {};
  let stateScores = {};
  let minScore = 0;
  let maxScore = 0;
  
  $("#load-spreadsheet").click(function () {
    const url = $("#spreadsheet-url").val().trim();
    if (!url || !url.includes("docs.google.com")) {
      alert("Please provide a valid Google Sheets CSV URL.");
      return;
    }
    fetchGoogleSheetsData(url);
  });

  $("#generate-embed").click(function () {
    const url = $("#spreadsheet-url").val().trim();
    if (!url || !url.includes("docs.google.com")) {
      alert("Please provide a valid Google Sheets CSV URL.");
      return;
    }
    const embedCode = `
<iframe 
  src="${window.location.origin + window.location.pathname}?spreadsheet=${encodeURIComponent(url)}" 
  width="100%" 
  height="600" 
  style="border:none;">
</iframe>`.trim();

    $("#embed-code").val(embedCode);
    $("#embed-box").removeClass("hidden");
  });

  $("#copy-embed").click(function () {
    const textarea = document.getElementById("embed-code");
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("Embed code copied to clipboard!");
  });

  const urlParams = new URLSearchParams(window.location.search);
  const autoSheet = urlParams.get("spreadsheet");
  if (autoSheet) {
    $("#spreadsheet-url").val(decodeURIComponent(autoSheet));
    fetchGoogleSheetsData(autoSheet);
  }

  function fetchGoogleSheetsData(sheetUrl) {
    organizationData = {};
    stateScores = {};

    fetch(sheetUrl)
      .then(response => response.text())
      .then(csvData => {
        let rows = csvData.split("\n").map(row => row.split(","));

        rows.slice(1).forEach(row => {
          let organization = row[0]?.trim().toUpperCase().replace(/['"]+/g, '');
          let state = row[1]?.trim();
          let score = parseFloat(row[3]?.trim());

          if (state && organization) {
            if (!organizationData[state]) organizationData[state] = [];
            if (!stateScores[state] && !isNaN(score) stateScores[state] = 0;
            
            organizationData[state].push(
              `${organization}: <span class="industry">${industry}</span>`
            );
            if(!isNaN(score))
            {stateScores[state] += score;}
          }
        });
    
        minScore = Math.min(...Object.values(stateScores));
        maxScore = Math.max(...Object.values(stateScores));

        console.log("✅ Data loaded:", organizationData, stateScores);
        applyStateColors();
      })
      .catch(error => {
        console.error("❌ Error fetching spreadsheet:", error);
        alert("There was an error loading the spreadsheet.");
      });
  }

  function scaleToAlpha(score, min, max) {
    if (max === min) return 0.5;
    return 0.2 + ((score - min) / (max - min)) * 0.8;
  }

  function applyStateColors() {
    $("path, circle").each(function () {
      let stateId = $(this).attr("id");
      if (stateId === "path58" || stateId === "circle60") stateId = "DC";

      if (stateScores[stateId] !== undefined) {
        let alpha = scaleToAlpha(stateScores[stateId], minScore, maxScore);
        $(this).css("fill", `rgba(33,95,154, ${alpha})`);
      } else {
        $(this).css("fill", "rgba(200, 200, 200, 0.5)");
      }
    });
  }

  $("#toggle-connections").click(function () {
    if (!connectionsVisible) {
      presetConnections.forEach(({ from, to }) => drawLine(from, to));
      $("#connections-info").slideDown();
      $(this).text("Clear Connections");
    } else {
      $(".state-connection").remove();
      $("#connections-info").slideUp();
      $(this).text("Show Connections");
    }
    connectionsVisible = !connectionsVisible;
  });

  $("path, circle").hover(function () {
    let stateId = $(this).attr("id");
    if (stateId === "path58" || stateId === "circle60") stateId = "DC";

    let info = $(this).attr("data-info") || `State: ${stateId}`;
    let orgList = organizationData[stateId] || [];

    let orgDetails = orgList.length > 0
      ? `<ul style="text-align:left;">${orgList.map(org => `<li>${org}</li>`).join("")}</ul>`
      : "<br><strong>No organizations listed.</strong>";

    $("#info-box").html(info + orgDetails);
  }, function () {
    $("#info-box").html("Hover over a state to see details");
  });
});
