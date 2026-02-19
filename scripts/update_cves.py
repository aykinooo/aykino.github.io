#!/usr/bin/env python3
"""Generate data/latest-cves.json from the NVD CVE API v2."""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from urllib.request import Request, urlopen

NVD_API   = "https://services.nvd.nist.gov/rest/json/cves/2.0"
OUTPUT_PATH = Path("data/latest-cves.json")
MAX_ITEMS   = 6
WINDOW_DAYS = 7


def _fetch(url: str) -> dict:
    req = Request(
        url,
        headers={
            "User-Agent": "aykino-cve-feed/1.0 (+https://github.com/aykinooo)",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=30) as resp:  # nosec: B310 (trusted public API)
        return json.loads(resp.read().decode("utf-8"))


def _parse_cvss(cve: dict) -> float | None:
    metrics = cve.get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key) or []
        if entries:
            score = entries[0].get("cvssData", {}).get("baseScore")
            if score is not None:
                return float(score)
    return None


def _normalize(item: dict) -> dict | None:
    cve = item.get("cve", {})
    cve_id = str(cve.get("id", "")).strip()
    if not cve_id.startswith("CVE-"):
        return None

    descriptions = cve.get("descriptions", [])
    en = next((d["value"] for d in descriptions if d.get("lang") == "en"), None)
    summary = en or "No summary provided."

    return {
        "id":        cve_id,
        "summary":   summary,
        "published": cve.get("published", ""),
        "cvss":      _parse_cvss(cve),
        "url":       f"https://nvd.nist.gov/vuln/detail/{cve_id}",
    }


def fetch_latest() -> list[dict]:
    now       = dt.datetime.now(dt.timezone.utc)
    pub_start = (now - dt.timedelta(days=WINDOW_DAYS)).strftime("%Y-%m-%dT00:00:00.000")
    pub_end   = now.strftime("%Y-%m-%dT%H:%M:%S.000")

    # NVD 2.0 sorts by publishDate ASCENDING.
    # To get the most recently published CVEs (same order as nvd.nist.gov):
    #   request 1 — probe total results in the window
    #   request 2 — jump to the last page (= most recently published)
    base = f"{NVD_API}?pubStartDate={pub_start}&pubEndDate={pub_end}&noRejected"

    probe = _fetch(f"{base}&resultsPerPage=1&startIndex=0")
    total = probe.get("totalResults", 0)
    if total == 0:
        return []

    start_index = max(0, total - MAX_ITEMS)
    data = _fetch(f"{base}&resultsPerPage={MAX_ITEMS}&startIndex={start_index}")

    rows = [r for item in data.get("vulnerabilities", []) if (r := _normalize(item))]
    rows.sort(key=lambda x: x["published"], reverse=True)
    return rows[:MAX_ITEMS]


def write_feed(items: list[dict]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    document = {
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(),
        "source": NVD_API,
        "items": items,
    }
    OUTPUT_PATH.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    write_feed(fetch_latest())


if __name__ == "__main__":
    main()
