(function () {
  "use strict";

  var SAVE_KEY = "bugcapture_save_v1";
  var state = {
    version: 1,
    player: { name: "Capcha", status: "신입 Capcha 후보" },
    world: { regionId: "research_lab", x: 0, y: 0 },
    quests: {},
    pokedex: { granted: false, entries: {} },
    ownedBugs: [],
    inventory: {}
  };

  var statusEl = document.getElementById("status");
  var regionEl = document.getElementById("regionName");
  var positionEl = document.getElementById("positionText");
  var moveBtn = document.getElementById("testMoveButton");
  var saveBtn = document.getElementById("saveButton");
  var loadBtn = document.getElementById("loadButton");
  var fileInput = document.getElementById("fileInput");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function render() {
    var labels = {
      research_lab: "호박사 연구소",
      first_field: "시작마을 인근 들판"
    };
    regionEl.textContent = labels[state.world.regionId] || state.world.regionId;
    positionEl.textContent = state.world.x + ", " + state.world.y;
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function storageAvailable() {
    try {
      var testKey = "__bugcapture_storage_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveToBrowser() {
    if (!storageAvailable()) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error(e);
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
      state = JSON.parse(raw);
      render();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  moveBtn.addEventListener("click", function () {
    state.world.x += 1;
    render();
    setStatus("테스트 좌표가 1칸 이동했습니다.");
  });

  saveBtn.addEventListener("click", function () {
    if (saveToBrowser()) {
      setStatus("브라우저에 저장되었습니다.");
    } else {
      downloadSaveFile();
      setStatus("브라우저 저장이 차단되어 저장 파일을 내려받았습니다.");
    }
  });

  loadBtn.addEventListener("click", function () {
    if (loadFromBrowser()) {
      setStatus("브라우저 저장을 불러왔습니다.");
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
        if (!loaded || !loaded.world) {
          throw new Error("올바른 저장 파일이 아닙니다.");
        }
        state = clone(loaded);
        render();
        setStatus("저장 파일을 불러왔습니다.");
      } catch (e) {
        console.error(e);
        setStatus("저장 파일을 읽지 못했습니다.");
      }
    };
    reader.onerror = function () {
      setStatus("저장 파일을 읽지 못했습니다.");
    };
    reader.readAsText(file, "utf-8");
  });

  if (loadFromBrowser()) {
    setStatus("저장된 진행 상태를 자동으로 불러왔습니다.");
  } else {
    setStatus("새 진행 상태로 시작했습니다.");
  }
  render();
})();
