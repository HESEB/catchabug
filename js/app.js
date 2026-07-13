(function () {
  "use strict";

  var SAVE_KEY = "bugcapture_save_v1";

  function defaultState() {
    return {
      version: 1,
      player: { name: "Capcha", status: "신입 Capcha 후보" },
      world: { regionId: "research_lab", x: 0, y: 0 },
      quests: {
        main_capcha_test: {
          accepted: false,
          completed: false,
          targets: {
            worker_ant: false,
            soldier_ant: false,
            queen_ant: false,
            grasshopper: false
          }
        }
      },
      pokedex: { granted: false, entries: {} },
      ownedBugs: [],
      inventory: {}
    };
  }

  var state = defaultState();

  var professorButton = document.getElementById("professorButton");
  var questButton = document.getElementById("questButton");
  var saveButton = document.getElementById("saveButton");
  var loadButton = document.getElementById("loadButton");
  var resetButton = document.getElementById("resetButton");
  var fileInput = document.getElementById("fileInput");
  var statusEl = document.getElementById("status");
  var questSummary = document.getElementById("questSummary");
  var capchaStatus = document.getElementById("capchaStatus");

  var dialogOverlay = document.getElementById("dialogOverlay");
  var dialogText = document.getElementById("dialogText");
  var dialogChoices = document.getElementById("dialogChoices");
  var nextDialogButton = document.getElementById("nextDialogButton");

  var questOverlay = document.getElementById("questOverlay");
  var closeQuestButton = document.getElementById("closeQuestButton");

  var introLines = [
    "어서 오게! 자네가 오늘부터 연구소에서 일하게 될 신입 후보인가?",
    "세상에는 아직 기록되지 않은 곤충이 아주 많다네. 잠자리는 겹눈이 그렇게 많다는데… 얼마나 어지럽겠어~",
    "신입 Capcha가 되려면 먼저 현장 채집 능력을 증명해야 하네.",
    "연구소 인근 들판에서 일개미, 장군개미, 여왕개미, 메뚜기를 한 마리씩 채집해 오게."
  ];

  var dialogIndex = 0;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function migrate(data) {
    var fresh = defaultState();
    if (!data || typeof data !== "object") return fresh;

    if (data.player) {
      fresh.player.name = data.player.name || fresh.player.name;
      fresh.player.status = data.player.status || fresh.player.status;
    }
    if (data.world) {
      fresh.world.regionId = data.world.regionId || fresh.world.regionId;
      fresh.world.x = Number(data.world.x || 0);
      fresh.world.y = Number(data.world.y || 0);
    }
    if (data.quests && data.quests.main_capcha_test) {
      fresh.quests.main_capcha_test = Object.assign(
        fresh.quests.main_capcha_test,
        data.quests.main_capcha_test
      );
    }
    if (data.pokedex) fresh.pokedex = data.pokedex;
    if (Array.isArray(data.ownedBugs)) fresh.ownedBugs = data.ownedBugs;
    if (data.inventory) fresh.inventory = data.inventory;

    return fresh;
  }

  function storageAvailable() {
    try {
      var key = "__bugcapture_storage_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveToBrowser() {
    if (!storageAvailable()) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function downloadSaveFile() {
    var payload = JSON.stringify(state, null, 2);
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var now = new Date();
    var stamp = now.getFullYear()
      + String(now.getMonth() + 1).padStart(2, "0")
      + String(now.getDate()).padStart(2, "0")
      + "_"
      + String(now.getHours()).padStart(2, "0")
      + String(now.getMinutes()).padStart(2, "0")
      + String(now.getSeconds()).padStart(2, "0");
    a.href = url;
    a.download = "BugCapture_Save_" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function loadFromBrowser() {
    if (!storageAvailable()) return false;
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      state = migrate(JSON.parse(raw));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  function render() {
    var quest = state.quests.main_capcha_test;
    questSummary.textContent = quest.accepted ? "신입 Capcha 시험" : "없음";
    capchaStatus.textContent = state.player.status;
    questButton.disabled = !quest.accepted;
    questButton.style.opacity = quest.accepted ? "1" : ".45";
  }

  function closeDialog() {
    dialogOverlay.classList.add("hidden");
  }

  function openDialog() {
    dialogIndex = 0;
    dialogChoices.innerHTML = "";
    nextDialogButton.hidden = false;

    if (state.quests.main_capcha_test.accepted) {
      dialogText.textContent = "아직 시험은 끝나지 않았네. 들판에서 지정한 네 종류의 곤충을 채집해 오게.";
    } else {
      dialogText.textContent = introLines[dialogIndex];
    }

    dialogOverlay.classList.remove("hidden");
  }

  function showAcceptChoices() {
    nextDialogButton.hidden = true;
    dialogChoices.innerHTML = "";

    var acceptButton = document.createElement("button");
    acceptButton.type = "button";
    acceptButton.textContent = "임무를 받겠습니다";
    acceptButton.addEventListener("click", function () {
      state.quests.main_capcha_test.accepted = true;
      saveToBrowser();
      render();
      dialogText.textContent = "좋아! 이걸로 시험이 시작됐네. 곤충들을 놀라게 하지 않도록 천천히 접근하게.";
      dialogChoices.innerHTML = "";

      var confirmButton = document.createElement("button");
      confirmButton.type = "button";
      confirmButton.textContent = "확인";
      confirmButton.addEventListener("click", function () {
        closeDialog();
        statusEl.textContent = "신입 Capcha 시험을 수락했습니다.";
      });
      dialogChoices.appendChild(confirmButton);
    });

    var declineButton = document.createElement("button");
    declineButton.type = "button";
    declineButton.textContent = "조금 더 생각해 볼게요";
    declineButton.addEventListener("click", function () {
      closeDialog();
      statusEl.textContent = "준비가 되면 다시 호박사에게 말을 걸어주세요.";
    });

    dialogChoices.appendChild(acceptButton);
    dialogChoices.appendChild(declineButton);
  }

  professorButton.addEventListener("click", openDialog);

  nextDialogButton.addEventListener("click", function () {
    if (state.quests.main_capcha_test.accepted) {
      closeDialog();
      return;
    }

    dialogIndex += 1;
    if (dialogIndex < introLines.length) {
      dialogText.textContent = introLines[dialogIndex];
    } else {
      showAcceptChoices();
    }
  });

  dialogOverlay.addEventListener("click", function (event) {
    if (event.target === dialogOverlay) closeDialog();
  });

  questButton.addEventListener("click", function () {
    if (!state.quests.main_capcha_test.accepted) return;
    questOverlay.classList.remove("hidden");
  });

  closeQuestButton.addEventListener("click", function () {
    questOverlay.classList.add("hidden");
  });

  questOverlay.addEventListener("click", function (event) {
    if (event.target === questOverlay) questOverlay.classList.add("hidden");
  });

  saveButton.addEventListener("click", function () {
    if (saveToBrowser()) {
      statusEl.textContent = "현재 진행 상태를 저장했습니다.";
    } else {
      downloadSaveFile();
      statusEl.textContent = "브라우저 저장이 차단되어 저장 파일을 내려받았습니다.";
    }
  });

  loadButton.addEventListener("click", function () {
    if (loadFromBrowser()) {
      render();
      statusEl.textContent = "브라우저 저장을 불러왔습니다.";
    } else {
      fileInput.value = "";
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var loaded = JSON.parse(String(reader.result));
        if (!loaded || !loaded.world) throw new Error("올바른 저장 파일이 아닙니다.");
        state = migrate(clone(loaded));
        render();
        statusEl.textContent = "저장 파일을 불러왔습니다.";
      } catch (error) {
        console.error(error);
        statusEl.textContent = "저장 파일을 읽지 못했습니다.";
      }
    };
    reader.onerror = function () {
      statusEl.textContent = "저장 파일을 읽지 못했습니다.";
    };
    reader.readAsText(file, "utf-8");
  });

  resetButton.addEventListener("click", function () {
    var ok = window.confirm("테스트 데이터를 초기화할까요?");
    if (!ok) return;

    state = defaultState();
    if (storageAvailable()) localStorage.removeItem(SAVE_KEY);
    render();
    statusEl.textContent = "테스트 데이터를 초기화했습니다.";
  });

  if (loadFromBrowser()) {
    statusEl.textContent = "저장된 진행 상태를 불러왔습니다.";
  }
  render();
})();
