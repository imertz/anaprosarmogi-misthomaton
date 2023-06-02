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
  console.log("Hey");
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
  console.log(rates[year].filter((r: any) => r.m === month.toString())[0]);
  return rates[year].filter((r: any) => r.m === month.toString())[0].a;
}

const leaseAmounts = calculateLeaseAmounts("2019-02-22", "1000,00", 36, {});
console.log(leaseAmounts);
console.log(
  groupLeaseAmounts("2019-02-22", "1000,00", 36, {
    addedPercentage: "2,0%",
  })
);

type LeaseAmounts = {
  start: string;
  end: string;
  amount: string;
  interestRate: string;
};

function groupLeaseAmounts(
  startDate: string,
  startingAmount: string,
  leaseLength: number,
  options: LeaseOptions = {}
) {
  const arr = calculateLeaseAmounts(
    startDate,
    startingAmount,
    leaseLength,
    options
  ) as LeaseAmount[];
  const result: LeaseAmounts[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== undefined) {
      if (i === 0) {
        const obj: LeaseAmounts = {} as LeaseAmounts;

        (obj.start = arr[i]?.month as string),
          (obj.end = arr[i]?.month as string),
          (obj.amount = arr[i]?.amount as string),
          (obj.interestRate = arr[i]?.interestRate as string),
          result.push(obj);
      }
      if (i !== 0 && arr[i]?.amount === arr[i - 1]?.amount) {
        if (result[result.length - 1] !== undefined) {
          result[result.length - 1] = {
            ...(result[result.length - 1] as LeaseAmounts),
            end: arr[i]?.month as string,
          };
        }
      }
      if (i !== 0 && arr[i]?.amount !== arr[i - 1]?.amount) {
        if (result[result.length - 1] !== undefined) {
          const obj = {
            start: arr[i]?.month,
            end: arr[i]?.month,
            amount: arr[i]?.amount,
            interestRate: arr[i]?.interestRate,
          };
          result.push(obj as LeaseAmounts);
        }
      }
    }
  }
  return result;
}
