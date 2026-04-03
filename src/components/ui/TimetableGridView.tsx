import { TimetableGrid } from "@/types";
import { DAYS } from "@/lib/mockData";
import { cn, formatTimeSlot } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchRooms } from "@/lib/api";

export interface BatchInfo {
  id: string;
  name: string;
}

export interface LabCourseInfo {
  id: string;
  course_name: string;
}

interface TimetableGridViewProps {
  data: TimetableGrid;
  /** Batches for the semester (fetched by parent) */
  batches?: BatchInfo[];
  /** Lab/practical courses for the semester (fetched by parent) */
  labCourses?: LabCourseInfo[];
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

function isConsecutiveSlots(labelA: string, labelB: string): boolean {
  // Check if slotA ends exactly when slotB starts
  const endA = labelA.split(" - ")[1]?.trim();
  const startB = labelB.split(" - ")[0]?.trim();
  if (!endA || !startB) return false;
  // Both are in "h:mm AM/PM" form — compare as minutes
  function toMin(t: string) {
    const [time, period] = t.split(" ");
    const [h, m] = time.split(":").map(Number);
    let hour = h;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour * 60 + m;
  }
  return toMin(endA) === toMin(startB);
}

interface GridTableProps {
  days: string[];
  rows: Row[];
  data: TimetableGrid;
  inline?: boolean; // when true, shrinks to content width (used for Saturday)
  batches?: BatchInfo[];
  labCourses?: LabCourseInfo[];
  /** Maps "day|slotLabel" → sequential index among all fallback lab slots in the week */
  labSlotIndexMap?: Map<string, number>;
  rawRooms?: any[];
}

function GridTable({ days, rows, data, inline = false, batches = [], labCourses = [], labSlotIndexMap, rawRooms = [] }: GridTableProps) {
  // Pre-compute which (rowIdx, dayCol) cells are "part 2" of a lab pair → skip them
  const skipCell = new Set<string>();
  // and which (rowIdx, dayCol) cells get rowSpan=2
  const spanCell = new Set<string>();

  const dataRows = rows.filter((r) => r.kind === "data");

  for (let i = 0; i < dataRows.length - 1; i++) {
    const rowA = dataRows[i];
    const rowB = dataRows[i + 1];
    if (!isConsecutiveSlots(rowA.label, rowB.label)) continue;

    // Find actual indices in full rows array
    const idxA = rows.indexOf(rowA);
    const idxB = rows.indexOf(rowB);

    for (const day of days) {
      const cellA = data[day]?.[rowA.label];
      const cellB = data[day]?.[rowB.label];
      if (
        cellA &&
        cellB &&
        cellA.type === "lab" &&
        cellB.type === "lab" &&
        cellA.courseCode === cellB.courseCode
      ) {
        spanCell.add(`${idxA}-${day}`);
        skipCell.add(`${idxB}-${day}`);
      }
    }
  }

  return (
    <div className={inline ? "inline-block rounded-xl border bg-card shadow-card" : "overflow-x-auto rounded-xl border bg-card shadow-card"}>
      <table className={inline ? "min-w-[420px] text-sm border-collapse" : "w-full min-w-[600px] text-sm border-collapse"}>
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
                <td
                  colSpan={days.length + 1}
                  className="p-2 text-center"
                >
                  <div className="flex items-center justify-center gap-3 min-h-[28px] rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 mx-1">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 tracking-widest uppercase">
                      Recess — {row.label}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={row.label} className={cn("border-b last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                <td className="p-3 text-xs font-semibold text-muted-foreground border-r whitespace-nowrap">
                  {row.label}
                </td>
                {days.map((day) => {
                  const cellKey = `${idx}-${day}`;

                  // Skip: this cell is the "second half" of a merged lab block
                  if (skipCell.has(cellKey)) return null;

                  const cell = data[day]?.[row.label] ?? null;
                  const isSpanned = spanCell.has(cellKey);

                  return (
                    <td
                      key={`${day}-${row.label}`}
                      rowSpan={isSpanned ? 2 : 1}
                      className="p-1.5 border-r last:border-r-0 align-top min-w-[120px]"
                      style={isSpanned ? { verticalAlign: "middle" } : undefined}
                    >
                      {cell ? (
                        <div className={cn("rounded-lg border p-2 h-full", TYPE_STYLES[cell.type])}>
                          {cell.batchAssignments && cell.batchAssignments.length > 0 ? (
                            // Lab slot with real batch assignments: batch name + assigned course
                            <div className="space-y-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-bold uppercase opacity-50 tracking-wide">Lab Session</span>
                                <span className="text-[9px] bg-black/10 rounded px-1 opacity-60">2 hrs</span>
                              </div>
                              {cell.batchAssignments.map((ba, i) => (
                                <div key={i} className="rounded border border-current/20 bg-black/5 px-1.5 py-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[9px] font-bold bg-black/15 rounded px-1">{ba.batchName}</span>
                                      {ba.room && (
                                        <span className="text-[9px] font-bold opacity-60 bg-black/5 rounded px-1 tabular-nums border border-current/5">
                                          {ba.room}
                                        </span>
                                      )}
                                    </div>
                                    {ba.courseName && (
                                      <span className="text-[9px] font-semibold leading-tight opacity-80">
                                        {ba.facultyName && <span className="opacity-70 font-normal mr-1">{ba.facultyName} •</span>}
                                        {ba.courseName}
                                      </span>
                                    )}
                                  </div>
                                  {/* Just a tiny identifier at the bottom if needed, or remove for cleaner look */}
                                  <div className="flex items-center justify-end mt-0.5">
                                    <span className="text-[7px] opacity-30 uppercase tracking-tighter">Batch {ba.batchName}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : cell.type === "lab" && batches.length > 0 ? (
                            // Lab slot without batch assignments: rotate courses so each batch
                            // covers all lab subjects across the week
                            (() => {
                              const slotIdx = labSlotIndexMap?.get(`${day}|${row.label}`) ?? 0;
                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold uppercase opacity-50 tracking-wide">Lab Session</span>
                                    <span className="text-[9px] bg-black/10 rounded px-1 opacity-60">2 hrs</span>
                                  </div>
                                  {batches.map((batch, i) => (
                                    <div key={batch.id} className="rounded border border-current/20 bg-black/5 px-1.5 py-1">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-[9px] font-bold bg-black/15 rounded px-1 shrink-0">{batch.name}</span>
                                        {labCourses.length > 0 && (() => {
                                          const labCourse = labCourses[(i + slotIdx) % labCourses.length];
                                          // Add safe property access for course and faculty info
                                          const courseName = (labCourse as any)?.course_name || (labCourse as any)?.name || 'Unknown Lab';
                                          const facultyName = (labCourse as any)?.faculty?.name || (labCourse as any)?.facultyName;
                                          
                                          // Guess room from actual rooms fetched via useQuery
                                          const availableRooms: any[] = rawRooms || [];
                                          const labRooms = availableRooms.filter(r => 
                                            r.room_type?.toLowerCase().includes('lab') || 
                                            r.type?.toLowerCase().includes('lab') || 
                                            r.room_name?.toLowerCase().includes('lab') ||
                                            r.name?.toLowerCase().includes('lab')
                                          );
                                          // Cycle through available lab rooms or default to a safe generic format if none exist
                                          const fallbackRoomIndex = (i + slotIdx) % (labRooms.length || 1);
                                          const guessedRoom = labRooms.length > 0 
                                            ? labRooms[fallbackRoomIndex]?.room_name || labRooms[fallbackRoomIndex]?.name 
                                            : `10${(i + 1)}`;
                                          
                                          return (
                                            <div className="flex flex-col gap-0.5">
                                              <span className="text-[9px] font-semibold leading-tight opacity-80">
                                                {facultyName && <span className="opacity-70 font-normal mr-1">{facultyName} •</span>}
                                                {courseName}
                                              </span>
                                              <div className="flex items-center gap-1 opacity-60">
                                                <span className="text-[8px] bg-black/10 px-1 rounded tabular-nums">Room: {guessedRoom}</span>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()
                          ) : (
                            // Regular lecture/seminar cell
                            <>
                              <p className="font-bold text-[11px]">{cell.courseCode}</p>
                              <p className="text-[10px] font-medium leading-tight mt-0.5">{cell.courseName}</p>
                              <p className="text-[9px] opacity-70 mt-1 leading-tight">{cell.facultyName}</p>
                              {isSpanned && (
                                <p className="text-[9px] opacity-60 mt-0.5 font-semibold">2 hrs (Lab)</p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] bg-black/10 rounded px-1 py-0.5">{cell.room}</span>
                                {cell.batchName
                                  ? <span className="text-[9px] bg-black/15 rounded px-1 py-0.5 font-bold">{cell.batchName}</span>
                                  : <span className="text-[9px] capitalize">{cell.type}</span>
                                }
                              </div>
                            </>
                          )}
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

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableGridView({ data, batches, labCourses }: TimetableGridViewProps) {
  const { data: rawRooms } = useQuery({
    queryKey: ["rooms-fallback"],
    queryFn: fetchRooms,
    staleTime: 5 * 60 * 1000, 
  });

  // Collect slot labels per group
  const weekdayLabels = new Set<string>();
  const saturdayLabels = new Set<string>();

  WEEKDAYS.forEach((d) => Object.keys(data[d] ?? {}).forEach((l) => weekdayLabels.add(l)));
  Object.keys(data["Saturday"] ?? {}).forEach((l) => saturdayLabels.add(l));

  const activeDays = DAYS.filter((d) => d !== "Saturday" && data[d] && Object.values(data[d]).some(Boolean));
  const hasSaturday = data["Saturday"] && Object.values(data["Saturday"]).some(Boolean);

  const weekdayRows = buildRows([...weekdayLabels], RECESS_WEEKDAY);
  const saturdayRows = buildRows([...saturdayLabels], RECESS_SATURDAY);

  // Build a map of { "day|slotLabel" → sequential index } for every DISPLAYED fallback lab slot.
  // A 2-hour lab occupies two consecutive 1-hour rows, but only the first is rendered (the second
  // is hidden via skipCell / rowSpan). We must skip "second-half" slots so indices are consecutive
  // (0, 1, 2 …) rather than jumping (0, 2, 4 …) which would break the rotation formula.
  const labSlotEntries: { key: string; dayOrder: number; startMin: number; endMin: number }[] = [];

  // Helper: parse end-time minutes from a "H:MM AM – H:MM AM" label
  function endMinutes(label: string): number {
    const endPart = label.split(" - ")[1]?.trim() ?? "";
    const [timePart, period] = endPart.split(" ");
    const [h, m] = timePart.split(":").map(Number);
    let hour = h;
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return hour * 60 + m;
  }

  for (const day of DAY_ORDER) {
    const dayData = data[day];
    if (!dayData) continue;
    for (const [slotLabel, cell] of Object.entries(dayData)) {
      if (cell && cell.type === "lab" && (!cell.batchAssignments || cell.batchAssignments.length === 0)) {
        labSlotEntries.push({
          key: `${day}|${slotLabel}`,
          dayOrder: DAY_ORDER.indexOf(day),
          startMin: parse12hrToMinutes(slotLabel),
          endMin: endMinutes(slotLabel),
        });
      }
    }
  }
  labSlotEntries.sort((a, b) => a.dayOrder - b.dayOrder || a.startMin - b.startMin);

  // Remove "second-half" slots: a slot is a second-half if its startMin equals
  // the endMin of the immediately preceding slot on the same day.
  const labSlotIndexMap = new Map<string, number>();
  let displayedIdx = 0;
  let prevDayOrder = -1;
  let prevEndMin = -1;
  for (const entry of labSlotEntries) {
    const isSecondHalf =
      entry.dayOrder === prevDayOrder && entry.startMin === prevEndMin;
    if (!isSecondHalf) {
      labSlotIndexMap.set(entry.key, displayedIdx);
      displayedIdx++;
    }
    prevDayOrder = entry.dayOrder;
    prevEndMin = entry.endMin;
  }

  return (
    <div className="space-y-6">
      {/* Mon–Fri table */}
      {activeDays.length > 0 && (
        <GridTable
          days={activeDays}
          rows={weekdayRows}
          data={data}
          batches={batches}
          labCourses={labCourses}
          labSlotIndexMap={labSlotIndexMap}
          rawRooms={rawRooms || []}
        />
      )}

      {/* Saturday table — only when Saturday has data */}
      {hasSaturday && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">Saturday</p>
          <GridTable
            days={["Saturday"]}
            rows={saturdayRows}
            data={data}
            inline
            batches={batches}
            labCourses={labCourses}
            labSlotIndexMap={labSlotIndexMap}
            rawRooms={rawRooms || []}
          />
        </div>
      )}
    </div>
  );
}
