import { TimetableGrid } from "@/types";
import { DAYS, TIME_SLOTS } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface TimetableGridViewProps {
  data: TimetableGrid;
}

const TYPE_STYLES = {
  lecture: "bg-primary/10 border-primary/30 text-primary",
  lab: "bg-accent/10 border-accent/30 text-accent",
  seminar: "bg-warning/10 border-warning/30 text-warning",
};

export default function TimetableGridView({ data }: TimetableGridViewProps) {
  // Collect all slot labels present in the data
  const dataSlotLabels = new Set<string>();
  Object.values(data).forEach((daySlots) => {
    Object.keys(daySlots).forEach((label) => dataSlotLabels.add(label));
  });

  // Use static TIME_SLOTS if they cover the data, otherwise build dynamic rows from data
  const staticLabels = new Set(TIME_SLOTS.map((s) => s.label));
  const hasUnknownSlots = [...dataSlotLabels].some((l) => !staticLabels.has(l));

  const activeSlots = hasUnknownSlots
    ? [...dataSlotLabels]
        .sort()
        .map((label) => ({ id: label, label }))
    : TIME_SLOTS.filter((s) => dataSlotLabels.size === 0 || dataSlotLabels.has(s.label) || true);

  // Active days: only days that have at least one entry, preserving order
  const activeDays = DAYS.filter((d) => data[d] && Object.values(data[d]).some(Boolean));
  const displayDays = activeDays.length > 0 ? activeDays : DAYS;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[700px] text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-muted-foreground font-semibold border-b border-r bg-muted/40 w-28">
              Time / Day
            </th>
            {displayDays.map((day) => (
              <th key={day} className="p-3 text-center font-semibold text-foreground border-b border-r last:border-r-0 bg-muted/40">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeSlots.map((slot, idx) => (
            <tr key={slot.id} className={cn("border-b last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
              <td className="p-3 text-xs font-semibold text-muted-foreground border-r whitespace-nowrap">
                {slot.label}
              </td>
              {displayDays.map((day) => {
                const cell = data[day]?.[slot.label] ?? null;
                return (
                  <td key={`${day}-${slot.id}`} className="p-1.5 border-r last:border-r-0 align-top min-w-[120px]">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
