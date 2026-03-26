import { TimetableGrid } from "@/types";
import { DAYS } from "@/lib/mockData";
import { cn, formatTimeSlot } from "@/lib/utils";

interface TimetableGridViewProps {
  data: TimetableGrid;
}

const TYPE_STYLES = {
  lecture: "bg-primary/10 border-primary/30 text-primary",
  lab: "bg-accent/10 border-accent/30 text-accent",
  seminar: "bg-warning/10 border-warning/30 text-warning",
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Recess definitions: start/end in 24hr "HH:MM"
const RECESS_WEEKDAY = [
  { start: "12:30", end: "13:00" },
  { start: "15:00", end: "15:15" },
];
const RECESS_SATURDAY = [
  { start: "10:00", end: "10:15" },
];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function parse12hrToMinutes(label: string): number {
  const startPart = label.split(" - ")[0].trim();
  const [timePart, period] = startPart.split(" ");
  const [h, m] = timePart.split(":").map(Number);
  let hour = h;
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + m;
}

type Row =
  | { kind: "data"; label: string }
  | { kind: "recess"; label: string };

function buildRows(dataLabels: string[], recessDefs: { start: string; end: string }[]): Row[] {
  const sorted = [...dataLabels].sort((a, b) => parse12hrToMinutes(a) - parse12hrToMinutes(b));
  const inserted = new Set<string>();
  const rows: Row[] = [];

  for (const label of sorted) {
    const slotMin = parse12hrToMinutes(label);
    for (const r of recessDefs) {
      const rLabel = `${formatTimeSlot(r.start)} - ${formatTimeSlot(r.end)}`;
      if (!inserted.has(rLabel) && toMinutes(r.start) <= slotMin) {
        rows.push({ kind: "recess", label: rLabel });
        inserted.add(rLabel);
      }
    }
    rows.push({ kind: "data", label });
  }

  // Append recess slots that fall after all data slots
  for (const r of recessDefs) {
    const rLabel = `${formatTimeSlot(r.start)} - ${formatTimeSlot(r.end)}`;
    if (!inserted.has(rLabel)) {
      rows.push({ kind: "recess", label: rLabel });
      inserted.add(rLabel);
    }
  }

  return rows;
}

interface GridTableProps {
  days: string[];
  rows: Row[];
  data: TimetableGrid;
}

function GridTable({ days, rows, data }: GridTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[600px] text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-muted-foreground font-semibold border-b border-r bg-muted/40 w-36">
              Time / Day
            </th>
            {days.map((day) => (
              <th key={day} className="p-3 text-center font-semibold text-foreground border-b border-r last:border-r-0 bg-muted/40">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) =>
            row.kind === "recess" ? (
              <tr key={`recess-${row.label}`} className="border-b bg-amber-50 dark:bg-amber-950/20">
                <td className="p-2 text-xs font-semibold text-amber-700 dark:text-amber-400 border-r whitespace-nowrap">
                  {row.label}
                </td>
                {days.map((day) => (
                  <td key={`${day}-recess`} className="p-1.5 border-r last:border-r-0">
                    <div className="flex items-center justify-center min-h-[28px] rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                        Recess
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ) : (
              <tr key={row.label} className={cn("border-b last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <td className="p-3 text-xs font-semibold text-muted-foreground border-r whitespace-nowrap">
                  {row.label}
                </td>
                {days.map((day) => {
                  const cell = data[day]?.[row.label] ?? null;
                  return (
                    <td key={`${day}-${row.label}`} className="p-1.5 border-r last:border-r-0 align-top min-w-[120px]">
                      {cell ? (
                        <div className={cn("rounded-lg border p-2 h-full", TYPE_STYLES[cell.type])}>
                          <p className="font-bold text-[11px]">{cell.courseCode}</p>
                          <p className="text-[10px] font-medium leading-tight mt-0.5">{cell.courseName}</p>
                          <p className="text-[9px] opacity-70 mt-1 leading-tight">{cell.facultyName}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[9px] bg-black/10 rounded px-1 py-0.5">{cell.room}</span>
                            <span className="text-[9px] capitalize">{cell.type}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full min-h-[60px] flex items-center justify-center">
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function TimetableGridView({ data }: TimetableGridViewProps) {
  // Collect slot labels per group
  const weekdayLabels = new Set<string>();
  const saturdayLabels = new Set<string>();

  WEEKDAYS.forEach((d) => Object.keys(data[d] ?? {}).forEach((l) => weekdayLabels.add(l)));
  Object.keys(data["Saturday"] ?? {}).forEach((l) => saturdayLabels.add(l));

  const activeDays = DAYS.filter((d) => d !== "Saturday" && data[d] && Object.values(data[d]).some(Boolean));
  const hasSaturday = data["Saturday"] && Object.values(data["Saturday"]).some(Boolean);

  const weekdayRows = buildRows([...weekdayLabels], RECESS_WEEKDAY);
  const saturdayRows = buildRows([...saturdayLabels], RECESS_SATURDAY);

  return (
    <div className="space-y-6">
      {/* Mon–Fri table */}
      {activeDays.length > 0 && (
        <GridTable days={activeDays} rows={weekdayRows} data={data} />
      )}

      {/* Saturday table — only when Saturday has data */}
      {hasSaturday && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">Saturday</p>
          <GridTable days={["Saturday"]} rows={saturdayRows} data={data} />
        </div>
      )}
    </div>
  );
}
