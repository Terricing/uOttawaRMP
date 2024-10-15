// Description: This script is injected into the page when the extension is enabled.
// It sends a message to the background script to retrieve the professor's info from RMP.
// The background script then sends the info back to this script, which inserts it into the page.

// run this function when triggered by action
// function performSearch() {
// select iframe that displays class info
const iframe = document.querySelector('iframe').contentWindow.document;

// css to add space between prof name and rating
const style = document.createElement('style');
style.innerHTML = `
  .rating {
    margin-top: 7px;
  }
`;
iframe.head.appendChild(style);

// if viewing in schedule
populateProfessors(iframe, "DERIVED_CLS_DTL_SSR_INSTR_LONG$");
// if viewing in course selector
populateProfessors(iframe, "MTG_INSTR$");

function populateProfessors(parent, id) {
  // TODO: cache professors to avoid multiple requests
  let count = 0;

  let currElement = parent.getElementById(id + count.toString());
  while (currElement != null) {
    if (currElement.textContent != 'Staff') {
      handleProfessorInfo(currElement, currElement.textContent);
    }
    count++;
    currElement = iframe.getElementById(id + count.toString());
  }
}

async function handleProfessorInfo(element, professorName) {
  if (!/[a-zA-Z]/.test(professorName)) {
    return;
  }

  try {
    const port = chrome.runtime.connect({ name: "professor-rating" });
    port.postMessage({ professorName });
    port.onMessage.addListener((teacher) => {
      if (teacher.error) {
        insertNoProfError(element);
      } else {
        // get the professor's info from the response
        const avgRating = teacher.avgRating;
        const numRatings = teacher.numRatings;
        const avgDifficulty = teacher.avgDifficulty;
        const wouldTakeAgainPercent = parseInt(teacher.wouldTakeAgainPercent);
        const legacyId = teacher.legacyId;

        // if the professor has no ratings, RMP will return -1 for this field
        if (wouldTakeAgainPercent === -1) {
          insertNoRatingsError(element, legacyId);
          return;
        }

        // insert the professor's info into the page
        insertNumRatings(element, numRatings, legacyId);
        insertWouldTakeAgainPercent(element, wouldTakeAgainPercent);
        insertAvgDifficulty(element, avgDifficulty);
        insertRating(element, avgRating);
      }
  });
}  catch (error) {
    // insert an error message if the request fails
    insertNoProfError(link);
  }
}

// helper functions to insert the professor's info into the page
function insertRating(link, avgRating) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="rating"><b>Rating:</b> ${avgRating}/5</div>`
  );
}

function insertVSBRating(link, avgRating) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="vsb-rating"><b>Rating:</b> ${avgRating}/5</div>`
  );
}

function insertAvgDifficulty(link, avgDifficulty) {
  link.insertAdjacentHTML(
    "afterend",
    `<div><b>Difficulty:</b> ${avgDifficulty}/5</div>`
  );
}

function insertWouldTakeAgainPercent(link, wouldTakeAgainPercent) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="rating"><b>${wouldTakeAgainPercent}%</b> of students would take this professor again.</div>`
  );
}

function insertNumRatings(link, numRatings, legacyId) {
  const profLink = `<a href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>${numRatings} ratings</a>`;
  link.insertAdjacentHTML("afterend", `<div>${profLink}</div>`);
}

function insertNoRatingsError(link, legacyId) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="rating"><b>Error:</b> this professor has <a href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>no ratings on RateMyProfessors.</a></div>`
  );
}

function insertNoProfError(link) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="rating"><b>Error:</b> this professor is not registered on RateMyProfessors.</div>`
  );
}

function insertVSBNoRatingsError(link, legacyId) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="vsb-rating"><b>Error:</b> this professor has <a href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>no ratings on RateMyProfessors.</a></div>`
  );
}

function insertVSBNoProfError(link) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="vsb-rating"><b>Error:</b> this professor is not registered on RateMyProfessors.</div>`
  );
}

function insertProxyError(link, errorMessage) {
  link.insertAdjacentHTML(
    "afterend",
    `<div class="rating"><b>Error:</b> ${errorMessage}</div>`
  );
}

function insertNoProfTooltip(element) {
  const tooltipContent = `<div><b>Error:</b> this professor is not registered on RateMyProfessors.</div>`;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-text error-tooltip";
  tooltip.innerHTML = tooltipContent;

  const tooltipContainer = document.createElement("span");
  tooltipContainer.className = "prof-tooltip";
  tooltipContainer.appendChild(element.cloneNode(true));
  tooltipContainer.appendChild(tooltip);
  element.parentNode.appendChild(tooltipContainer);
  positionTooltip(element);

  element.replaceWith(tooltipContainer);

  tooltipContainer.addEventListener("mouseenter", () => {
    tooltip.style.visibility = "visible";
    clearTimeout(timeoutId);
  });

  tooltipContainer.addEventListener("mouseleave", () => {
    timeoutId = setTimeout(() => {
      tooltip.style.visibility = "hidden";
    }, 1000);
  });
}

function insertNoRatingsTooltip(element, legacyId) {
  const tooltipContent = `
    <div><b>Error:</b> this professor has <a href='https://www.ratemyprofessors.com/professor?tid=${legacyId}'>no ratings on RateMyProfessors.</a></div>
  `;

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip-text error-tooltip";
  tooltip.innerHTML = tooltipContent;

  const tooltipContainer = document.createElement("span");
  tooltipContainer.className = "prof-tooltip";
  tooltipContainer.appendChild(element.cloneNode(true));
  tooltipContainer.appendChild(tooltip);
  element.parentNode.appendChild(tooltipContainer);
  positionTooltip(element);

  element.replaceWith(tooltipContainer);

  tooltipContainer.addEventListener("mouseenter", () => {
    tooltip.style.visibility = "visible";
    clearTimeout(timeoutId);
  });

  tooltipContainer.addEventListener("mouseleave", () => {
    timeoutId = setTimeout(() => {
      tooltip.style.visibility = "hidden";
    }, 1000);
  });
}
