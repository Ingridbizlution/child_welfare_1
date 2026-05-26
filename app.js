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
  function renderTransit() {
    var container = document.querySelector('.transit-content');
    if (!container) return;

    var busData   = window.MOCK_DATA.bus;
    var ubikeData = window.MOCK_DATA.ubike;

    // 公車：6 筆 + 頭 2 筆複製，讓最後捲回無縫
    var busRoutes = busData.routes;
    var busAll    = busRoutes.concat(busRoutes.slice(0, 2));
    var busRowsHtml = busAll.map(function (r) {
      return '<div class="transit-bus-row">' +
        '<span class="bus-route-no">' + r.routeNo + '</span>' +
        '<span class="bus-status ' + r.statusClass + '">' + r.status + '</span>' +
      '</div>';
    }).join('');

    var busHtml =
      '<div class="transit-bus-col">' +
        '<div class="transit-roller-wrap" id="bus-roller-wrap">' +
          '<div id="bus-roller">' + busRowsHtml + '</div>' +
        '</div>' +
      '</div>';

    // Ubike：6 筆 + 頭 2 筆複製
    var stations  = ubikeData.stations;
    var ubikeAll  = stations.concat(stations.slice(0, 2));
    var ubikeRowsHtml = ubikeAll.map(function (s) {
      return '<div class="ubike-row">' +
        '<span class="ubike-station">' + s.name + '</span>' +
        '<span class="ubike-count">' + s.available + '</span>' +
      '</div>';
    }).join('');

    var ubikeHtml =
      '<div class="transit-ubike-col">' +
        '<div class="ubike-header">' +
          '<span class="ubike-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="94" height="74" viewBox="0 0 94 74" fill="none">' +
              '<path d="M35.25 13.875C33.3802 13.875 31.587 13.1441 30.2649 11.8431C28.9428 10.542 28.2 8.77744 28.2 6.9375C28.2 5.09756 28.9428 3.33298 30.2649 2.03195C31.587 0.730913 33.3802 0 35.25 0C37.1198 0 38.913 0.730913 40.2351 2.03195C41.5572 3.33298 42.3 5.09756 42.3 6.9375C42.3 8.77744 41.5572 10.542 40.2351 11.8431C38.913 13.1441 37.1198 13.875 35.25 13.875ZM31.255 23.125L40.3319 16.0719C42.8728 14.1062 46.4566 14.0773 49.0122 16.0285L61.2175 25.3074C65.7266 28.7473 65.4034 35.5402 60.5859 38.5465L51.7 44.0965V60.125C51.7 62.6832 49.5997 64.75 47 64.75C44.4003 64.75 42.3 62.6832 42.3 60.125V41.625C42.3 40.0785 43.0784 38.6332 44.3856 37.7805L50.6719 33.6613L41.8153 26.6516L35.8375 31.3633C35.0003 32.0137 33.9722 32.375 32.9 32.375H23.5C20.9003 32.375 18.8 30.3082 18.8 27.75C18.8 25.1918 20.9003 23.125 23.5 23.125H31.255ZM85.775 55.5C85.775 52.7401 84.6609 50.0932 82.6777 48.1417C80.6945 46.1901 78.0047 45.0938 75.2 45.0938C72.3953 45.0938 69.7055 46.1901 67.7223 48.1417C65.7392 50.0932 64.625 52.7401 64.625 55.5C64.625 58.2599 65.7392 60.9068 67.7223 62.8583C69.7055 64.8099 72.3953 65.9062 75.2 65.9062C78.0047 65.9062 80.6945 64.8099 82.6777 62.8583C84.6609 60.9068 85.775 58.2599 85.775 55.5ZM56.4 55.5C56.4 50.5935 58.3807 45.8879 61.9064 42.4185C65.4321 38.9491 70.2139 37 75.2 37C80.1861 37 84.9679 38.9491 88.4936 42.4185C92.0193 45.8879 94 50.5935 94 55.5C94 60.4065 92.0193 65.1121 88.4936 68.5815C84.9679 72.0509 80.1861 74 75.2 74C70.2139 74 65.4321 72.0509 61.9064 68.5815C58.3807 65.1121 56.4 60.4065 56.4 55.5ZM29.375 55.5C29.375 52.7401 28.2608 50.0932 26.2776 48.1417C24.2944 46.1901 21.6047 45.0938 18.8 45.0938C15.9953 45.0938 13.3055 46.1901 11.3223 48.1417C9.33915 50.0932 8.225 52.7401 8.225 55.5C8.225 58.2599 9.33915 60.9068 11.3223 62.8583C13.3055 64.8099 15.9953 65.9062 18.8 65.9062C21.6047 65.9062 24.2944 64.8099 26.2776 62.8583C28.2608 60.9068 29.375 58.2599 29.375 55.5ZM0 55.5C0 50.5935 1.98072 45.8879 5.5064 42.4185C9.03208 38.9491 13.8139 37 18.8 37C23.7861 37 28.5679 38.9491 32.0936 42.4185C35.6193 45.8879 37.6 50.5935 37.6 55.5C37.6 60.4065 35.6193 65.1121 32.0936 68.5815C28.5679 72.0509 23.7861 74 18.8 74C13.8139 74 9.03208 72.0509 5.5064 68.5815C1.98072 65.1121 0 60.4065 0 55.5Z" fill="#406C76"/>' +
            '</svg>' +
          '</span>' +
          '<span class="ubike-label">Ubike</span>' +
        '</div>' +
        '<div class="transit-roller-wrap" id="ubike-roller-wrap">' +
          '<div id="ubike-roller">' + ubikeRowsHtml + '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = busHtml + ubikeHtml;
  }

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

    // ── 交通：一次顯示 2 筆 ──────────────────────────────────
    var busRoller   = document.getElementById('bus-roller');
    var ubikeRoller = document.getElementById('ubike-roller');
    var busWrap     = document.getElementById('bus-roller-wrap');
    var ubikeWrap   = document.getElementById('ubike-roller-wrap');

    if (busRoller && ubikeRoller && busWrap && ubikeWrap) {
      var busRows   = busRoller.querySelectorAll('.transit-bus-row');
      var ubikeRows = ubikeRoller.querySelectorAll('.ubike-row');

      if (busRows.length >= 2 && ubikeRows.length >= 2) {
        var perPage = 2;
        var gap     = 8;

        var busRowH    = busRows[0].offsetHeight;
        var ubikeRowH  = ubikeRows[0].offsetHeight;
        var busSlotH   = busRowH   + gap;
        var ubikeSlotH = ubikeRowH + gap;
        var busPageH   = perPage * busSlotH;
        var ubikePageH = perPage * ubikeSlotH;

        // 夾住視窗高度 = 2 列高 + 1 個間距
        busWrap.style.height   = (perPage * busRowH   + (perPage - 1) * gap) + 'px';
        ubikeWrap.style.height = (perPage * ubikeRowH + (perPage - 1) * gap) + 'px';
        busWrap.style.visibility   = 'visible';
        ubikeWrap.style.visibility = 'visible';

        var totalGroups = window.MOCK_DATA.bus.routes.length / perPage; // 6 / 2 = 3
        var groupIdx    = 0;

        function transitNext() {
          groupIdx++;
          busRoller.style.transition   = 'transform 0.4s ease';
          ubikeRoller.style.transition = 'transform 0.4s ease';
          busRoller.style.transform    = 'translateY(-' + (groupIdx * busPageH)   + 'px)';
          ubikeRoller.style.transform  = 'translateY(-' + (groupIdx * ubikePageH) + 'px)';

          setTimeout(function () {
            if (groupIdx >= totalGroups) {
              busRoller.style.transition   = 'none';
              ubikeRoller.style.transition = 'none';
              busRoller.style.transform    = 'translateY(0)';
              ubikeRoller.style.transform  = 'translateY(0)';
              groupIdx = 0;
            }
            setTimeout(transitNext, 3000);
          }, 400);
        }

        setTimeout(transitNext, 3000);
      }
    }
  }

  // 等字體與排版完成後才讀取高度
  setTimeout(initScrollers, 1000);

})();
