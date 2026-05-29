/**
 * app.js — 台北兒童福利中心資訊看板
 * 純 Vanilla JS，無任何框架依賴
 * 離線環境適用
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  //  縮放邏輯：讓設計稿 (1080×1920) 等比縮放以填滿螢幕
  //  同時支援 1080p 橫置 (1920×1080) 與 4K (3840×2160)
  // ══════════════════════════════════════════════════════════════
  var DESIGN_W = 1080;
  var DESIGN_H = 1920;

  function scaleApp() {
    var root = document.getElementById('app-root');
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // 計算讓設計稿完整顯示所需的縮放比
    var scaleX = vw / DESIGN_W;
    var scaleY = vh / DESIGN_H;
    var scale  = Math.min(scaleX, scaleY);

    // 置中
    var offsetX = Math.max(0, (vw - DESIGN_W * scale) / 2);
    var offsetY = Math.max(0, (vh - DESIGN_H * scale) / 2);

    root.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
    document.body.style.background = '#1a2a30'; // 黑邊背景
  }

  window.addEventListener('resize', scaleApp);
  scaleApp(); // 初始執行一次

  // ══════════════════════════════════════════════════════════════
  //  時鐘：每秒更新
  // ══════════════════════════════════════════════════════════════
  function updateClock() {
    var t = window.getMockTime();
    var el = {
      ampm:    document.getElementById('clock-ampm'),
      time:    document.getElementById('clock-time'),
      weekday: document.getElementById('clock-weekday'),
      date:    document.getElementById('clock-date'),
    };
    if (el.ampm)    el.ampm.textContent    = t.ampm;
    if (el.time)    el.time.textContent    = t.time;
    if (el.weekday) el.weekday.textContent = t.weekday;
    if (el.date)    el.date.textContent    = t.date;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ══════════════════════════════════════════════════════════════
  //  天氣
  // ══════════════════════════════════════════════════════════════
  function renderWeather() {
    var data = window.MOCK_DATA.weather;
    var condEl = document.getElementById('weather-condition');
    var tempEl = document.getElementById('weather-temp');
    if (condEl) condEl.textContent = data.condition;
    if (tempEl) tempEl.textContent = data.temperature + '˚C';
  }

  renderWeather();

  // ══════════════════════════════════════════════════════════════
  //  環境監測
  // ══════════════════════════════════════════════════════════════
  function renderEnvironment() {
    var container = document.querySelector('.env-content');
    if (!container) return;

    var rows = window.MOCK_DATA.environment;
    var html = '';

    rows.forEach(function (row) {
      html += '<div class="env-row">';
      html += '  <span class="env-floor">' + row.floor + '</span>';
      html += '  <div class="env-item">';
      html += '    <span class="env-label">溫度</span>';
      html += '    <span class="env-sep">|</span>';
      html += '    <span class="env-value">' + row.temperature + '˚C</span>';
      html += '  </div>';
      html += '  <div class="env-item">';
      html += '    <span class="env-label">濕度</span>';
      html += '    <span class="env-sep">|</span>';
      html += '    <span class="env-value">' + row.humidity + '%</span>';
      html += '  </div>';
      html += '  <div class="env-item">';
      html += '    <span class="env-label">CO2</span>';
      html += '    <span class="env-sep">|</span>';
      html += '    <span class="env-value">' + row.co2 + 'ppm</span>';
      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  renderEnvironment();

  // ══════════════════════════════════════════════════════════════
  //  公告 (由下往上輪播，每筆停留 3 秒)
  // ══════════════════════════════════════════════════════════════
  function renderAnnouncements() {
    var container = document.querySelector('.notice-content');
    if (!container) return;

    var items = window.MOCK_DATA.announcements;
    var texts = items.map(function (a) { return a.text; });
    // 末尾補第一筆讓捲回時無縫
    var allTexts = texts.concat([texts[0]]);

    var itemsHtml = allTexts.map(function (t) {
      return '<div class="notice-item">' + t + '</div>';
    }).join('');

    container.innerHTML =
      '<div class="notice-ticker-wrap" id="notice-ticker-wrap">' +
        '<div class="notice-ticker" id="notice-ticker">' + itemsHtml + '</div>' +
      '</div>';
  }

  renderAnnouncements();

  // ══════════════════════════════════════════════════════════════
  //  交通資訊 (由下往上輪播，每次顯示 2 筆，停留 3 秒)
  // ══════════════════════════════════════════════════════════════

  // 版本號：每次更新資料時遞增，讓舊的動畫回呼自動停止
  var _transitVer = 0;

  // busRoutes   : [{ routeNo, destination, status, statusClass }]  (null = 保留現有)
  // ubikeStations: [{ name, available }]
  function renderTransit(busRoutes, ubikeStations) {
    var busRoller   = document.getElementById('bus-roller');
    var ubikeRoller = document.getElementById('ubike-roller');
    if (!busRoller || !ubikeRoller) return;

    // 若未傳入則使用 mock 資料
    if (!busRoutes)    busRoutes    = window.MOCK_DATA.bus.routes;
    if (!ubikeStations) ubikeStations = window.MOCK_DATA.ubike.stations;

    var perPage = 2;

    // 公車：末尾補頭 perPage 筆，捲回時無縫
    var busAll = busRoutes.concat(busRoutes.slice(0, perPage));
    busRoller.innerHTML = busAll.map(function (r) {
      var destHtml = r.destination
        ? '<span class="bus-dest">往 ' + r.destination + '</span>'
        : '<span class="bus-dest"></span>';
      return '<div class="transit-bus-row">' +
        '<span class="bus-route-no">'                          + r.routeNo    + '</span>' +
        destHtml +
        '<span class="bus-status ' + (r.statusClass || '') + '">' + r.status + '</span>' +
      '</div>';
    }).join('');

    // YouBike：同上
    var ubikeAll = ubikeStations.concat(ubikeStations.slice(0, perPage));
    ubikeRoller.innerHTML = ubikeAll.map(function (s) {
      return '<div class="ubike-row">' +
        '<span class="ubike-station">' + s.name      + '</span>' +
        '<span class="ubike-count">'   + s.available + '</span>' +
      '</div>';
    }).join('');
  }

  // 供 tdx.js 呼叫：更新資料並重啟動畫
  window.updateTransitDisplay = function (busRoutes, ubikeStations) {
    renderTransit(busRoutes, ubikeStations);
    _transitVer++;
    // 等新 DOM 排版完成後重新量測高度
    setTimeout(function () { initTransitScrollers(_transitVer); }, 100);
  };

  renderTransit();

  // ══════════════════════════════════════════════════════════════
  //  園區導覽
  // ══════════════════════════════════════════════════════════════
  var currentFloor = 0; // 預設 1F

  function renderGuide(floorIndex) {
    var tabsEl = document.getElementById('floor-tabs');
    if (!tabsEl) return;

    var floors = window.MOCK_DATA.guide.floors;

    // 樓層按鈕
    var tabsHtml = '';
    floors.forEach(function (f, i) {
      tabsHtml +=
        '<button class="floor-btn' + (i === floorIndex ? ' active' : '') +
        '" data-floor-index="' + i + '">' + f.floor + '</button>';
    });
    tabsEl.innerHTML = tabsHtml;

    // 點擊事件
    tabsEl.querySelectorAll('.floor-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-floor-index'), 10);
        if (floors[idx].floor === '1F') {
          window.location.href = 'floor_plan.html';
          return;
        }
        currentFloor = idx;
        renderGuide(idx);
      });
    });
  }

  renderGuide(currentFloor);

  // ══════════════════════════════════════════════════════════════
  //  輪播點動畫（純 CSS 版本，JS 控制 active 切換）
  // ══════════════════════════════════════════════════════════════
  var dots = document.querySelectorAll('.dot');
  var dotIndex = 0;

  function rotateDots() {
    dots.forEach(function (d) { d.classList.remove('active'); });
    dotIndex = (dotIndex + 1) % dots.length;
    dots[dotIndex].classList.add('active');
  }

  setInterval(rotateDots, 3000);

  // ══════════════════════════════════════════════════════════════
  //  輪播初始化（公告 + 交通，由下往上，每次停留 3 秒）
  // ══════════════════════════════════════════════════════════════
  function initScrollers() {

    // ── 公告：一次顯示 1 筆 ──────────────────────────────────
    var noticeTicker = document.getElementById('notice-ticker');
    var noticeWrap   = document.getElementById('notice-ticker-wrap');

    if (noticeTicker && noticeWrap) {
      var noticeItems = noticeTicker.querySelectorAll('.notice-item');
      var noticeTotal = noticeItems.length - 1; // 排除末尾複製的一筆

      if (noticeTotal > 0) {
        var noticeItemH = noticeItems[0].offsetHeight;
        var noticeGap   = 16;
        var noticeSlotH = noticeItemH + noticeGap;
        var noticeIdx   = 0;

        noticeWrap.style.height = noticeItemH + 'px';
        noticeWrap.style.visibility = 'visible';

        function noticeNext() {
          noticeIdx++;
          noticeTicker.style.transition = 'transform 0.4s ease';
          noticeTicker.style.transform  = 'translateY(-' + (noticeIdx * noticeSlotH) + 'px)';

          setTimeout(function () {
            if (noticeIdx >= noticeTotal) {
              noticeTicker.style.transition = 'none';
              noticeTicker.style.transform  = 'translateY(0)';
              noticeIdx = 0;
            }
            setTimeout(noticeNext, 3000);
          }, 400);
        }

        setTimeout(noticeNext, 3000);
      }
    }

  }

  // ── 交通捲動器（可重複呼叫；版本號確保舊回呼自動失效）──────
  function initTransitScrollers(version) {
    var busRoller   = document.getElementById('bus-roller');
    var ubikeRoller = document.getElementById('ubike-roller');
    var busWrap     = document.getElementById('bus-roller-wrap');
    var ubikeWrap   = document.getElementById('ubike-roller-wrap');
    if (!busRoller || !ubikeRoller || !busWrap || !ubikeWrap) return;

    // 重置位移
    busRoller.style.transition   = 'none';
    ubikeRoller.style.transition = 'none';
    busRoller.style.transform    = 'translateY(0)';
    ubikeRoller.style.transform  = 'translateY(0)';

    var perPage  = 2;
    var gap      = 8;

    // ── 公車捲動 ────────────────────────────────────────────
    (function () {
      var rows = busRoller.querySelectorAll('.transit-bus-row');
      if (rows.length < perPage + 1) return;

      var rowH       = rows[0].offsetHeight;
      var slotH      = rowH + gap;
      var pageH      = perPage * slotH;
      var dataRows   = rows.length - perPage; // 去掉末尾複製的 perPage 筆
      var totalPages = Math.ceil(dataRows / perPage);

      busWrap.style.height     = (perPage * rowH + (perPage - 1) * gap) + 'px';
      busWrap.style.visibility = 'visible';

      var pageIdx = 0;
      function next() {
        if (_transitVer !== version) return;
        pageIdx++;
        busRoller.style.transition = 'transform 0.4s ease';
        busRoller.style.transform  = 'translateY(-' + (pageIdx * pageH) + 'px)';
        setTimeout(function () {
          if (_transitVer !== version) return;
          if (pageIdx >= totalPages) {
            busRoller.style.transition = 'none';
            busRoller.style.transform  = 'translateY(0)';
            pageIdx = 0;
          }
          setTimeout(next, 3000);
        }, 400);
      }
      setTimeout(next, 3000);
    }());

    // ── YouBike 捲動 ─────────────────────────────────────────
    (function () {
      var rows = ubikeRoller.querySelectorAll('.ubike-row');
      if (rows.length < perPage + 1) {
        // 資料不足兩頁時，僅顯示不捲動
        if (rows.length >= 1) {
          var rowH = rows[0].offsetHeight;
          ubikeWrap.style.height     = (perPage * rowH + (perPage - 1) * gap) + 'px';
          ubikeWrap.style.visibility = 'visible';
        }
        return;
      }

      var rowH       = rows[0].offsetHeight;
      var slotH      = rowH + gap;
      var pageH      = perPage * slotH;
      var dataRows   = rows.length - perPage;
      var totalPages = Math.ceil(dataRows / perPage);

      ubikeWrap.style.height     = (perPage * rowH + (perPage - 1) * gap) + 'px';
      ubikeWrap.style.visibility = 'visible';

      var pageIdx = 0;
      function next() {
        if (_transitVer !== version) return;
        pageIdx++;
        ubikeRoller.style.transition = 'transform 0.4s ease';
        ubikeRoller.style.transform  = 'translateY(-' + (pageIdx * pageH) + 'px)';
        setTimeout(function () {
          if (_transitVer !== version) return;
          if (pageIdx >= totalPages) {
            ubikeRoller.style.transition = 'none';
            ubikeRoller.style.transform  = 'translateY(0)';
            pageIdx = 0;
          }
          setTimeout(next, 3000);
        }, 400);
      }
      setTimeout(next, 3000);
    }());
  }

  // 等字體與排版完成後才讀取高度
  setTimeout(function () {
    initScrollers();
    _transitVer++;
    initTransitScrollers(_transitVer);
  }, 1000);

})();
