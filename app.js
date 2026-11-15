// Dán API Key của Google Gemini tại đây (Lấy miễn phí tại ://google.com)
const GEMINI_API_KEY = "NHAP_API_KEY_CUA_BAN_TAI_DAY";

// Dữ liệu mẫu ban đầu
let medications = [
  { id: 1, name: "Thuốc điều hòa huyết áp", time: "08:00", taken: false },
  { id: 2, name: "Vitamin tổng hợp & Bổ mắt", time: "12:30", taken: false },
  { id: 3, name: "Thuốc hỗ trợ tim mạch", time: "19:30", taken: false }
];

let activityLogs = [
  "07:30 - Hệ thống đã gửi lời chào buổi sáng tới Cha/Mẹ."
];

// Chuyển đổi qua lại giữa màn hình Cha Mẹ và Con Cái
function switchView(role) {
  document.getElementById("view-elder").classList.toggle("hidden", role !== "elder");
  document.getElementById("view-family").classList.toggle("hidden", role !== "family");
  document.getElementById("btn-elder").classList.toggle("active", role === "elder");
  document.getElementById("btn-family").classList.toggle("active", role === "family");
  renderAll();
}

// Hiển thị danh sách thuốc và nhật ký
function renderAll() {
  const medListEl = document.getElementById("med-list");
  medListEl.innerHTML = "";

  medications.forEach((med) => {
    const item = document.createElement("div");
    item.className = "med-item";
    item.innerHTML = `
      <div class="med-info">
        <strong>${med.name}</strong>
        <span>⏰ Giờ uống: ${med.time}</span>
      </div>
      <button class="btn-check ${med.taken ? "done" : ""}" onclick="toggleMed(${med.id})">
        ${med.taken ? "✅ Đã uống" : "Xác nhận"}
      </button>
    `;
    medListEl.appendChild(item);
  });

  const logEl = document.getElementById("family-log");
  logEl.innerHTML = activityLogs.map((log) => `<li>${log}</li>`).join("");
}

// Xác nhận đã uống thuốc
function toggleMed(id) {
  const med = medications.find((m) => m.id === id);
  if (med) {
    med.taken = !med.taken;
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (med.taken) {
      activityLogs.unshift(`${now} - ✅ Cha/Mẹ đã xác nhận uống: ${med.name}.`);
      speakVietnamese(`Giỏi quá! Bác đã uống ${med.name}. Cháu đã báo tin vui này cho con của bác rồi ạ.`);
    }
    renderAll();
  }
}

// Con cái thêm thuốc mới
function addMedication() {
  const name = document.getElementById("med-name").value.trim();
  const time = document.getElementById("med-time").value;
  if (!name) return alert("Vui lòng nhập tên thuốc!");

  medications.push({ id: Date.now(), name, time, taken: false });
  activityLogs.unshift(`Vừa thêm lịch nhắc mới: ${name} lúc ${time}.`);
  document.getElementById("med-name").value = "";
  alert("Đã đồng bộ lịch thuốc sang máy của Cha/Mẹ!");
  renderAll();
}

// Nút khẩn cấp SOS
function triggerSOS() {
  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const alertMsg = `🚨 KHẨN CẤP (${now}): Cha/Mẹ vừa bấm nút SOS yêu cầu hỗ trợ!`;
  
  activityLogs.unshift(alertMsg);
  const banner = document.getElementById("family-alert");
  banner.textContent = alertMsg;
  banner.classList.remove("hidden");

  speakVietnamese("Đang gửi tín hiệu khẩn cấp và gọi điện cho con của bác. Bác hãy ngồi yên nghỉ ngơi nhé!");
  alert("Đã gửi cảnh báo khẩn cấp kèm tọa độ GPS tới điện thoại người thân!");
}

// Đọc văn bản bằng giọng nói tiếng Việt (Text-to-Speech)
function speakVietnamese(text) {
  document.getElementById("ai-reply").textContent = `"${text}"`;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

// Nhận diện giọng nói tiếng Việt (Speech-to-Text) và gọi AI
function startVoiceAssistant() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome!");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "vi-VN";
  recognition.interimResults = false;

  const statusEl = document.getElementById("ai-status");
  statusEl.textContent = "🎧 Đang lắng nghe bác nói...";

  recognition.onresult = async (event) => {
    const userSpeech = event.results[0][0].transcript;
    statusEl.textContent = `Bác vừa nói: "${userSpeech}"`;
    await processUserSpeech(userSpeech);
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `❌ Cháu chưa nghe rõ (Lỗi: ${event.error}), bác bấm nút và nói lại nhé.`;
  };

  recognition.start();
}

// Xử lý câu nói bằng AI (Nhận diện chỉ số huyết áp hoặc trò chuyện)
async function processUserSpeech(text) {
  const lowerText = text.toLowerCase();

  // Tự động trích xuất chỉ số huyết áp nếu người dùng đọc (VD: "huyết áp 130 trên 80")
  const bpMatch = lowerText.match(/(\d{2,3})\s*(trên|\/)\s*(\d{2,3})/);
  if (bpMatch) {
    const sys = bpMatch[1];
    const dia = bpMatch[3];
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("bp-history").innerHTML =
      `<li>Hôm nay ${now} - <strong>${sys}/${dia} mmHg</strong> (Ghi nhận qua giọng nói)</li>` +
      document.getElementById("bp-history").innerHTML;
    activityLogs.unshift(`${now} - Đã ghi nhận huyết áp: ${sys}/${dia} mmHg.`);
  }

  // Nếu chưa gắn API Key, dùng phản hồi mẫu thông minh để demo
  if (GEMINI_API_KEY === "NHAP_API_KEY_CUA_BAN_TAI_DAY" || !GEMINI_API_KEY) {
    if (bpMatch) {
      speakVietnamese(`Cháu đã ghi lại chỉ số huyết áp ${bpMatch[1]} trên ${bpMatch[3]} và gửi cho con của bác rồi ạ.`);
    } else if (lowerText.includes("uống thuốc")) {
      const nextMed = medications.find((m) => !m.taken);
      if (nextMed) {
        toggleMed(nextMed.id);
      } else {
        speakVietnamese("Hôm nay bác đã uống đủ tất cả các loại thuốc rồi ạ!");
      }
    } else {
      speakVietnamese("Cháu đã nghe rõ ạ. Bác nhớ uống đủ nước và nghỉ ngơi điều độ nhé!");
    }
    return;
  }

  // Gọi Gemini API thật để trò chuyện tự nhiên
  try {
    const response = await fetch(
      `https://googleapis.com{GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Bạn là trợ lý điều dưỡng ảo lễ phép, ấm áp dành cho người cao tuổi Việt Nam. Hãy xưng "cháu" và gọi người dùng là "bác". Trả lời ngắn gọn dưới 3 câu, dễ hiểu cho câu nói sau: "${text}"`
            }]
          }]
        })
      }
    );
    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    speakVietnamese(aiText);
  } catch (error) {
    speakVietnamese("Mạng đang hơi chập chờn, nhưng cháu vẫn luôn ở đây bên bác ạ.");
  }
}

// Khởi chạy giao diện ban đầu
renderAll();


