import importedRates from "./rates.json";

const rates = importedRates as any;

interface LeaseOptions {
  addedPercentage?: string;
  atLeastPercentage?: string;
  atMostPercentage?: string;
  fixedPercentage?: string;
}

interface LeaseAmount {
  month: string;
  amount: string;
  interestRate: string;
}

export function calculateLeaseAmounts(
  startDate: string,
  startingAmount: string,
  leaseLength: number,
  options: LeaseOptions = {}
): LeaseAmount[] {
  if (options.addedPercentage === undefined) {
    options.addedPercentage = "0,0%";
  }
  if (options.atLeastPercentage === undefined) {
    options.atLeastPercentage = "-100,0%";
  }
  if (options.atMostPercentage === undefined) {
    options.atMostPercentage = "100,0%";
  }
  const leaseAmounts: LeaseAmount[] = [];
  let currentDate = new Date(startDate);
  // Set time to 12:00 to avoid DST issues
  currentDate.setHours(12);
  let currentAmount = parseFloat(startingAmount.replace(",", "."));
  let lastDateOfAdjustment = new Date(startDate);

  for (let i = 0; i < leaseLength; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    let interestRate =
      parseFloat(getInterestRate(year, month).replace(",", ".")) +
      parseFloat(options.addedPercentage.replace(",", "."));
    interestRate = Math.max(
      parseFloat(options.atLeastPercentage.replace(",", ".")),
      Math.min(
        parseFloat(options.atMostPercentage.replace(",", ".")),
        interestRate
      )
    );
    options.fixedPercentage &&
      (interestRate = parseFloat(options.fixedPercentage.replace(",", ".")));

    if (
      lastDateOfAdjustment.getMonth() + 1 === month &&
      lastDateOfAdjustment.getFullYear() === year - 1
    ) {
      currentAmount *= 1 + interestRate / 100;
      lastDateOfAdjustment = currentDate;
    }

    leaseAmounts.push({
      month: currentDate.toISOString().slice(0, 7),
      amount: currentAmount.toFixed(2).replace(".", ","),
      interestRate: interestRate.toFixed(2).replace(".", ","),
    });
    // Add 12 hours to current date to avoid DST issues
    currentDate = new Date(currentDate.getTime() + 12 * 60 * 60 * 1000);

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return leaseAmounts;
}

function getInterestRate(year: number, month: number): string {
  return rates[year].filter((r: any) => r.m === month.toString())[0].a;
}
