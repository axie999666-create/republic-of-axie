(() => {
  const BASE_GREGORIAN_YEAR = 2024;
  const monthDays = (year, month) => {
    if (month === 2) {
      const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      return leap ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(month) ? 30 : 31;
  };

  function gregorianYear(date) {
    return date.era === "before"
      ? BASE_GREGORIAN_YEAR - date.year
      : BASE_GREGORIAN_YEAR + date.year - 1;
  }

  function format(date) {
    if (!date || !Number.isInteger(Number(date.year))) return "未填写";
    const year = Number(date.year);
    const yearText = date.era === "before"
      ? `阿谢纪年前${year === 1 ? "一年" : `${year}年`}`
      : `阿谢${year === 1 ? "元年" : `${year}年`}`;
    return `${yearText}${Number(date.month)}月${Number(date.day)}日`;
  }

  function isValid(date) {
    if (!date || !["axie", "before"].includes(date.era)) return false;
    const year = Number(date.year);
    const month = Number(date.month);
    const day = Number(date.day);
    if (!Number.isInteger(year) || year < 1 || year > 9999) return false;
    if (!Number.isInteger(month) || month < 1 || month > 12) return false;
    const translatedYear = gregorianYear({ era: date.era, year });
    if (!Number.isInteger(day) || day < 1 || day > monthDays(translatedYear, month)) return false;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const birthYear = translatedYear;
    if (birthYear > currentYear) return false;
    if (birthYear === currentYear && (month > currentMonth || (month === currentMonth && day > currentDay))) return false;
    return true;
  }

  function populate(monthSelect, daySelect) {
    if (!monthSelect.options.length) {
      monthSelect.add(new Option("月份", ""));
      for (let month = 1; month <= 12; month += 1) monthSelect.add(new Option(`${month}月`, String(month)));
    }
    if (!daySelect.options.length) {
      daySelect.add(new Option("日期", ""));
      for (let day = 1; day <= 31; day += 1) daySelect.add(new Option(`${day}日`, String(day)));
    }
  }

  function read(eraSelect, yearInput, monthSelect, daySelect) {
    return {
      era: eraSelect.value,
      year: Number(yearInput.value),
      month: Number(monthSelect.value),
      day: Number(daySelect.value),
    };
  }

  function write(date, eraSelect, yearInput, monthSelect, daySelect) {
    const value = date || { era: "axie", year: "", month: "", day: "" };
    eraSelect.value = value.era || "axie";
    yearInput.value = value.year ? String(value.year) : "";
    monthSelect.value = value.month ? String(value.month) : "";
    daySelect.value = value.day ? String(value.day) : "";
  }

  window.AxieEraCalendar = { BASE_GREGORIAN_YEAR, format, isValid, populate, read, write };
})();
