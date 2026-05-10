// Tally AI — Seed Data from House of Yawitazah Budget Spreadsheets (2025 & 2026)
const SEED_DATA = {
  settings: {
    householdName: "House of Yawitazah",
    users: [
      { id: "person1", name: "", username: "", role: "Primary", color: "#7c6ef8", passwordHash: "" },
      { id: "person2", name: "", username: "", role: "Partner", color: "#f4b942", passwordHash: "" }
    ],
    aiProvider: "claude",
    aiApiKey: "",
    openaiApiKey: "",
    accounts: ["Capital One","Truliant Business","Truliant Savings","Truliant Checking","Citi","PNC","House of Yawitazah Cash App","Yawitazah Cash App"],
    incomeCategories: ["Zah Brand Solutions","BBB Salary","Content/Freelance","Dejzah.Life","PlanNet","Gifts","401K","Short Term Disability","Tax Refund","Refunds","Other Income"],
    fixedCategories: ["Dance","Wifi","Suno","Utilities","ElevenLabs","CapCut","Adobe","GoDaddy","Canva","Wix: Dejahwhite","Prime Video","ChatGPT","Rent","Spotify","Amazon Prime","PlanNet Subscription","ATT","Google One","Gamma","Instacart+","LA Fitness","Nelnet","Netflix","Wix: HOY","Higgsfield","Apple","Car Insurance","Doordash DashPass","Renters Insurance","Dejah Allowance","Car Payment","After School Program","Zips Car Wash","Car Wash","Other Fixed"],
    variableCategories: ["Groceries","Eating Out","Gas","Auto / Car Maintenance","Entertainment / Date","Household Shopping","Clothes Shopping","Personal Care","Medical / Health","School / Extra-Curricular","Baby","Gifts","Charity","Travel","Baby Shower Expenses","Misc Business Expenses","Other"],
    debtCategories: ["Dejah Student Loans","Zah Student Loans","Car Loan","Citi Bank","Zah Medical Bills","Dejah Medical Bills","Credit Card","Other Debt"],
    savingsCategories: ["Emergency Fund","New Home Fund","New Car Fund","Honeymoon","Family Vacation","Summer Camp","Investments","Other Savings"]
  },
  data: {
    "2025": {
      annualTotals: {
        income: { estimated: 87379.66, actual: 111646.56 },
        fixedExpenses: { estimated: 41035.20, actual: 44031.19 },
        variableExpenses: { estimated: 44080.00, actual: 68627.58 },
        totalExpenses: { estimated: 85115.20, actual: 112658.77 },
        netIncome: { estimated: 2264.46, actual: -1012.21 },
        incomeSources: {
          "Zah Brand Solutions": { estimated: 48000, actual: 52200.97 },
          "BBB Salary": { estimated: 38779.66, actual: 45655.39 },
          "Dejzah.life/Content": { estimated: 0, actual: 289.40 },
          "PlanNet": { estimated: 0, actual: 516.00 },
          "Gifts": { estimated: 600, actual: 4742.33 },
          "401K": { estimated: 0, actual: 6702.47 },
          "Short Term Disability": { estimated: 0, actual: 1540.00 },
          "Tax Refund": { estimated: 0, actual: 4670.10 }
        }
      },
      months: {
        "January": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:7782.35, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3098.78, actual:3098.79, account:"Truliant Savings", purpose:"Savings" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:70.01, actual:70.01, account:"Capital One", dueDate:"1st" },
            { category:"After School Program", budget:260, actual:195, account:"Capital One", dueDate:"1st Mon" },
            { category:"Wifi", budget:87.94, actual:87.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:177.67, actual:177.67, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:410.41, account:"Capital One", dueDate:"5th" },
            { category:"GoDaddy", budget:5.43, actual:65.16, account:"Truliant Business", dueDate:"7th (annual)" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:26.75, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2200, actual:2200, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"Car Payment", budget:438, actual:443.95, account:"Capital One", dueDate:"15th" },
            { category:"Netflix", budget:16.57, actual:16.57, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Zips Car Wash", budget:20, actual:10, account:"Capital One", dueDate:"30th" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1896.71, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:741.43, account:"Citi" },
            { category:"Gas", budget:100, actual:144.09, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:15, actual:19.25, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:331.22, account:"Citi" },
            { category:"Household Shopping", budget:100, actual:307.29, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:301.64, account:"Citi" },
            { category:"Personal Care", budget:100, actual:412.35, account:"Capital One" },
            { category:"Medical / Health", budget:0, actual:779.76, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:0, actual:229.76, account:"Capital One" },
            { category:"Gifts", budget:50, actual:65.27, account:"Capital One" },
            { category:"Citi Payment", budget:1000, actual:400, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:43.83, account:"Truliant Business" }
          ],
          debt: [
            { category:"Car Loan", balance:4500, payment:0, account:"" },
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:150, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Family Vacation", target:6000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Summer Camp", target:2000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:255, account:"Truliant Business" }
          ],
          summary: { startingBalance:3807.35, totalIncome:10881.14, totalExpenses:9479.34, debtPayments:0, savingsContributions:400, netCashFlow:1001.80, endingBalance:4809.15 }
        },
        "February": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:7032.62, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3298.76, actual:3298.77, account:"Truliant Savings", purpose:"Savings" },
            { source:"Gifts", expected:0, actual:60, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:70.01, actual:116.36, account:"Capital One", dueDate:"1st" },
            { category:"After School Program", budget:260, actual:175, account:"Capital One", dueDate:"1st Mon" },
            { category:"Wifi", budget:87.94, actual:87.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:180.67, actual:177.67, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:387.81, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:14.99, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2200, actual:4400, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:212.42, account:"Truliant Business", dueDate:"13th" },
            { category:"Netflix", budget:16.57, actual:16.57, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Dejah Allowance", budget:200, actual:200, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1058.07, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:720.71, account:"Citi" },
            { category:"Gas", budget:100, actual:90.16, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:15, actual:8.55, account:"Capital One" },
            { category:"Household Shopping", budget:100, actual:1038.27, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:377.68, account:"Citi" },
            { category:"Personal Care", budget:100, actual:23.46, account:"Capital One" },
            { category:"Medical / Health", budget:0, actual:281, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:0, actual:25, account:"Capital One" },
            { category:"Travel", budget:0, actual:1404, account:"Citi" },
            { category:"Citi Payment", budget:1000, actual:2000, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:121.51, account:"Truliant Business" },
            { category:"Baby Shower Expenses", budget:0, actual:590, account:"Capital One" }
          ],
          debt: [
            { category:"Car Loan", balance:4500, payment:0, account:"" },
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:500, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:100, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:100, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"Family Vacation", target:6000, contribution:100, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:100, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"Summer Camp", target:2000, contribution:100, currentBalance:250.31, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:216, account:"Truliant Business" }
          ],
          summary: { startingBalance:5083.91, totalIncome:10391.39, totalExpenses:13636.86, debtPayments:0, savingsContributions:1000, netCashFlow:-4245.47, endingBalance:838.44 }
        },
        "March": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:838.44, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "April": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "May": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:0, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3298.76, actual:0, account:"Truliant Savings", purpose:"Savings" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:70.01, actual:70.01, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:87.94, actual:87.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:180.67, actual:177.67, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:331.94, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:14.99, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2200, actual:0, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:212.52, account:"Truliant Business", dueDate:"13th" },
            { category:"Car Payment", budget:438, actual:438, account:"Capital One", dueDate:"15th" },
            { category:"Netflix", budget:16.57, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Zips Car Wash", budget:20, actual:20, account:"Capital One", dueDate:"30th" },
            { category:"Dejah Allowance", budget:200, actual:100, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1475.62, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:948.20, account:"Citi" },
            { category:"Gas", budget:100, actual:221.15, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:15, actual:44.40, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:2072.62, account:"Citi" },
            { category:"Household Shopping", budget:100, actual:348.47, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:49.18, account:"Citi" },
            { category:"Personal Care", budget:100, actual:201.60, account:"Capital One" },
            { category:"Medical / Health", budget:40, actual:718.95, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:0, actual:106.52, account:"Capital One" },
            { category:"Gifts", budget:50, actual:44.40, account:"Capital One" },
            { category:"Travel", budget:0, actual:452.83, account:"Citi" },
            { category:"Citi Payment", budget:1000, actual:1399, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:334.05, account:"Truliant Business" },
            { category:"Baby Shower Expenses", budget:0, actual:205.37, account:"Capital One" }
          ],
          debt: [
            { category:"Car Loan", balance:4500, payment:0, account:"" },
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:500, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:100, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:100, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"Family Vacation", target:6000, contribution:100, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:100, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"Summer Camp", target:2000, contribution:100, currentBalance:366.97, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:114.77, account:"Truliant Business" }
          ],
          summary: { startingBalance:838.44, totalIncome:10507.56, totalExpenses:10244.37, debtPayments:0, savingsContributions:1000, netCashFlow:-736.81, endingBalance:-1575.25 }
        },
        "June": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "July": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "August": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:4063.38, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3298.76, actual:3698.66, account:"Truliant Savings", purpose:"Savings" },
            { source:"Dejzah.life/Content", expected:0, actual:65.40, account:"Truliant Business", purpose:"Business" },
            { source:"Gifts", expected:0, actual:234.00, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:70.01, actual:227.80, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:87.94, actual:87.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:180.67, actual:225.21, account:"Capital One", dueDate:"3rd" },
            { category:"Utilities", budget:220, actual:336.20, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:212.48, account:"Truliant Business", dueDate:"13th" },
            { category:"Car Payment", budget:438, actual:404.33, account:"Capital One", dueDate:"15th" },
            { category:"Instacart+", budget:8.25, actual:105.93, account:"Capital One", dueDate:"16th (annual)" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1350, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:680, account:"Citi" },
            { category:"Gas", budget:100, actual:95, account:"Capital One" }
          ],
          debt: [
            { category:"Car Loan", balance:4500, payment:0, account:"" },
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:0, currentBalance:366.97, account:"Truliant Savings" }
          ],
          summary: { startingBalance:0, totalIncome:8061.44, totalExpenses:8066, debtPayments:0, savingsContributions:0, netCashFlow:-4.56, endingBalance:0 }
        },
        "September": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:1510.85, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3298.76, actual:2178.70, account:"Truliant Savings", purpose:"Savings" },
            { source:"Gifts", expected:0, actual:156.00, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.07, actual:71.07, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Utilities", budget:220, actual:372.16, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:246.01, account:"Truliant Business", dueDate:"13th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Zips Car Wash", budget:20, actual:20, account:"Capital One", dueDate:"30th" },
            { category:"Dejah Allowance", budget:200, actual:200, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1639.33, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:459.47, account:"Citi" },
            { category:"Gas", budget:100, actual:41.99, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:33.80, account:"Citi" },
            { category:"Household Shopping", budget:100, actual:565.26, account:"Capital One" },
            { category:"Personal Care", budget:100, actual:157.83, account:"Capital One" },
            { category:"Medical / Health", budget:160, actual:286.18, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:0, actual:31.80, account:"Capital One" },
            { category:"Baby", budget:0, actual:54.00, account:"Capital One" },
            { category:"Citi Payment", budget:1000, actual:100, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:521.26, account:"Truliant Business" }
          ],
          debt: [
            { category:"Car Loan", balance:4500, payment:0, account:"" },
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:500, currentBalance:52.11, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:100, currentBalance:52.11, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:100, currentBalance:52.11, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:100, currentBalance:52.11, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:8.23, account:"Truliant Business" }
          ],
          summary: { startingBalance:3402.99, totalIncome:3845.55, totalExpenses:7284.13, debtPayments:0, savingsContributions:216.67, netCashFlow:-3655.25, endingBalance:-252.26 }
        },
        "October": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:1716.42, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3098.78, actual:5278.36, account:"Truliant Savings", purpose:"Savings" },
            { source:"PlanNet", expected:0, actual:375, account:"", purpose:"Other" },
            { source:"401K", expected:0, actual:6702.47, account:"", purpose:"Other" },
            { source:"Gifts", expected:0, actual:1450, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:173.79, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:194.73, actual:194.73, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:309.07, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:4500, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:23.19, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:60.90, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:230.35, account:"Truliant Business", dueDate:"13th" },
            { category:"LA Fitness", budget:65, actual:247.96, account:"House of Yawitazah Cash App", dueDate:"17th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Dejah Allowance", budget:200, actual:100, account:"Capital One", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1284.76, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:611.28, account:"Citi" },
            { category:"Gas", budget:100, actual:44.83, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:738.87, account:"Citi" },
            { category:"Clothes Shopping", budget:200, actual:85.02, account:"Citi" },
            { category:"Personal Care", budget:100, actual:121.92, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:100, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:0, actual:81.22, account:"Capital One" },
            { category:"Baby", budget:100, actual:141.29, account:"Capital One" },
            { category:"Charity", budget:50, actual:182.85, account:"Capital One" },
            { category:"Travel", budget:0, actual:104, account:"Citi" },
            { category:"Citi Payment", budget:1000, actual:500, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:739.39, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:150, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:50, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:255, account:"Truliant Business" }
          ],
          summary: { startingBalance:3807.35, totalIncome:15522.25, totalExpenses:10801.25, debtPayments:0, savingsContributions:300, netCashFlow:4421.00, endingBalance:613.65 }
        },
        "November": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:0, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3098.78, actual:3451.70, account:"Truliant Savings", purpose:"Savings" },
            { source:"PlanNet", expected:0, actual:141, account:"", purpose:"Other" },
            { source:"Gifts", expected:0, actual:316, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:189.49, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:194.73, actual:194.73, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:20, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:271.80, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"Wix: Dejahwhite", budget:28.92, actual:372.36, account:"Truliant Business", dueDate:"9th (annual)" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.85, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:230.34, account:"Truliant Business", dueDate:"13th" },
            { category:"LA Fitness", budget:65, actual:64.98, account:"House of Yawitazah Cash App", dueDate:"17th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Dejah Allowance", budget:100, actual:50, account:"Capital One", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1285.51, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:734.67, account:"Citi" },
            { category:"Gas", budget:100, actual:44.84, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:15, actual:52.10, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:200.70, account:"Citi" },
            { category:"Household Shopping", budget:100, actual:284.02, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:355.70, account:"Citi" },
            { category:"Personal Care", budget:100, actual:214.59, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:157.42, account:"Capital One" },
            { category:"Baby", budget:100, actual:37.40, account:"Capital One" },
            { category:"Gifts", budget:50, actual:20, account:"Capital One" },
            { category:"Charity", budget:50, actual:20, account:"Capital One" },
            { category:"Travel", budget:0, actual:450.23, account:"Citi" },
            { category:"Citi Payment", budget:1000, actual:211.81, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:368.59, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:0, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:0, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:255, account:"Truliant Business" }
          ],
          summary: { startingBalance:5057.95, totalIncome:3908.70, totalExpenses:6118.01, debtPayments:0, savingsContributions:0, netCashFlow:-2209.31, endingBalance:2848.64 }
        },
        "December": {
          income: [
            { source:"Zah Brand Solutions", expected:4000, actual:1727.95, account:"Capital One", purpose:"Household" },
            { source:"BBB Salary", expected:3098.78, actual:6085.92, account:"Truliant Savings", purpose:"Savings" },
            { source:"Dejzah.life/Content", expected:0, actual:224, account:"Truliant Business", purpose:"Business" },
            { source:"Gifts", expected:0, actual:124, account:"Citi", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:99.88, account:"Capital One", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:127.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Car Insurance", budget:194.73, actual:194.73, account:"Capital One", dueDate:"3rd" },
            { category:"Gamma", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:220, actual:260.68, account:"Capital One", dueDate:"5th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:4410, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Business", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.98, account:"Truliant Business", dueDate:"12th" },
            { category:"Phones", budget:250, actual:230.34, account:"Truliant Business", dueDate:"13th" },
            { category:"LA Fitness", budget:65, actual:64.98, account:"House of Yawitazah Cash App", dueDate:"17th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Dejah Allowance", budget:100, actual:100, account:"Capital One", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1500, actual:1479.30, account:"Capital One" },
            { category:"Eating Out", budget:500, actual:437.68, account:"Citi" },
            { category:"Gas", budget:100, actual:69.96, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:98.12, account:"Citi" },
            { category:"Household Shopping", budget:100, actual:60.39, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:75.06, account:"Citi" },
            { category:"Personal Care", budget:100, actual:3.89, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:140.24, account:"Capital One" },
            { category:"Baby", budget:100, actual:206.42, account:"Capital One" },
            { category:"Gifts", budget:50, actual:36.36, account:"Capital One" },
            { category:"Charity", budget:50, actual:50, account:"Capital One" },
            { category:"Citi Payment", budget:1000, actual:200, account:"Capital One" },
            { category:"Misc Business Expenses", budget:0, actual:567.06, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Direct Subsidized Loan", balance:4724.40, interestRate:4.45, payment:0, account:"" },
            { category:"Dejah Direct Unsubsidized Loan", balance:18385.76, interestRate:6.54, payment:0, account:"" },
            { category:"Dejah Medical Bills", balance:150, payment:0, account:"" }
          ],
          savings: [
            { goal:"New Home Fund", target:60000, contribution:25, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"New Car Fund", target:10000, contribution:25, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Honeymoon", target:10000, contribution:25, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Emergency Fund", target:10000, contribution:25, currentBalance:83.65, account:"Truliant Savings" },
            { goal:"Investments", target:0, contribution:0, currentBalance:255, account:"Truliant Business" }
          ],
          summary: { startingBalance:2744.73, totalIncome:8161.87, totalExpenses:9121.94, debtPayments:0, savingsContributions:100, netCashFlow:-1060.07, endingBalance:1684.66 }
        }
      }
    },
    "2026": {
      annualTotals: null,
      months: {
        "January": {
          income: [
            { source:"Zah Brand Solutions", expected:5000, actual:340.45, account:"Truliant Business", purpose:"Household" },
            { source:"BBB Salary", expected:3098.78, actual:3457.37, account:"Capital One", purpose:"Savings" },
            { source:"Content/Freelance", expected:100, actual:475, account:"Truliant Business", purpose:"Business" },
            { source:"Dejzah.Life", expected:12, actual:0, account:"Truliant Business", purpose:"Business" },
            { source:"PlanNet", expected:100, actual:127.90, account:"Truliant Business", purpose:"Other" },
            { source:"Gifts", expected:0, actual:625, account:"House of Yawitazah Cash App", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:174.04, account:"Citi", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Suno", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:250, actual:347.84, account:"Citi", dueDate:"5th" },
            { category:"ElevenLabs", budget:23.54, actual:23.54, account:"Truliant Business", dueDate:"5th" },
            { category:"CapCut", budget:21.19, actual:21.19, account:"Truliant Business", dueDate:"6th" },
            { category:"Adobe", budget:19.99, actual:19.99, account:"Truliant Business", dueDate:"7th" },
            { category:"GoDaddy", budget:5.93, actual:71.18, account:"Truliant Business", dueDate:"7th (annual)" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"Wix: Dejahwhite", budget:28.92, actual:28.92, account:"Truliant Business", dueDate:"9th" },
            { category:"Prime Video", budget:3.20, actual:3.20, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:0, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Checking", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.98, account:"Truliant Business", dueDate:"12th" },
            { category:"ATT", budget:230.34, actual:229.43, account:"Truliant Business", dueDate:"13th" },
            { category:"Google One", budget:10.59, actual:12.72, account:"Truliant Business", dueDate:"14th" },
            { category:"Gamma", budget:20, actual:20, account:"Truliant Business", dueDate:"15th" },
            { category:"Instacart+", budget:8.83, actual:8.83, account:"Truliant Business", dueDate:"16th" },
            { category:"LA Fitness", budget:64.98, actual:64.98, account:"Citi", dueDate:"17th" },
            { category:"Nelnet", budget:171.22, actual:171.22, account:"PNC", dueDate:"18th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Higgsfield", budget:29, actual:49, account:"Truliant Business", dueDate:"19th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Car Insurance", budget:194.73, actual:194.73, account:"Citi", dueDate:"26th" },
            { category:"Renters Insurance", budget:19.55, actual:0, account:"PNC", dueDate:"" },
            { category:"Dejah Allowance", budget:100, actual:100, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1400, actual:1457.49, account:"Capital One" },
            { category:"Eating Out", budget:600, actual:431, account:"Capital One" },
            { category:"Gas", budget:100, actual:34.93, account:"Capital One" },
            { category:"Household Shopping", budget:100, actual:706.78, account:"Capital One" },
            { category:"Personal Care", budget:100, actual:96.59, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:75, actual:21.38, account:"Capital One" },
            { category:"Baby", budget:75, actual:176.62, account:"Capital One" },
            { category:"Gifts", budget:50, actual:45.45, account:"Capital One" },
            { category:"Travel", budget:0, actual:667.95, account:"Citi" },
            { category:"Misc Business Expenses", budget:100, actual:110.78, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" },
            { category:"Citi Bank", balance:1895.08, payment:868.88, account:"Capital One" }
          ],
          savings: [
            { goal:"Emergency Fund", target:1000, contribution:50, currentBalance:228.51, account:"Truliant Savings" }
          ],
          summary: { startingBalance:1299.70, totalIncome:5025.72, totalExpenses:5596.63, debtPayments:1040.10, savingsContributions:50, netCashFlow:-1661.01, endingBalance:-361.31 }
        },
        "February": {
          income: [
            { source:"Zah Brand Solutions", expected:5000, actual:1120, account:"Truliant Business", purpose:"Household" },
            { source:"BBB Salary", expected:4058.74, actual:4058.73, account:"Capital One", purpose:"Savings" },
            { source:"Content/Freelance", expected:100, actual:200, account:"Truliant Business", purpose:"Business" },
            { source:"Dejzah.Life", expected:12, actual:0, account:"Truliant Business", purpose:"Business" },
            { source:"PlanNet", expected:100, actual:88, account:"Truliant Business", purpose:"Other" },
            { source:"Gifts", expected:0, actual:880, account:"House of Yawitazah Cash App", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:122.54, account:"Citi", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:99.41, account:"Truliant Business", dueDate:"2nd" },
            { category:"Suno", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:250, actual:305.24, account:"Citi", dueDate:"5th" },
            { category:"ElevenLabs", budget:23.54, actual:23.54, account:"Truliant Business", dueDate:"5th" },
            { category:"CapCut", budget:21.19, actual:21.19, account:"Truliant Business", dueDate:"6th" },
            { category:"Adobe", budget:19.99, actual:19.99, account:"Truliant Business", dueDate:"7th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"Prime Video", budget:3.20, actual:3.20, account:"Truliant Business", dueDate:"9th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Amazon Prime", budget:16.04, actual:16.04, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.98, account:"Truliant Business", dueDate:"12th" },
            { category:"ATT", budget:230.34, actual:301.99, account:"Truliant Business", dueDate:"13th" },
            { category:"Google One", budget:10.59, actual:12.72, account:"Truliant Business", dueDate:"14th" },
            { category:"Gamma", budget:20, actual:20, account:"Truliant Business", dueDate:"15th" },
            { category:"LA Fitness", budget:64.98, actual:64.98, account:"Citi", dueDate:"17th" },
            { category:"Nelnet", budget:171.22, actual:171.22, account:"PNC", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Higgsfield", budget:29, actual:49, account:"Truliant Business", dueDate:"19th" },
            { category:"Car Insurance", budget:194.73, actual:0, account:"Citi", dueDate:"26th" },
            { category:"Doordash DashPass", budget:5.26, actual:5.26, account:"Truliant Business", dueDate:"29th (annual)" },
            { category:"Dejah Allowance", budget:100, actual:50, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1400, actual:1060.45, account:"Capital One" },
            { category:"Eating Out", budget:600, actual:498.65, account:"Capital One" },
            { category:"Gas", budget:100, actual:58.72, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:20, actual:2.25, account:"Capital One" },
            { category:"Household Shopping", budget:100, actual:33.47, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:111.38, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:174.66, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:75, actual:209.99, account:"Capital One" },
            { category:"Gifts", budget:50, actual:30, account:"Capital One" },
            { category:"Misc Business Expenses", budget:100, actual:270.20, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" }
          ],
          savings: [
            { goal:"Emergency Fund", target:1000, contribution:0, currentBalance:153.67, account:"Truliant Savings" }
          ],
          summary: { startingBalance:512.28, totalIncome:6346.73, totalExpenses:6115.49, debtPayments:171.22, savingsContributions:0, netCashFlow:60.02, endingBalance:572.30 }
        },
        "March": {
          income: [
            { source:"Zah Brand Solutions", expected:5000, actual:840.45, account:"Truliant Business", purpose:"Household" },
            { source:"BBB Salary", expected:4058.74, actual:4058.74, account:"Capital One", purpose:"Savings" },
            { source:"Content/Freelance", expected:100, actual:100, account:"Truliant Business", purpose:"Business" },
            { source:"Dejzah.Life", expected:12, actual:19.12, account:"Truliant Business", purpose:"Business" },
            { source:"PlanNet", expected:100, actual:45.90, account:"Truliant Business", purpose:"Other" },
            { source:"Gifts", expected:0, actual:84.92, account:"House of Yawitazah Cash App", purpose:"Other" },
            { source:"Tax Refund", expected:0, actual:5328.10, account:"Truliant Checking", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:71.04, account:"Citi", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:127.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Suno", budget:10, actual:10, account:"Truliant Business", dueDate:"4th" },
            { category:"Utilities", budget:250, actual:464.40, account:"Citi", dueDate:"5th" },
            { category:"ElevenLabs", budget:23.54, actual:23.54, account:"Truliant Business", dueDate:"5th" },
            { category:"CapCut", budget:21.19, actual:21.19, account:"Truliant Business", dueDate:"6th" },
            { category:"Adobe", budget:19.99, actual:19.99, account:"Truliant Business", dueDate:"7th" },
            { category:"Canva", budget:15.90, actual:15.90, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:13.90, account:"Truliant Checking", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:32.01, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.98, account:"Truliant Business", dueDate:"12th" },
            { category:"ATT", budget:165.07, actual:165.98, account:"Truliant Business", dueDate:"13th" },
            { category:"Google One", budget:10.59, actual:12.72, account:"Truliant Business", dueDate:"14th" },
            { category:"Gamma", budget:20, actual:20, account:"Truliant Business", dueDate:"15th" },
            { category:"LA Fitness", budget:64.98, actual:0, account:"Citi", dueDate:"17th" },
            { category:"Nelnet", budget:171.22, actual:0, account:"PNC", dueDate:"18th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Higgsfield", budget:29, actual:15, account:"Truliant Business", dueDate:"19th" },
            { category:"Apple", budget:9.99, actual:19.98, account:"Truliant Business", dueDate:"25th" },
            { category:"Car Insurance", budget:118.33, actual:0, account:"Citi", dueDate:"26th" },
            { category:"Renters Insurance", budget:19.55, actual:35.12, account:"PNC", dueDate:"" },
            { category:"Dejah Allowance", budget:100, actual:100, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1400, actual:1726.24, account:"Capital One" },
            { category:"Eating Out", budget:600, actual:569.89, account:"Capital One" },
            { category:"Gas", budget:100, actual:210.44, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:20, actual:68.81, account:"Capital One" },
            { category:"Household Shopping", budget:100, actual:717.74, account:"Capital One" },
            { category:"Clothes Shopping", budget:200, actual:388.11, account:"Capital One" },
            { category:"Personal Care", budget:100, actual:326.64, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:481.44, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:75, actual:201.19, account:"Capital One" },
            { category:"Baby", budget:75, actual:299.22, account:"Capital One" },
            { category:"Gifts", budget:50, actual:176.67, account:"Capital One" },
            { category:"Misc Business Expenses", budget:100, actual:314.25, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" },
            { category:"Citi Bank", balance:2270.21, payment:400, account:"Capital One" }
          ],
          savings: [
            { goal:"Emergency Fund", target:1000, contribution:0, currentBalance:153.67, account:"Truliant Savings" }
          ],
          summary: { startingBalance:349.80, totalIncome:10477.23, totalExpenses:9043.50, debtPayments:571.22, savingsContributions:0, netCashFlow:862.51, endingBalance:1212.31 }
        },
        "April": {
          income: [
            { source:"Zah Brand Solutions", expected:5000, actual:130, account:"Truliant Business", purpose:"Household" },
            { source:"BBB Salary", expected:4058.74, actual:6088.11, account:"Capital One", purpose:"Savings" },
            { source:"PlanNet", expected:100, actual:114.90, account:"Truliant Business", purpose:"Other" },
            { source:"Gifts", expected:0, actual:450, account:"House of Yawitazah Cash App", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:71.04, account:"Citi", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Utilities", budget:250, actual:334.19, account:"Citi", dueDate:"5th" },
            { category:"ElevenLabs", budget:23.54, actual:23.54, account:"Truliant Business", dueDate:"5th" },
            { category:"CapCut", budget:21.19, actual:19.99, account:"Truliant Business", dueDate:"6th" },
            { category:"Canva", budget:15.90, actual:0, account:"Truliant Business", dueDate:"9th" },
            { category:"ChatGPT", budget:21.40, actual:0, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Spotify", budget:12.83, actual:12.83, account:"Truliant Checking", dueDate:"11th" },
            { category:"Amazon Prime", budget:16.04, actual:9.62, account:"Truliant Business", dueDate:"12th" },
            { category:"PlanNet Subscription", budget:64.98, actual:64.98, account:"Truliant Business", dueDate:"12th" },
            { category:"ATT", budget:165.07, actual:213.58, account:"Truliant Business", dueDate:"13th" },
            { category:"LA Fitness", budget:64.98, actual:64.98, account:"Citi", dueDate:"17th" },
            { category:"Nelnet", budget:171.22, actual:0, account:"PNC", dueDate:"18th" },
            { category:"Netflix", budget:19.25, actual:19.25, account:"Truliant Business", dueDate:"18th" },
            { category:"Wix: HOY", budget:38.52, actual:38.52, account:"Truliant Business", dueDate:"18th" },
            { category:"Apple", budget:9.99, actual:9.99, account:"Truliant Business", dueDate:"25th" },
            { category:"Car Insurance", budget:118.33, actual:118.33, account:"Citi", dueDate:"26th" },
            { category:"Dejah Allowance", budget:100, actual:50, account:"Truliant Checking", dueDate:"" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1400, actual:1027.37, account:"Capital One" },
            { category:"Eating Out", budget:600, actual:578.79, account:"Capital One" },
            { category:"Gas", budget:100, actual:179.71, account:"Capital One" },
            { category:"Auto / Car Maintenance", budget:20, actual:5.61, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:271.32, account:"Capital One" },
            { category:"Household Shopping", budget:100, actual:192.80, account:"Capital One" },
            { category:"Personal Care", budget:100, actual:223.47, account:"Capital One" },
            { category:"Medical / Health", budget:200, actual:40, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:75, actual:153.44, account:"Capital One" },
            { category:"Baby", budget:75, actual:26.72, account:"Capital One" },
            { category:"Gifts", budget:50, actual:66.22, account:"Capital One" },
            { category:"Misc Business Expenses", budget:100, actual:618.07, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" }
          ],
          savings: [
            { goal:"Emergency Fund", target:1000, contribution:0, currentBalance:153.67, account:"Truliant Savings" }
          ],
          summary: { startingBalance:1212.31, totalIncome:6783.01, totalExpenses:6782.30, debtPayments:171.22, savingsContributions:0, netCashFlow:-170.51, endingBalance:-170.51 }
        },
        "May": {
          income: [
            { source:"Zah Brand Solutions", expected:5000, actual:0, account:"Truliant Business", purpose:"Household" },
            { source:"BBB Salary", expected:4058.74, actual:0, account:"Capital One", purpose:"Savings" },
            { source:"Content/Freelance", expected:100, actual:0, account:"Truliant Business", purpose:"Business" },
            { source:"Dejzah.Life", expected:12, actual:0, account:"Truliant Business", purpose:"Business" },
            { source:"PlanNet", expected:100, actual:46.90, account:"Truliant Business", purpose:"Other" },
            { source:"Gifts", expected:0, actual:2400, account:"House of Yawitazah Cash App", purpose:"Other" },
            { source:"Refunds", expected:0, actual:213.37, account:"Truliant Checking", purpose:"Other" }
          ],
          fixedExpenses: [
            { category:"Dance", budget:71.04, actual:87.04, account:"Citi", dueDate:"1st" },
            { category:"Wifi", budget:97.94, actual:97.94, account:"Truliant Business", dueDate:"2nd" },
            { category:"Utilities", budget:250, actual:276.36, account:"Citi", dueDate:"5th" },
            { category:"ChatGPT", budget:21.40, actual:21.40, account:"Truliant Business", dueDate:"10th" },
            { category:"Rent", budget:2250, actual:2250, account:"Capital One", dueDate:"10th" },
            { category:"Higgsfield", budget:29, actual:15, account:"Truliant Business", dueDate:"19th" }
          ],
          variableExpenses: [
            { category:"Groceries", budget:1400, actual:379.19, account:"Capital One" },
            { category:"Eating Out", budget:600, actual:160.07, account:"Capital One" },
            { category:"Gas", budget:100, actual:60.31, account:"Capital One" },
            { category:"Entertainment / Date", budget:150, actual:86.08, account:"Capital One" },
            { category:"School / Extra-Curricular", budget:75, actual:16.03, account:"Capital One" },
            { category:"Misc Business Expenses", budget:100, actual:34.59, account:"Truliant Business" }
          ],
          debt: [
            { category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" }
          ],
          savings: [
            { goal:"Emergency Fund", target:1000, contribution:0, currentBalance:153.67, account:"Truliant Savings" }
          ],
          summary: { startingBalance:-170.51, totalIncome:2660.27, totalExpenses:3484.01, debtPayments:171.22, savingsContributions:0, netCashFlow:-994.96, endingBalance:-994.96 }
        },
        "June": { income:[], fixedExpenses:[], variableExpenses:[], debt:[{ category:"Dejah Student Loans", balance:24389.80, payment:171.22, account:"PNC" }], savings:[{ goal:"Emergency Fund", target:1000, contribution:0, currentBalance:153.67, account:"Truliant Savings" }], summary:{ startingBalance:-994.96, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "July": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "August": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "September": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "October": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "November": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } },
        "December": { income:[], fixedExpenses:[], variableExpenses:[], debt:[], savings:[], summary:{ startingBalance:0, totalIncome:0, totalExpenses:0, debtPayments:0, savingsContributions:0, netCashFlow:0, endingBalance:0 } }
      }
    }
  }
};
