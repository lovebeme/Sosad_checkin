const got = require("got");

const tokens = require("./helper/token");
const botToken = tokens.botToken;
// 若原本的 chatID 尾端帶有 "&",這裡一併去掉
const chatID = String(tokens.chatID).replace(/&.*$/, "");
const sosad_cookie = tokens.sosad_cookie;

const sosad = got.extend({
  prefixUrl: "https://sosad.fun/",
  headers: {
    Cookie: sosad_cookie,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
  },
});

async function teleMsg(msg) {
  try {
    await got("https://api.telegram.org/bot" + botToken + "/sendMessage", {
      searchParams: { chat_id: chatID, text: msg },
    });
  } catch (error) {
    console.log("Telegram 通知失敗:");
    console.log(error.response ? error.response.body : error.message);
  }
}

(async () => {
  console.log("Starting...");
  const now = new Date().toLocaleString("zh-CN", {
    timeZone: "Australia/Sydney",
    timeZoneName: "long",
  });

  try {
    const response = await sosad("qiandao");

    const finalUrl = String(response.url || "");
    const redirected = (response.redirectUrls || []).map(String).join(", ");
    const info = `
The status code: ${response.statusCode}.
The requested URL: ${response.requestUrl}.
The final URL: ${finalUrl}.
The redirected URL: ${redirected}.
`;

    // 被導向登入頁 = Cookie 失效,沒有真的簽到
    if (/login/i.test(finalUrl) || /login/i.test(redirected)) {
      const msg = `❌ 廢文網簽到失敗:Cookie 已失效,請重新取得 Cookie 並更新 Secrets。\n${now}\n${info}`;
      console.log(msg);
      await teleMsg(msg);
      process.exitCode = 1;
      return;
    }

    const msg = `✅ 廢文網簽到完成 ${now}\n${info}`;
    console.log(msg);
    await teleMsg(msg);
  } catch (error) {
    const msg = `❌ 廢文網簽到出錯 ${now}\n${error.message}`;
    console.log(msg);
    await teleMsg(msg);
    process.exitCode = 1;
  }
})();
