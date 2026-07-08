export interface VisitRecord {
  id: string;
  timestamp: string;
  page: string;
  referrer: string;
  userAgent: string;
  name: string | null;
  startedTicket: boolean;
}

const KEY = "brillara_analytics";

function generateId(): string {
  // Fingerprint simple persistente por navegador
  let fp = localStorage.getItem("brillara_visitor_id");
  if (!fp) {
    fp = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("brillara_visitor_id", fp);
  }
  return fp;
}

export function recordVisit(page: string = "/"): void {
  if (typeof window === "undefined") return;
  
  const visits: VisitRecord[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  
  visits.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    page,
    referrer: document.referrer || "direct",
    userAgent: navigator.userAgent,
    name: localStorage.getItem("brillara_name"),
    startedTicket: getTicketsStarted(),
  });
  
  // Mantener solo últimos 1000 registros
  if (visits.length > 1000) visits.shift();
  
  localStorage.setItem(KEY, JSON.stringify(visits));
}

function getTicketsStarted(): boolean {
  const tickets = JSON.parse(localStorage.getItem("brillara_tickets") || "[]");
  return tickets.length > 0;
}

export function getAnalytics(): VisitRecord[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function getAnalyticsSummary() {
  const visits = getAnalytics();
  const uniqueIds = new Set(visits.map((v) => v.id));
  
  return {
    totalVisits: visits.length,
    uniqueVisitors: uniqueIds.size,
    ticketsStarted: visits.filter((v) => v.startedTicket).length,
    conversionRate: visits.length > 0 
      ? ((visits.filter((v) => v.startedTicket).length / visits.length) * 100).toFixed(1)
      : "0.0",
    topPages: getTopPages(visits),
    recentVisits: visits.slice(-10).reverse(),
  };
}

function getTopPages(visits: VisitRecord[]) {
  const counts: Record<string, number> = {};
  visits.forEach((v) => {
    counts[v.page] = (counts[v.page] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}
