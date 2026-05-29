/**
 * tdx.js — TDX 即時交通資料（公車到站 + YouBike 可借車數）
 * 依賴：app.js 暴露的 window.updateTransitDisplay(busRoutes, ubikeStations)
 */

(function () {
  'use strict';

  // ── 憑證（請將下方兩行換成您的 TDX Client ID / Secret） ──────
  // var CLIENT_ID     = 'PLACEHOLDER_CLIENT_ID';
  // var CLIENT_SECRET = 'PLACEHOLDER_CLIENT_SECRET';

  var CLIENT_ID = 'service-99bf4047-07a1-45bc';
  var CLIENT_SECRET = '0ab27e10-2f7d-47f7-a471-71c24cce7474';

  var TOKEN_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
  var API_BASE = 'https://tdx.transportdata.tw/api/basic/v2';

  // ── 查詢目標 ──────────────────────────────────────────────────
  // 數位看板所在的公車站牌（會涵蓋此站名的所有方向）
  var BUS_STOP = '國稅局宿舍';
  var UBIKE_STATIONS = ['信義松德路口', '松德路200巷'];

  // ── Token 快取 ────────────────────────────────────────────────
  var _token = null;
  var _tokenExpiry = 0;

  function getToken() {
    var now = Date.now();
    if (_token && now < _tokenExpiry) {
      return Promise.resolve(_token);
    }

    var body = 'grant_type=client_credentials' +
      '&client_id=' + encodeURIComponent(CLIENT_ID) +
      '&client_secret=' + encodeURIComponent(CLIENT_SECRET);

    return fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Token 取得失敗: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        _token = data.access_token;
        _tokenExpiry = now + (data.expires_in - 60) * 1000; // 提前 60 秒重取
        return _token;
      });
  }

  // ── 公車到站 ──────────────────────────────────────────────────
  // 步驟一：查出「國稅局宿舍」站牌所有經過路線的到站預估（含各方向）
  // 步驟二：依到站秒數換算「還要多久」
  // 步驟三：查出每條路線的起訖站，依方向算出該班車「往哪裡」
  function fetchBus() {
    return fetchEta().then(function (etaRecords) {
      // 蒐集此站出現的所有路線名稱，用來查詢目的地
      var routeNames = {};
      etaRecords.forEach(function (r) {
        var name = r.RouteName && r.RouteName.Zh_tw ? r.RouteName.Zh_tw : '';
        if (name) routeNames[name] = true;
      });

      return fetchRouteDestinations(Object.keys(routeNames))
        .then(function (destMap) {
          return parseBus(etaRecords, destMap);
        });
    });
  }

  // 步驟一：到站預估
  function fetchEta() {
    var filter = "StopName/Zh_tw eq '" + BUS_STOP + "'";

    // var url = API_BASE + '/Bus/EstimatedTimeOfArrival/City/Taipei' +
    //   '?$filter=' + encodeURIComponent(filter) +
    //   '&$select=RouteName,StopName,EstimatedArrivalTime,StopStatus,Direction' +
    //   '&$format=JSON';

    var url = API_BASE + '/Bus/EstimatedTimeOfArrival/City/Taipei' +
      '?$filter=' + encodeURIComponent(filter);

    console.log('fetchEta url', url);

    return getToken().then(function (token) {
      return fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    })
      .then(function (res) {
        if (!res.ok) throw new Error('公車到站 API 失敗: ' + res.status);
        console.log(res.json());

        return res.json();
      });
  }

  // 步驟三：依路線名稱查詢起訖站，建立 routeName -> { dep, dest } 對照表
  function fetchRouteDestinations(routeNames) {
    if (!routeNames.length) return Promise.resolve({});

    var filter = routeNames.map(function (n) {
      return "RouteName/Zh_tw eq '" + n + "'";
    }).join(' or ');

    // var url = API_BASE + '/Bus/Route/City/Taipei' +
    //   '?$filter=' + encodeURIComponent(filter) +
    //   '&$select=RouteName,DepartureStopNameZh,DestinationStopNameZh' +
    //   '&$format=JSON';

    var url = API_BASE + '/Bus/Route/City/Taipei' +
      '?$filter=' + encodeURIComponent(filter);

    return getToken().then(function (token) {
      return fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    })
      .then(function (res) {
        if (!res.ok) throw new Error('公車路線 API 失敗: ' + res.status);
        return res.json();
      })
      .then(function (records) {
        var map = {};
        records.forEach(function (r) {
          var name = r.RouteName && r.RouteName.Zh_tw ? r.RouteName.Zh_tw : '';
          if (!name || map[name]) return;
          map[name] = {
            dep: r.DepartureStopNameZh || '',   // 起點（去程的出發地）
            dest: r.DestinationStopNameZh || ''  // 終點（去程的目的地）
          };
        });
        return map;
      })
      .catch(function (err) {
        // 目的地查詢失敗不致命，仍可只顯示路線與到站時間
        console.warn('[TDX] 路線目的地查詢失敗。', err.message);
        return {};
      });
  }

  // 步驟二 + 整合：產生看板用的公車清單
  function parseBus(records, destMap) {
    var seen = {};
    var result = [];

    // 先按 EstimatedArrivalTime 排序（小到大），最快到的排前面
    records.sort(function (a, b) {
      var ta = (a.EstimatedArrivalTime == null ? 99999 : a.EstimatedArrivalTime);
      var tb = (b.EstimatedArrivalTime == null ? 99999 : b.EstimatedArrivalTime);
      return ta - tb;
    });

    records.forEach(function (r) {
      // StopStatus: 0=正常, 其他=不停靠/末班已過/尚未發車
      if (r.StopStatus !== 0) return;

      var routeName = r.RouteName && r.RouteName.Zh_tw ? r.RouteName.Zh_tw : '';
      if (!routeName) return;

      var direction = r.Direction; // 0=去程, 1=返程

      // 同路線同方向去重（保留兩個方向，分別顯示各自目的地）
      var key = routeName + '|' + direction;
      if (seen[key]) return;
      seen[key] = true;

      var eta = r.EstimatedArrivalTime; // 單位：秒
      if (eta == null || eta < 0) return;

      var status, statusClass;
      if (eta < 60) {
        status = '即將進站';
        statusClass = 'arriving';
      } else {
        status = Math.round(eta / 60) + '分鐘後進站';
        statusClass = eta < 360 ? 'soon' : '';
      }

      // 依方向決定目的地：去程(0)往終點、返程(1)往起點
      var ends = destMap[routeName];
      var destination = '';
      if (ends) {
        destination = (direction === 1) ? ends.dep : ends.dest;
      }

      result.push({
        routeNo: routeName + '號',
        destination: destination,
        status: status,
        statusClass: statusClass
      });
    });

    console.log('result', result);
    return result;
  }

  // ── YouBike ───────────────────────────────────────────────────
  // Availability 端點沒有 StationName 欄位，需先用 Station 端點查站名 -> StationUID，
  // 再用 StationUID 去 filter Availability。
  function fetchUbike() {
    var nameFilter = UBIKE_STATIONS.map(function (s) {
      return "StationName/Zh_tw eq '" + s + "'";
    }).join(' or ');

    // 步驟一：用站名查 Station（這個端點才有 StationName / StationUID）
    var stationUrl = API_BASE + '/Bike/Station/City/Taipei' +
      '?$filter=' + encodeURIComponent(nameFilter);

    return getToken().then(function (token) {
      var auth = { headers: { 'Authorization': 'Bearer ' + token } };

      return fetch(stationUrl, auth)
        .then(function (res) {
          if (!res.ok) throw new Error('YouBike 站點 API 失敗: ' + res.status);
          return res.json();
        })
        .then(function (stations) {
          // 建立 StationUID -> 站名 對照
          var uidToName = {};
          stations.forEach(function (st) {
            var name = st.StationName && st.StationName.Zh_tw ? st.StationName.Zh_tw : '';
            if (name) uidToName[st.StationUID] = name;
          });

          var uids = Object.keys(uidToName);
          if (!uids.length) {
            return UBIKE_STATIONS.map(function (name) {
              return { name: name, available: '--台' };
            });
          }

          // 步驟二：用 StationUID 查 Availability（這個端點只有 UID，沒有站名）
          var availFilter = uids.map(function (u) {
            return "StationUID eq '" + u + "'";
          }).join(' or ');

          var availUrl = API_BASE + '/Bike/Availability/City/Taipei' +
            '?$filter=' + encodeURIComponent(availFilter);

          return fetch(availUrl, auth)
            .then(function (res) {
              if (!res.ok) throw new Error('YouBike 可借 API 失敗: ' + res.status);
              return res.json();
            })
            .then(function (data) {
              var map = {};
              data.forEach(function (s) {
                var name = uidToName[s.StationUID];
                if (name) map[name] = s.AvailableRentBikes || 0;
              });

              // 依照 UBIKE_STATIONS 順序排列
              return UBIKE_STATIONS.map(function (name) {
                return {
                  name: name,
                  available: (map[name] !== undefined ? map[name] : '--') + '台'
                };
              });
            });
        });
    });
  }

  // ── 更新顯示 ──────────────────────────────────────────────────
  function refresh() {
    Promise.all([fetchBus(), fetchUbike()])
      .then(function (results) {
        var busRoutes = results[0];
        var ubikeStations = results[1];

        if (busRoutes.length === 0) {
          console.warn('[TDX] 公車查無資料，保留現有顯示');
          busRoutes = null;
        }

        if (typeof window.updateTransitDisplay === 'function') {
          window.updateTransitDisplay(busRoutes, ubikeStations);
        }
      })
      .catch(function (err) {
        console.warn('[TDX] 更新失敗，保留現有資料。', err.message);
      });
  }

  // ── 啟動 ─────────────────────────────────────────────────────
  // 等 app.js 初始化完成（initScrollers 在 1000ms 後執行）後再首次拉取
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(refresh, 1500);          // 首次拉取
    setInterval(refresh, 30 * 1000);    // 之後每 30 秒更新
  });

})();
