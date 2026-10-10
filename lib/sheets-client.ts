// Sends one row from the browser to a Google Apps Script web app. Apps Script
// does not return CORS headers, so the request is fire-and-forget ("no-cors"):
// the browser cannot read whether Google accepted it.
export async function sendToSheet(url: string, row: object) {
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify(row),
    });
    return true;
  } catch {
    return false;
  }
}
