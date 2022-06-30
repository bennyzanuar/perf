import fetch from "node-fetch";
import "dotenv/config";

import fs from "fs";
import path from "path";
import appRootDir from "app-root-dir";

const d = new Date();

const date = new Date().toLocaleDateString("id-ID", {
  timeZone: "Asia/Jakarta",
});
const dateTime = new Date().toLocaleTimeString("id-ID", {
  timeZone: "Asia/Jakarta",
});

const dformat = `${date}T${dateTime}`;

export const REPORT_DIR = path.join(path.resolve(appRootDir.get()), `/reports`);
export const REPORT_JSON_FILE = path.join(REPORT_DIR, `/${dformat}.json`);
export const REPORT_TS_FILE = path.join(REPORT_DIR, `/${dformat}.ts`);

export const writeFile = (filename, content) => {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filename, content, "utf-8", function (err) {
      if (err) reject(err);
      else resolve(content);
    });
  });
};

export const writeNewReport = (content) => {
  writeFile(REPORT_JSON_FILE, JSON.stringify(content));
  writeFile(REPORT_TS_FILE, `export default ${JSON.stringify(content)}`);
};

const run = async (name, url, device) => {
  const URL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&key=${process.env.PSI_API_KEY}&strategy=${device}`;

  console.log("PSI_API_KEY ", process.env.PSI_API_KEY);
  try {
    const resp = await fetch(URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const result = await resp.json();

    if (result) {
      const loadingExperience = result?.loadingExperience || {};
      const lighthouseResult = result?.lighthouseResult || {};
      const categories = lighthouseResult?.categories || {};
      const audits = lighthouseResult?.audits || {};

      const totalResources =
        audits["resource-summary"]?.details?.items?.[0] || {};

      const fieldData = loadingExperience.metrics || {};

      const fid = fieldData["FIRST_INPUT_DELAY_MS"]?.percentile || 0;
      const fmp = audits["first-meaningful-paint"]?.numericValue || 0;
      const fcp = audits["first-contentful-paint"]?.numericValue || 0;
      const lcp = audits["largest-contentful-paint"]?.numericValue || 0;
      const cls = audits["cumulative-layout-shift"]?.numericValue || 0;
      const fci = audits["first-cpu-idle"]?.numericValue || 0;
      const tbt = audits["total-blocking-time"]?.numericValue || 0;
      const tti = audits["interactive"]?.numericValue || 0;
      const si = audits["speed-index"]?.numericValue || 0;

      const perf = categories?.performance?.score || 0;
      const req = totalResources.requestCount || 0;
      const size = totalResources.size || totalResources.transferSize || 0;

      const response = {
        perf,
        fid,
        lcp,
        cls,
        fmp,
        fcp,
        fci,
        tbt,
        tti,
        si,
        size,
        req,
        name,
        device,
      };

      console.log("response", response);
      writeNewReport(response);

      return response;
    }
  } catch (e) {
    console.error("> Error job", e);
  }

  return null;
};

run("kitalulus", "https://kerja.kitalulus.com", "mobile");
