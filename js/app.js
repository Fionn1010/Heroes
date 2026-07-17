(() => {
  "use strict";

  const config = window.HERO_TOUR_CONFIG;
  const $ = id => document.getElementById(id);
  let current = 0;

  const params = new URLSearchParams(location.search);
  const devMode = params.get("dev") === "1" || params.has("dev");

  function station() {
    return config.stations[current];
  }

  function showImage(src, alt) {
    const image = $("heroImage");
    const placeholder = $("imagePlaceholder");
    image.onload = () => {
      image.hidden = false;
      placeholder.hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      placeholder.hidden = false;
    };
    image.alt = alt;
    image.src = src;
  }

  function renderStation(scroll = false) {
    const item = station();
    const total = config.stations.length;

    $("stopCounter").textContent = `Station ${current + 1} of ${total}`;
    $("progressBar").style.width = `${((current + 1) / total) * 100}%`;
    $("stationNumber").textContent = String(current + 1).padStart(2, "0");
    $("stationLabel").textContent = item.label || `Selfie Station ${current + 1}`;
    $("heroName").textContent = item.name;
    $("heroDates").textContent = item.dates || "";
    $("heroDates").hidden = !item.dates;
    $("heroIntro").textContent = item.intro || "";

    $("heroQuote").textContent = item.quote || "";
    $("heroQuote").hidden = !item.quote;

    showImage(item.image, `${item.name} portrait`);

    $("previousStop").disabled = current === 0;
    $("nextStop").textContent = current === total - 1 ? "Finish tour" : "Next hero";
    $("arPanel").hidden = true;

    document.querySelectorAll(".devStation").forEach((row, index) => {
      row.style.outline = index === current ? "3px solid rgba(191,139,47,.35)" : "none";
    });

    if (scroll) $("tourArea").scrollIntoView({behavior:"smooth", block:"start"});
  }

  function openTour(index = 0) {
    current = Math.max(0, Math.min(index, config.stations.length - 1));
    $("tourArea").hidden = false;
    $("finishPanel").hidden = true;
    renderStation(true);
  }

  function prepareAR() {
    const item = station();
    $("arHeroName").textContent = item.name;

    const model = $("heroModel");
    model.src = item.model || "";
    if (item.iosModel) model.setAttribute("ios-src", item.iosModel);
    else model.removeAttribute("ios-src");

    $("arStatus").textContent = item.model
      ? "When the model is available, tap “Place hero in AR”."
      : "No AR model has been added for this hero yet.";

    $("activateAR").disabled = !item.model;
    $("arPanel").hidden = false;
    $("arPanel").scrollIntoView({behavior:"smooth", block:"start"});
  }

  async function activateAR() {
    const model = $("heroModel");
    if (!model.src) return;
    try {
      await model.activateAR();
    } catch (error) {
      $("arStatus").textContent =
        "AR could not start on this device. Try Safari on iPhone or Chrome on an AR-capable Android phone.";
      console.error(error);
    }
  }

  function playStory() {
    const item = station();
    const audio = $("storyAudio");

    if (!item.audio) {
      alert("No narration has been added for this hero yet.");
      return;
    }

    audio.src = item.audio;
    audio.play().catch(() => {
      alert("The narration file is not available yet.");
    });
  }

  function buildDeveloperTools() {
    if (!devMode) return;

    $("developerTools").hidden = false;
    $("openDevTools").hidden = false;
    $("openDevTools").addEventListener("click", () => {
      $("developerTools").scrollIntoView({behavior:"smooth"});
    });

    const holder = $("devStations");
    config.stations.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "devStation";
      row.innerHTML = `
        <div>
          <strong>${index + 1}. ${item.name}</strong>
          <small>${item.model || "No model configured"}</small>
        </div>
        <div class="devActions">
          <button class="devScene" type="button">Open scene</button>
          <button class="devAR" type="button">Launch AR</button>
        </div>
      `;

      row.querySelector(".devScene").addEventListener("click", () => openTour(index));
      row.querySelector(".devAR").addEventListener("click", () => {
        openTour(index);
        setTimeout(() => {
          prepareAR();
          setTimeout(activateAR, 250);
        }, 150);
      });
      holder.appendChild(row);
    });

    const requested = Number(params.get("stop"));
    if (Number.isInteger(requested) && requested >= 1 && requested <= config.stations.length) {
      openTour(requested - 1);
    }
  }

  $("tourTitle").textContent = config.title;
  $("tourSubtitle").textContent = config.subtitle;
  document.title = config.title;

  $("startTour").addEventListener("click", () => openTour(0));
  $("previousStop").addEventListener("click", () => {
    if (current > 0) {
      current -= 1;
      renderStation(true);
    }
  });
  $("nextStop").addEventListener("click", () => {
    if (current < config.stations.length - 1) {
      current += 1;
      renderStation(true);
    } else {
      $("tourArea").hidden = true;
      $("finishPanel").hidden = false;
      $("finishPanel").scrollIntoView({behavior:"smooth"});
    }
  });
  $("restartTour").addEventListener("click", () => openTour(0));
  $("launchAR").addEventListener("click", prepareAR);
  $("activateAR").addEventListener("click", activateAR);
  $("closeAR").addEventListener("click", () => $("arPanel").hidden = true);
  $("playStory").addEventListener("click", playStory);

  buildDeveloperTools();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }
})();
