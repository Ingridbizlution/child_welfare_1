/**
 * mock.js - 離線假資料 (用於無網路環境的 Box-PC 播放器)
 * 此檔案模擬後端 API 回傳的所有資料
 */

window.MOCK_DATA = {

  // ── 時間與天氣 ──────────────────────────────────────────────
  weather: {
    condition: "晴時多雲",
    temperature: "25",
    icon: "day-cloudy" // 對應 assets/day-cloudy.svg
  },

  // ── 環境監測 (各樓層) ────────────────────────────────────────
  environment: [
    { floor: "1F", temperature: "25", humidity: "40", co2: "400" },
    { floor: "2F", temperature: "28", humidity: "77", co2: "1000" },
    { floor: "3F", temperature: "26", humidity: "65", co2: "800" }
  ],

  // ── 公告列表 ─────────────────────────────────────────────────
  announcements: [
    {
      id: 1,
      date: "3月20日（星期五）",
      text: "本系統將於 3月20日（星期五）22:00 至 23:30 進行例行維護，請提前完成相關作業。"
    },
    {
      id: 2,
      date: "4月10日",
      text: "本中心將於 4月10日 舉辦「親子互動體驗活動」，歡迎親子共同參與！"
    },
    {
      id: 3,
      date: "4月15日",
      text: "因應節能減碳政策，本棟大樓電梯自 4月15日起調整為省電模式運行。"
    }
  ],

  // ── 交通資訊 ─────────────────────────────────────────────────
  bus: {
    routes: [
      { routeNo: "46號",  status: "即將進站",    statusClass: "arriving" },
      { routeNo: "20號",  status: "2分鐘後進站", statusClass: "soon"     },
      { routeNo: "311號", status: "進站中",       statusClass: "arriving" },
      { routeNo: "72號",  status: "5分鐘後進站", statusClass: "soon"     },
      { routeNo: "299號", status: "4分鐘後進站", statusClass: "soon"     },
      { routeNo: "0南號", status: "即將進站",    statusClass: "arriving" }
    ]
  },

  ubike: {
    stations: [
      { name: "松德路200巷",  available: "3台"  },
      { name: "信義松德路口", available: "12台" },
      { name: "信義光復路口", available: "7台"  },
      { name: "吳興國小",     available: "5台"  },
      { name: "國父紀念館站", available: "18台" },
      { name: "市府轉運站",   available: "9台"  }
    ]
  },

  // ── 園區導覽 (樓層地圖資訊) ──────────────────────────────────
  guide: {
    floors: [
      {
        floor: "1F",
        areas: [
          { name: "大廳接待", icon: "🏛" },
          { name: "兒童遊戲區", icon: "🧸" },
          { name: "哺乳室", icon: "🍼" },
          { name: "無障礙廁所", icon: "♿" }
        ]
      },
      {
        floor: "2F",
        areas: [
          { name: "親子閱讀區", icon: "📚" },
          { name: "多功能教室A", icon: "🏫" },
          { name: "多功能教室B", icon: "🏫" },
          { name: "行政辦公室", icon: "💼" }
        ]
      },
      {
        floor: "3F",
        areas: [
          { name: "室內活動場", icon: "🎪" },
          { name: "視聽教室", icon: "🎬" },
          { name: "會議室", icon: "📋" },
          { name: "屋頂花園", icon: "🌿" }
        ]
      }
    ]
  }
};

// ── 輔助函式：模擬動態時鐘 ────────────────────────────────────
window.getMockTime = function() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "下午" : "上午";
  const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const weekday = weekdays[now.getDay()];
  const month = now.getMonth() + 1;
  const date = now.getDate();
  return {
    ampm,
    time: `${displayHour}:${minutes}`,
    weekday,
    date: `${month}/${date}`
  };
};
