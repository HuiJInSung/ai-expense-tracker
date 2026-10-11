"use client";

import { useEffect, useRef } from "react";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

type Props = {
  /** YYYY-MM */
  month: string;
  selectedDate: string;
  today: string;
  markedDates: Set<string>;
  onSelect: (date: string) => void;
};

export function DateStrip({ month, selectedDate, today, markedDates, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day,
      date: `${month}-${String(day).padStart(2, "0")}`,
      weekday: new Date(year, monthNum - 1, day).getDay(),
    };
  });

  // 選取的日期捲到中間；第一次直接定位，之後才用動畫
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    const scroller = scrollerRef.current;
    const el = scroller?.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
    if (!scroller || !el) return;
    scroller.scrollTo({
      left: el.offsetLeft - scroller.clientWidth / 2 + el.clientWidth / 2,
      behavior: hasScrolledRef.current ? "smooth" : "instant",
    });
    hasScrolledRef.current = true;
  }, [selectedDate, month]);

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar relative flex snap-x gap-2 overflow-x-auto px-5 py-2"
    >
      {days.map(({ day, date, weekday }) => {
        const selected = date === selectedDate;
        const isToday = date === today;
        const isWeekend = weekday === 0 || weekday === 6;
        return (
          <button
            key={date}
            data-date={date}
            type="button"
            onClick={() => onSelect(date)}
            className={`flex w-12 shrink-0 snap-center flex-col items-center gap-1 rounded-2xl py-2.5 transition active:scale-95 ${
              selected ? "bg-brand text-white shadow-brand" : "card text-slate-700"
            }`}
          >
            <span
              className={`text-[11px] font-medium ${
                selected ? "text-white/80" : isWeekend ? "text-rose-400" : "text-slate-400"
              }`}
            >
              {WEEKDAYS[weekday]}
            </span>
            <span
              className={`text-[17px] leading-none font-semibold ${
                !selected && isToday ? "text-indigo-600" : ""
              }`}
            >
              {day}
            </span>
            <span
              className={`h-1 w-1 rounded-full ${
                markedDates.has(date)
                  ? selected
                    ? "bg-white"
                    : "bg-indigo-500"
                  : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
