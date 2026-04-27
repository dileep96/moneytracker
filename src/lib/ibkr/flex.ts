/**
 * IBKR Flex Web Service client.
 *
 * Two-step protocol:
 *   1. POST/GET to SendRequest with token + queryId  -> returns ReferenceCode
 *   2. GET to GetStatement with token + ReferenceCode -> returns the actual XML
 *      (may need a brief wait between the two; retry on Status="Warn").
 *
 * Endpoint base path is documented at:
 *   https://www.interactivebrokers.com/campus/ibkr-api-page/flex-web-service/
 *
 * The Flex Query template must be created once in Client Portal and should
 * include at minimum:
 *   - Open Positions
 *   - Trades / Executions (for first-acquired-at)
 *   - Cash Report
 *   - Net Asset Value
 */

import { XMLParser } from "fast-xml-parser";

const SEND_URL = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/SendRequest";
const GET_URL = "https://ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService/GetStatement";
const VERSION = "3";

export interface FlexPosition {
  symbol: string;
  description: string;
  assetCategory: string; // STK, ETF, BOND, CASH, FUND
  currency: string;
  position: number;
  costBasisPrice: number;
  markPrice: number;
  fifoPnlUnrealized: number;
  reportDate: string;
  conid?: string;
}

export interface FlexCashRow {
  currency: string;
  endingCash: number;
}

export interface FlexNav {
  total: number;
  currency: string;
  reportDate: string;
}

export interface FlexResult {
  asOf: string;
  positions: FlexPosition[];
  cash: FlexCashRow[];
  nav: FlexNav | null;
  raw: unknown;
}

export class FlexError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "FlexError";
  }
}

async function sendRequest(token: string, queryId: string): Promise<string> {
  const url = `${SEND_URL}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=${VERSION}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new FlexError(`SendRequest HTTP ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xml);
  const status = parsed?.FlexStatementResponse?.Status ?? parsed?.Status;
  if (status === "Fail") {
    const code = parsed?.FlexStatementResponse?.ErrorCode ?? parsed?.ErrorCode;
    const msg = parsed?.FlexStatementResponse?.ErrorMessage ?? parsed?.ErrorMessage;
    throw new FlexError(`SendRequest failed: ${msg ?? "unknown"}`, String(code));
  }
  const ref = parsed?.FlexStatementResponse?.ReferenceCode ?? parsed?.ReferenceCode;
  if (!ref) throw new FlexError("SendRequest returned no ReferenceCode");
  return String(ref);
}

async function getStatement(token: string, referenceCode: string, attempt = 0): Promise<string> {
  const url = `${GET_URL}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(referenceCode)}&v=${VERSION}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new FlexError(`GetStatement HTTP ${res.status}`);
  const text = await res.text();
  if (text.includes("<code>1019</code>") || text.includes("Statement generation in progress")) {
    if (attempt > 6) throw new FlexError("Statement still generating after retries");
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    return getStatement(token, referenceCode, attempt + 1);
  }
  return text;
}

export async function fetchFlex(token: string, queryId: string): Promise<FlexResult> {
  const ref = await sendRequest(token, queryId);
  const xml = await getStatement(token, ref);
  return parseFlexXml(xml);
}

export function parseFlexXml(xml: string): FlexResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["OpenPosition", "CashReportCurrency", "EquitySummaryByReportDateInBase"].includes(name),
  });
  const parsed = parser.parse(xml);
  const stmt = parsed?.FlexQueryResponse?.FlexStatements?.FlexStatement ?? parsed?.FlexStatements?.FlexStatement;
  if (!stmt) throw new FlexError("No FlexStatement found in response");

  const positions: FlexPosition[] = [];
  const openPositions = stmt?.OpenPositions?.OpenPosition ?? [];
  for (const p of openPositions as Array<Record<string, string>>) {
    positions.push({
      symbol: String(p["@_symbol"] ?? p["@_ticker"] ?? p["@_localSymbol"] ?? ""),
      description: String(p["@_description"] ?? ""),
      assetCategory: String(p["@_assetCategory"] ?? ""),
      currency: String(p["@_currency"] ?? "USD"),
      position: Number(p["@_position"] ?? 0),
      costBasisPrice: Number(p["@_costBasisPrice"] ?? 0),
      markPrice: Number(p["@_markPrice"] ?? 0),
      fifoPnlUnrealized: Number(p["@_fifoPnlUnrealized"] ?? 0),
      reportDate: String(p["@_reportDate"] ?? ""),
      conid: p["@_conid"] ? String(p["@_conid"]) : undefined,
    });
  }

  const cash: FlexCashRow[] = [];
  const cashRows = stmt?.CashReport?.CashReportCurrency ?? [];
  for (const c of cashRows as Array<Record<string, string>>) {
    cash.push({
      currency: String(c["@_currency"] ?? ""),
      endingCash: Number(c["@_endingCash"] ?? 0),
    });
  }

  let nav: FlexNav | null = null;
  const navRows = stmt?.EquitySummaryInBase?.EquitySummaryByReportDateInBase ?? [];
  if (Array.isArray(navRows) && navRows.length > 0) {
    const last = navRows[navRows.length - 1] as Record<string, string>;
    nav = {
      total: Number(last["@_total"] ?? 0),
      currency: String(last["@_currency"] ?? "USD"),
      reportDate: String(last["@_reportDate"] ?? ""),
    };
  }

  const asOf =
    String(stmt?.["@_toDate"] ?? "") ||
    nav?.reportDate ||
    new Date().toISOString().slice(0, 10);

  return { asOf, positions, cash, nav, raw: parsed };
}
