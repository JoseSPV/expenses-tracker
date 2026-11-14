import { monthsBetween, today } from "./dates";
import type { Frequency, Goal, ISODate } from "./types";

const PERIODS_PER_YEAR: Record<Frequency, number> = { weekly: 52, monthly: 12, yearly: 1 };
const MAX_YEARS = 80;

export const toMonthly = (amount: number, frequency: Frequency): number =>
  (amount * PERIODS_PER_YEAR[frequency]) / 12;

export function compoundGrowth(input: { principal: number; monthly: number; rate: number; years: number }) {
  const monthlyRate = input.rate / 100 / 12;
  const years = Math.min(Math.round(input.years), MAX_YEARS);
  let balance = input.principal;
  let contributed = input.principal;
  const points = [{ year: 0, balance, contributed }];

  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyRate) + input.monthly;
    contributed += input.monthly;
    if (month % 12 === 0) points.push({ year: month / 12, balance, contributed });
  }
  return { balance, contributed, interest: balance - contributed, points };
}

export function loanPayment(input: { amount: number; rate: number; years: number }) {
  const months = Math.max(1, Math.round(input.years * 12));
  const monthlyRate = input.rate / 100 / 12;
  const payment =
    monthlyRate === 0 ? input.amount / months : (input.amount * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
  const total = payment * months;
  return { payment, total, interest: total - input.amount };
}

export function emergencyFund(input: { expenses: number; months: number; saved: number }) {
  const target = input.expenses * input.months;
  return {
    target,
    gap: Math.max(0, target - input.saved),
    ratio: target > 0 ? input.saved / target : 0,
    monthsCovered: input.expenses > 0 ? input.saved / input.expenses : 0,
  };
}

export function goalProgress(goal: Goal, from: ISODate = today()) {
  const remaining = Math.max(0, goal.target - goal.saved);
  const monthsLeft = monthsBetween(from, goal.deadline);
  return {
    ratio: goal.target > 0 ? goal.saved / goal.target : 0,
    remaining,
    monthsLeft,
    monthlyNeeded: remaining === 0 ? 0 : remaining / Math.max(1, monthsLeft),
    done: remaining === 0,
  };
}
