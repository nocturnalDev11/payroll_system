/**
 * Calculates SSS contribution based on monthly salary
 * @param salary Monthly salary amount
 * @returns Calculated SSS contribution
 */
export const calculateSSSContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    if (monthlySalary < 5000) return 250;
    
    const salaryCredit = Math.min(Math.max(monthlySalary, 5000), 35000);
    const regularSSContribution = Math.round(salaryCredit * 0.05);
    let mpfContribution = 0;
    
    if (salaryCredit > 20000) {
        const mpfBase = Math.min(salaryCredit, 35000) - 20000;
        mpfContribution = Math.round(mpfBase * 0.025);
    }
    
    let totalEmployeeContribution = regularSSContribution + mpfContribution;
    if (salaryCredit > 34750) {
        totalEmployeeContribution = 1750;
    }
    return totalEmployeeContribution;
};

/**
 * Calculates PhilHealth contribution based on monthly salary
 * @param salary Monthly salary amount
 * @returns Calculated PhilHealth contribution
 */
export const calculatePhilHealthContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const minSalary = 10000;
    const maxSalary = 100000;
    const cappedSalary = Math.min(Math.max(monthlySalary, minSalary), maxSalary);
    return Math.round(cappedSalary * 0.025);
};

/**
 * Calculates Pag-IBIG contribution based on monthly salary
 * @param salary Monthly salary amount
 * @returns Calculated Pag-IBIG contribution
 */
export const calculatePagIBIGContribution = (salary) => {
    const monthlySalary = Math.max(salary || 0, 0);
    const maxSalary = 5000;
    const cappedSalary = Math.min(monthlySalary, maxSalary);
    let rate = 0.02;
    if (cappedSalary <= 1500) {
        rate = 0.01;
    }
    return Math.round(cappedSalary * rate);
};

/**
 * Calculates withholding tax based on monthly taxable income
 * @param salary Monthly taxable income
 * @returns Calculated withholding tax
 */
export const calculateWithholdingTax = (salary) => {
    const taxableIncome = salary || 0;
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return Math.round((taxableIncome - 20833) * 0.15);
    if (taxableIncome <= 66667) return Math.round(1875 + (taxableIncome - 33333) * 0.20);
    if (taxableIncome <= 166667) return Math.round(13541.80 + (taxableIncome - 66667) * 0.25);
    if (taxableIncome <= 666667) return Math.round(90841.80 + (taxableIncome - 166667) * 0.30);
    return Math.round(408841.80 + (taxableIncome - 666667) * 0.35);
};
