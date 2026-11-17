
import { prisma } from "../../index";

export interface WeekInfo {
  weekStart: string;
  totalWeekdays: number;
  workingDays: number;
  holidayDays: number;
}

export async function getWeeklyCalendar(
  rangeStart: Date,
  rangeEnd: Date
): Promise<WeekInfo[]> {
  const holidays = await prisma.orgHoliday.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
  });
  const holidaySet = new Set(
    holidays.map((h) => h.date.toISOString().slice(0, 10))
  );

  const weeks: WeekInfo[] = [];
  const current = getMonday(rangeStart);
  const end = getMonday(rangeEnd);

  while (current <= end) {
    let workingDays = 0;
    let holidayDays = 0;

    for (let d = 0; d < 5; d++) {
      const day = new Date(current);
      day.setDate(day.getDate() + d);
      const iso = day.toISOString().slice(0, 10);

      if (holidaySet.has(iso)) {
        holidayDays++;
      } else {
        workingDays++;
      }
    }

    weeks.push({
      weekStart: current.toISOString().slice(0, 10),
      totalWeekdays: 5,
      workingDays,
      holidayDays,
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

export async function getWorkingDaysInWeek(weekStart: string): Promise<number> {
  const calendar = await getWeeklyCalendar(
    new Date(weekStart),
    new Date(weekStart)
  );
  return calendar.length > 0 ? calendar[0].workingDays : 5;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

