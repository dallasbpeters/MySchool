import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath?: string; // Optional avatar image
}

export interface IEvent {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  isAllDay?: boolean;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
