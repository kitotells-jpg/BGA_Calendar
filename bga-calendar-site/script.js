// BGA Calendar: live countdowns, in English or Georgian.
// All dates come from calendar.json. Everything is worked out in Georgia time (UTC+4, no daylight saving),
// so a visitor's own phone timezone never changes the answers.

(function () {
  "use strict";

  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var TIME_RE = /^\d{2}:\d{2}$/;
  var OFFSET_RE = /^[+-]\d{2}:\d{2}$/;
  var SAVED_KEY = "bga-calendar-json";
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- Words (English and Georgian) ----------

  function kaOrdinal(n) { return n === 1 ? "1-ლი" : "მე-" + n; }

  var WORDS = {
    en: {
      dow: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      dowShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      month: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      mon: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      abbr: { d: "d", h: "h", m: "m", s: "s" },
      longDate: function (dw, d, mo, y) { return dw + " " + d + " " + mo + " " + y; },
      shortDate: function (dw, d, mo) { return dw + " " + d + " " + mo; },

      wordmark: "School Calendar",
      loading: "Loading…",
      langButton: "ქარ",
      langLabel: "ქართულად",
      toLight: "Switch to light mode",
      toDark: "Switch to dark mode",
      madeBy: "Made by",
      uDays: "days", uHours: "hours", uMin: "min", uSec: "sec",
      schoolStartsIn: function (v) { return "School starts in " + v.t; },
      lessonsToday: function (v) { return "Lessons today from " + v.s + " to " + v.e; },
      finalBellIn: function (v) { return "Final bell in " + v.t; },
      todayDone: function (v) { return v.pct + "% of today done · bell at " + v.e; },
      schoolOut: "School's out for today 🎉",
      noSchoolName: function (v) { return "No school: " + v.name; },
      weekend: "It's the weekend 😎",
      noSchool: "No school today",
      backWhen: function (v) { return "Back " + v.when + " at " + v.s + " · in " + v.left; },
      tomorrowLower: "tomorrow",
      enjoySummer: "Enjoy the summer!",
      heroTitle: "Until summer",
      heroDone: "Summer is here",
      schoolYear: function (v) { return "School year " + v.y; },
      termWeek: function (v) { return v.term + ", week " + v.w; },
      progress: function (v) { return v.pct + "% of the year done · " + v.n + " school day" + (v.n === 1 ? "" : "s") + " left"; },
      yearOver: function (v) { return "The " + v.y + " school year is over. Enjoy the break!"; },
      nextDayOff: "Next day off",
      nextEvent: "Next event",
      backToSchoolIn: "Back to school in",
      days: function (v) { return v.n === 1 ? "day" : "days"; },
      today: "Today",
      noMoreHolidays: "No more holidays this year",
      noMoreEvents: "No more events this year",
      youreOn: function (v) { return "You're on " + v.name + " 🎉"; },
      breakStarted: function (v) { return v.name + " 🎉"; },
      startsBack: function (v) { return "Starts " + v.start + " · back " + v.back + " at " + v.s; },
      back: function (v) { return "Back " + v.back + " at " + v.s; },
      enjoyBreak: "Enjoy the break!",
      fromDate: function (v) { return "From " + v.date; },
      fromDateLower: function (v) { return "from " + v.date; },
      nDays: function (v) { return v.n + " days"; },
      atTime: function (v) { return "at " + v.time; },
      dateAtTime: function (v) { return v.date + " at " + v.time; },
      comingUp: "Coming up",
      tagHoliday: "Holiday", tagDayOff: "Day off", tagTerm: "Term", tagEvent: "Event",
      whenTomorrow: "Tomorrow",
      inDays: function (v) { return "In " + v.n + " days"; },
      nothingLeft: "Nothing left this school year. See you in September!",
      calendar: "Calendar",
      prevMonth: "Previous month", nextMonth: "Next month",
      keyToday: "Today", keyOff: "No school", keyPublic: "Public holiday", keyEvent: "Event",
      chipSchool: function (v) { return "School day · " + v.s + "–" + v.e; },
      chipPublic: "Public holiday",
      chipOff: "No school",
      chipWeekend: "Weekend",
      todayPrefix: "Today, ", tomorrowPrefix: "Tomorrow, ",
      share: "Share",
      shareText: "How long until the bell, the next holiday and summer at BGA",
      copied: "Link copied. Paste it in your class chat!",
      copyThis: function (v) { return "Copy this link: " + v.url; },
      homeTitle: "Add to your home screen",
      homeIos: "iPhone (Safari): tap Share, then Add to Home Screen.",
      homeAndroid: "Android (Chrome): tap ⋮, then Add to Home screen.",
      source: "Dates from the official BGA 2026–27 school calendar. Georgia time (UTC+4).",
      updated: function (v) { return "Updated " + v.date + "."; },
      offline: "Offline: showing saved dates.",
      loadFail: "Couldn't load the dates.",
      checkConn: "Check your connection and refresh the page.",
      openSite: "Open the published website instead of the file on your computer.",
      typo: function (v) { return "calendar.json has a typo: " + v.msg; }
    },
    ka: {
      dow: ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"],
      dowShort: ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"],
      month: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
      mon: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
      abbr: { d: " დღე", h: " სთ", m: " წთ", s: " წმ" },
      monFrom: ["იანვრიდან", "თებერვლიდან", "მარტიდან", "აპრილიდან", "მაისიდან", "ივნისიდან", "ივლისიდან", "აგვისტოდან", "სექტემბრიდან", "ოქტომბრიდან", "ნოემბრიდან", "დეკემბრიდან"],
      longDate: function (dw, d, mo, y) { return dw + ", " + d + " " + mo + ", " + y; },
      shortDate: function (dw, d, mo) { return dw + ", " + d + " " + mo; },

      wordmark: "სასკოლო კალენდარი",
      loading: "იტვირთება…",
      langButton: "EN",
      langLabel: "Switch to English",
      toLight: "ღია თემაზე გადართვა",
      toDark: "მუქ თემაზე გადართვა",
      madeBy: "ავტორი:",
      uDays: "დღე", uHours: "საათი", uMin: "წუთი", uSec: "წამი",
      schoolStartsIn: function (v) { return "პირველ ზარამდე " + v.t; },
      lessonsToday: function (v) { return "დღეს გაკვეთილები " + v.s + "-დან " + v.e + "-მდეა"; },
      finalBellIn: function (v) { return "ბოლო ზარამდე " + v.t; },
      todayDone: function (v) { return "დღის " + v.pct + "% გავიდა · ბოლო ზარი " + v.e + "-ზე"; },
      schoolOut: "დღევანდელი გაკვეთილები დასრულდა 🎉",
      noSchoolName: function (v) { return "სწავლა არ არის · " + v.name; },
      weekend: "შაბათ-კვირაა 😎",
      noSchool: "დღეს სწავლა არ არის",
      backWhen: function (v) { return "სკოლა: " + v.when + ", " + v.s + " · დარჩა " + v.left; },
      tomorrowLower: "ხვალ",
      enjoySummer: "კარგ ზაფხულს!",
      heroTitle: "ზაფხულამდე",
      heroDone: "ზაფხული დადგა",
      schoolYear: function (v) { return "სასწავლო წელი " + v.y; },
      termWeek: function (v) { return v.term + ", " + kaOrdinal(v.w) + " კვირა"; },
      progress: function (v) { return "წლის " + v.pct + "% გავიდა · დარჩა " + v.n + " სასწავლო დღე"; },
      yearOver: function (v) { return v.y + " სასწავლო წელი დასრულდა. კარგ დასვენებას!"; },
      nextDayOff: "შემდეგი დასვენება",
      nextEvent: "შემდეგი ღონისძიება",
      backToSchoolIn: "სკოლამდე დარჩა",
      days: function () { return "დღე"; },
      today: "დღეს",
      noMoreHolidays: "ამ სასწავლო წელს დასვენება აღარაა",
      noMoreEvents: "ამ სასწავლო წელს ღონისძიება აღარაა",
      youreOn: function (v) { return v.name + " 🎉"; },
      breakStarted: function (v) { return v.name + " 🎉"; },
      startsBack: function (v) { return "იწყება: " + v.start + " · დაბრუნება: " + v.back + ", " + v.s; },
      back: function (v) { return "დაბრუნება: " + v.back + ", " + v.s; },
      enjoyBreak: "კარგ დასვენებას!",
      fromDate: function (v) { return v.ka; },
      fromDateLower: function (v) { return v.ka; },
      nDays: function (v) { return v.n + " დღე"; },
      atTime: function (v) { return v.time + "-ზე"; },
      dateAtTime: function (v) { return v.date + ", " + v.time; },
      comingUp: "წინ გველის",
      tagHoliday: "არდადეგები", tagDayOff: "უქმე დღე", tagTerm: "სემესტრი", tagEvent: "ღონისძიება",
      whenTomorrow: "ხვალ",
      inDays: function (v) { return v.n + " დღეში"; },
      nothingLeft: "ამ სასწავლო წელს მეტი აღარაფერია. შევხვდებით სექტემბერში!",
      calendar: "კალენდარი",
      prevMonth: "წინა თვე", nextMonth: "შემდეგი თვე",
      keyToday: "დღეს", keyOff: "სწავლა არ არის", keyPublic: "უქმე დღე", keyEvent: "ღონისძიება",
      chipSchool: function (v) { return "სასწავლო დღე · " + v.s + "–" + v.e; },
      chipPublic: "უქმე დღე",
      chipOff: "სწავლა არ არის",
      chipWeekend: "შაბათ-კვირა",
      todayPrefix: "დღეს, ", tomorrowPrefix: "ხვალ, ",
      share: "გაზიარება",
      shareText: "რამდენი დარჩა ზარამდე, დასვენებამდე და ზაფხულამდე BGA-ში",
      copied: "ბმული დაკოპირდა. ჩასვი კლასის ჩატში!",
      copyThis: function (v) { return "დააკოპირე ბმული: " + v.url; },
      homeTitle: "დაამატე მთავარ ეკრანზე",
      homeIos: "iPhone (Safari): დააჭირე Share-ს, შემდეგ Add to Home Screen-ს.",
      homeAndroid: "Android (Chrome): დააჭირე ⋮-ს, შემდეგ Add to Home screen-ს.",
      source: "თარიღები აღებულია BGA-ს 2026–27 სასწავლო წლის ოფიციალური კალენდრიდან. საქართველოს დრო (UTC+4).",
      updated: function (v) { return "განახლდა: " + v.date + "."; },
      offline: "ოფლაინ რეჟიმი: ნაჩვენებია შენახული თარიღები.",
      loadFail: "თარიღები ვერ ჩაიტვირთა.",
      checkConn: "შეამოწმე ინტერნეტი და განაახლე გვერდი.",
      openSite: "გახსენი გამოქვეყნებული საიტი და არა ფაილი კომპიუტერიდან.",
      typo: function (v) { return "calendar.json-ში შეცდომაა: " + v.msg; }
    }
  };

  var lang = "en";
  function W() { return WORDS[lang]; }
  function t(key, vars) {
    var w = W()[key];
    return typeof w === "function" ? w(vars || {}) : w;
  }
  function nameOf(item) { return (lang === "ka" && item.name_ka) || item.name; }

  // ---------- Date helpers (dates are "YYYY-MM-DD" strings) ----------

  var cal = null;
  var offset = "+04:00";
  var offsetMs = 4 * 3600 * 1000;
  var usingSaved = false;

  function at(dateStr, time) {
    return new Date(dateStr + "T" + time + ":00" + offset).getTime();
  }
  function todayStr(now) {
    return new Date(now + offsetMs).toISOString().slice(0, 10);
  }
  function addDays(dateStr, n) {
    var d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function dayDiff(a, b) {
    return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
  }
  function dow(dateStr) {
    return new Date(dateStr + "T12:00:00Z").getUTCDay();
  }
  function parts(dateStr) {
    var p = dateStr.split("-");
    return { y: +p[0], m: +p[1] - 1, d: +p[2] };
  }
  function longDate(dateStr) {
    var p = parts(dateStr), w = W();
    return w.longDate(w.dow[dow(dateStr)], p.d, w.month[p.m], p.y);
  }
  function shortDate(dateStr) {
    var p = parts(dateStr), w = W();
    return w.shortDate(w.dowShort[dow(dateStr)], p.d, w.mon[p.m]);
  }
  function rangeText(start, end) {
    if (start === end) return shortDate(start);
    var a = parts(start), b = parts(end), mon = W().mon;
    if (a.m === b.m) return a.d + "–" + b.d + " " + mon[a.m];
    return a.d + " " + mon[a.m] + " – " + b.d + " " + mon[b.m];
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // "From <date>": Georgian puts the ending on the month (23 ივნისიდან).
  function fromVars(dateStr, long) {
    var p = parts(dateStr);
    return { date: long ? longDate(dateStr) : shortDate(dateStr), ka: p.d + " " + WORDS.ka.monFrom[p.m] };
  }

  // Countdowns round up, so the last second shows "01s" and zero means it has happened.
  function split(ms) {
    if (ms < 0) ms = 0;
    var s = Math.ceil(ms / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
  }
  function clock(x) { var a = W().abbr; return pad(x.h) + a.h + " " + pad(x.m) + a.m + " " + pad(x.s) + a.s; }
  function hms(ms) {
    var x = split(ms), a = W().abbr;
    return (x.h ? x.h + a.h + " " : "") + pad(x.m) + a.m + " " + pad(x.s) + a.s;
  }
  function dhm(ms) {
    var x = split(ms), a = W().abbr;
    return (x.d ? x.d + a.d + " " : "") + x.h + a.h + " " + pad(x.m) + a.m;
  }

  // ---------- Calendar rules ----------

  function holidayOn(dateStr) {
    for (var i = 0; i < cal.holidays.length; i++) {
      var h = cal.holidays[i];
      if (dateStr >= h.start && (dateStr <= h.end || h.openEnded)) return h;
    }
    return null;
  }
  function termOn(dateStr) {
    for (var i = 0; i < cal.terms.length; i++) {
      var tm = cal.terms[i];
      if (dateStr >= tm.start && dateStr <= tm.end) return tm;
    }
    return null;
  }
  function isSchoolDay(dateStr) {
    var w = dow(dateStr);
    return w !== 0 && w !== 6 && !holidayOn(dateStr) && !!termOn(dateStr);
  }
  function yearStart() { return cal.terms[0].start; }
  function yearEnd() { return cal.terms[cal.terms.length - 1].end; }

  // School weeks run Monday to Sunday, counted from the week the term starts in.
  function termMonday(tm) { return addDays(tm.start, -((dow(tm.start) + 6) % 7)); }
  function termWeek(tm, dateStr) { return Math.floor(dayDiff(termMonday(tm), dateStr) / 7) + 1; }

  function nextSchoolDay(dateStr) {
    for (var i = 0; i < 400; i++) {
      if (isSchoolDay(dateStr)) return dateStr;
      dateStr = addDays(dateStr, 1);
    }
    return null;
  }
  function lastSchoolDayBefore(dateStr) {
    var d = addDays(dateStr, -1);
    for (var i = 0; i < 60; i++) {
      if (isSchoolDay(d)) return d;
      d = addDays(d, -1);
    }
    return null;
  }

  // "start" (default) = first lesson, "end" = final bell, or an exact "HH:MM".
  function eventTime(e) {
    if (e.time === "end") return cal.schoolDay.end;
    if (TIME_RE.test(e.time || "")) return e.time;
    return cal.schoolDay.start;
  }
  function eventsOn(dateStr) {
    return cal.events.filter(function (e) { return e.confirmed !== false && e.date === dateStr; });
  }

  // The next break, or the one students are already on.
  // A break counts as started once the last bell before it has rung.
  function nextHoliday(now) {
    var today = todayStr(now);
    var h = holidayOn(today);
    if (!h) {
      for (var j = 0; j < cal.holidays.length; j++) {
        var c = cal.holidays[j];
        if (c.start <= today) continue;
        var lastBell = lastSchoolDayBefore(c.start);
        if (!lastBell) return { holiday: c, now: false, target: at(c.start, "00:00") };
        if (at(lastBell, cal.schoolDay.end) > now) {
          return { holiday: c, now: false, target: at(lastBell, cal.schoolDay.end) };
        }
        h = c;
        break;
      }
    }
    if (!h) return null;
    if (h.openEnded) return { holiday: h, now: true, back: null, target: null };
    var back = nextSchoolDay(addDays(h.end, 1));
    return { holiday: h, now: true, back: back, target: back ? at(back, cal.schoolDay.start) : null };
  }

  // The next event; an event stays "today" until the final bell on its day.
  function nextEvent(now) {
    var best = null;
    cal.events.forEach(function (e) {
      if (e.confirmed === false) return;
      var tt = at(e.date, eventTime(e));
      if (Math.max(tt, at(e.date, cal.schoolDay.end)) <= now) return;
      if (!best || tt < best.t) best = { e: e, t: tt };
    });
    return best;
  }

  // ---------- Rendering helpers ----------

  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (el && el.hasAttribute("hidden") === !!on) el.toggleAttribute("hidden", !on); }
  function replay(el, cls) {
    if (reduceMotion || !el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }
  function setText(id, text) {
    var el = $(id);
    if (el && el.textContent !== text) el.textContent = text;
  }
  // Like setText, but numbers that change get a small "tick" animation.
  function setNum(el, text) {
    if (!el || el.textContent === text) return;
    var animate = el.textContent !== "–" && el.textContent !== "";
    el.textContent = text;
    if (animate) replay(el, "tick");
  }

  // Fill a countdown tile. ms === null hides the number; ms === "today" shows "Today".
  function tileCount(prefix, ms) {
    var numEl = $(prefix + "-days"), num = numEl.parentNode, clk = $(prefix + "-clock");
    if (ms === null) { show(num, false); show(clk, false); return; }
    show(num, true);
    if (ms === "today") {
      num.classList.add("is-word");
      setNum(numEl, t("today"));
      setText(prefix + "-days-lbl", "");
      show(clk, false);
      return;
    }
    num.classList.remove("is-word");
    var x = split(ms);
    setNum(numEl, String(x.d));
    setText(prefix + "-days-lbl", t("days", { n: x.d }));
    setText(prefix + "-clock", "+ " + clock(x));
    show(clk, true);
  }

  // ---------- Today card ----------

  // ---------- Countdown 1: end of the year ----------

  function renderYear(now) {
    var startT = at(yearStart(), cal.schoolDay.start);
    var endT = at(yearEnd(), cal.schoolDay.end);
    var x = split(endT - now);
    var box = $("year-count");
    ["d", "h", "m", "s"].forEach(function (k) {
      setNum(box.querySelector('[data-part="' + k + '"]'), k === "d" ? String(x[k]) : pad(x[k]));
    });

    var today = todayStr(now);
    var over = now >= endT;
    setText("hero-title", over ? t("heroDone") : t("heroTitle"));

    var pct = Math.min(100, Math.max(0, ((now - startT) / (endT - startT)) * 100));
    $("year-bar").style.width = pct.toFixed(1) + "%";

    var left = 0;
    for (var d = today < yearStart() ? yearStart() : today; d <= yearEnd(); d = addDays(d, 1)) {
      if (!isSchoolDay(d)) continue;
      if (d === today && now >= at(d, cal.schoolDay.end)) continue;
      left++;
    }
    setText("year-progress", over ? t("yearOver", { y: cal.schoolYear }) : t("progress", { pct: Math.floor(pct), n: left }));

    var term = termOn(today), eyebrow = t("schoolYear", { y: cal.schoolYear });
    if (term && !over) eyebrow += " · " + t("termWeek", { term: nameOf(term), w: termWeek(term, today) });
    setText("hero-eyebrow", eyebrow);
  }

  // ---------- Countdowns 2 and 3 ----------

  function renderEvent(now) {
    var n = nextEvent(now);
    if (!n) {
      tileCount("event", null);
      setText("event-name", t("noMoreEvents"));
      setText("event-date", "");
      return;
    }
    tileCount("event", n.t > now ? n.t - now : "today");
    setText("event-name", nameOf(n.e));
    var date = longDate(n.e.date);
    setText("event-date", n.e.time ? t("dateAtTime", { date: date, time: eventTime(n.e) }) : date);
  }

  function renderHoliday(now) {
    var n = nextHoliday(now);
    if (!n) {
      setText("holiday-eyebrow", t("nextDayOff"));
      tileCount("holiday", null);
      setText("holiday-name", t("noMoreHolidays"));
      setText("holiday-date", "");
      return;
    }
    var h = n.holiday, today = todayStr(now);
    if (!n.now) {
      setText("holiday-eyebrow", t("nextDayOff"));
      tileCount("holiday", n.target - now);
      setText("holiday-name", nameOf(h));
      var len = dayDiff(h.start, h.end) + 1;
      setText("holiday-date", h.openEnded ? t("fromDate", fromVars(h.start, true))
        : rangeText(h.start, h.end) + (len > 1 ? " · " + t("nDays", { n: len }) : ""));
      return;
    }
    // Already off school.
    var started = today >= h.start;
    setText("holiday-name", started ? t("youreOn", { name: nameOf(h) }) : t("breakStarted", { name: nameOf(h) }));
    if (n.back) {
      setText("holiday-eyebrow", t("backToSchoolIn"));
      tileCount("holiday", n.target - now);
      setText("holiday-date", started
        ? t("back", { back: longDate(n.back), s: cal.schoolDay.start })
        : t("startsBack", { start: shortDate(h.start), back: longDate(n.back), s: cal.schoolDay.start }));
    } else {
      setText("holiday-eyebrow", nameOf(h));
      tileCount("holiday", null);
      setText("holiday-date", t("enjoyBreak"));
    }
  }

  // ---------- Coming up (changes once a day) ----------

  var agendaKey = "";
  function renderAgenda(now) {
    var today = todayStr(now);
    if (agendaKey === today + lang) return;
    agendaKey = today + lang;

    var items = [];
    cal.holidays.forEach(function (h) {
      if (h.end < today && !h.openEnded) return;
      items.push({ date: h.start, end: h.end, open: !!h.openEnded, name: nameOf(h), tag: h.type === "public" ? t("tagDayOff") : t("tagHoliday") });
    });
    cal.events.forEach(function (e) {
      if (e.confirmed === false || e.date < today) return;
      items.push({ date: e.date, end: e.date, name: nameOf(e), tag: e.type === "term" ? t("tagTerm") : t("tagEvent") });
    });
    items.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    items = items.slice(0, 4);

    var list = $("agenda");
    list.innerHTML = "";
    if (!items.length) {
      var empty = document.createElement("li");
      empty.className = "agenda-empty";
      empty.textContent = t("nothingLeft");
      list.appendChild(empty);
    }
    items.forEach(function (it) {
      var p = parts(it.date);
      var live = it.date <= today && (it.end >= today || it.open);
      var diff = dayDiff(today, it.date);
      var when = live ? t("today") : diff === 1 ? t("whenTomorrow") : t("inDays", { n: diff });
      var tag = it.tag;
      if (it.open) tag += " · " + t("fromDateLower", fromVars(it.date));
      else if (it.end !== it.date) tag += " · " + rangeText(it.date, it.end);

      var li = document.createElement("li");
      li.className = "agenda-item" + (live ? " is-today" : "");
      li.innerHTML =
        '<div class="agenda-date"><span class="agenda-day"></span><span class="agenda-mon"></span></div>' +
        '<div class="agenda-body"><p class="agenda-name"></p><p class="agenda-tag"></p></div>' +
        '<p class="agenda-when"></p>';
      li.querySelector(".agenda-day").textContent = p.d;
      li.querySelector(".agenda-mon").textContent = W().mon[p.m];
      li.querySelector(".agenda-name").textContent = it.name;
      li.querySelector(".agenda-tag").textContent = tag;
      li.querySelector(".agenda-when").textContent = when;
      list.appendChild(li);
    });
  }

  // ---------- Month calendar ----------

  var calView = 0, calMin = 0, calMax = 0, calSelected = "", calDay = "";

  function monthIndex(dateStr) { var p = parts(dateStr); return p.y * 12 + p.m; }
  function monthFirst(idx) { var y = Math.floor(idx / 12), m = idx % 12; return y + "-" + pad(m + 1) + "-01"; }
  function clampMonth(idx) { return Math.min(calMax, Math.max(calMin, idx)); }

  function dayInfo(d) {
    var h = holidayOn(d), wd = dow(d), weekend = wd === 0 || wd === 6;
    var school = isSchoolDay(d), evs = eventsOn(d);
    var cls = "", chips = [], lines = [];
    if (school) {
      chips.push(["chip-school", t("chipSchool", { s: cal.schoolDay.start, e: cal.schoolDay.end })]);
    } else if (h && h.type === "public") {
      cls = "is-public"; chips.push(["chip-off", t("chipPublic")]);
    } else if (h) {
      cls = "is-off"; chips.push(["chip-off", weekend ? t("chipWeekend") : t("chipOff")]);
    } else if (weekend) {
      cls = "is-weekend"; chips.push(["", t("chipWeekend")]);
    } else {
      cls = "is-off"; chips.push(["chip-off", t("chipOff")]);
    }
    if (h) {
      var range = h.openEnded ? t("fromDateLower", fromVars(h.start)) : h.start === h.end ? "" : rangeText(h.start, h.end);
      lines.push([nameOf(h), range]);
    }
    evs.forEach(function (e) { lines.push([nameOf(e), e.time ? t("atTime", { time: eventTime(e) }) : ""]); });
    return { cls: cls, chips: chips, lines: lines, events: evs.length };
  }

  function renderCalendar(now, slide) {
    var today = todayStr(now), w = W();
    var first = monthFirst(calView), p = parts(first);
    var days = new Date(Date.UTC(p.y, p.m + 1, 0)).getUTCDate();
    var lead = (dow(first) + 6) % 7; // Monday first

    setText("cal-month", w.month[p.m] + " " + p.y);
    $("cal-prev").disabled = calView <= calMin;
    $("cal-next").disabled = calView >= calMax;
    $("cal-today").classList.toggle("is-invisible", calView === monthIndex(today) && calSelected === today);

    var head = $("cal-head");
    head.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 0].forEach(function (i) {
      var span = document.createElement("span");
      span.textContent = w.dowShort[i];
      head.appendChild(span);
    });

    var grid = $("cal-grid");
    grid.innerHTML = "";
    for (var i = 0; i < lead; i++) {
      var blank = document.createElement("span");
      blank.className = "cal-day is-blank";
      grid.appendChild(blank);
    }
    for (var d = 1; d <= days; d++) {
      var ds = p.y + "-" + pad(p.m + 1) + "-" + pad(d);
      var info = dayInfo(ds);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day " + info.cls +
        (ds < today ? " is-past" : "") +
        (ds === today ? " is-today" : "") +
        (ds === calSelected ? " is-selected" : "");
      btn.setAttribute("data-date", ds);
      btn.setAttribute("aria-pressed", ds === calSelected ? "true" : "false");
      btn.setAttribute("aria-label", (ds === today ? t("todayPrefix") : "") + longDate(ds) + ". " + info.chips[0][1] +
        info.lines.map(function (l) { return ". " + l[0]; }).join(""));
      btn.innerHTML = '<span class="cal-num"></span>' + (info.events ? '<span class="cal-dot" aria-hidden="true"></span>' : "");
      btn.firstChild.textContent = d;
      grid.appendChild(btn);
    }
    if (slide) {
      grid.classList.remove("from-left", "from-right");
      replay(grid, slide > 0 ? "from-right" : "from-left");
    }
    renderDetail(today);
  }

  function renderDetail(today) {
    var ds = calSelected, info = dayInfo(ds);
    var label = ds === today ? t("todayPrefix") : ds === addDays(today, 1) ? t("tomorrowPrefix") : "";
    setText("cal-detail-date", label + longDate(ds));

    var status = $("cal-detail-status");
    status.innerHTML = "";
    info.chips.forEach(function (c) {
      var span = document.createElement("span");
      span.className = "chip " + c[0];
      span.textContent = c[1];
      status.appendChild(span);
    });
    var diff = dayDiff(today, ds);
    if (diff > 1) {
      var away = document.createElement("span");
      away.className = "chip";
      away.textContent = t("inDays", { n: diff });
      status.appendChild(away);
    }

    var list = $("cal-detail-list");
    list.innerHTML = "";
    info.lines.forEach(function (l) {
      var li = document.createElement("li");
      var b = document.createElement("strong");
      b.textContent = l[0];
      li.appendChild(b);
      if (l[1]) {
        var s = document.createElement("span");
        s.textContent = " · " + l[1];
        li.appendChild(s);
      }
      list.appendChild(li);
    });
    show(list, info.lines.length > 0);
  }

  function showMonth(idx, now, slide) {
    var today = todayStr(now);
    var target = clampMonth(idx);
    if (target === calView && slide) slide = 0;
    calView = target;
    calSelected = monthIndex(today) === calView ? today : monthFirst(calView);
    renderCalendar(now, slide);
    replay($("cal-detail"), "pop");
  }

  function setupCalendar(now) {
    calDay = todayStr(now);
    var dates = [calDay];
    cal.terms.forEach(function (tm) { dates.push(tm.start, tm.end); });
    cal.holidays.forEach(function (h) { dates.push(h.start, h.end); });
    cal.events.forEach(function (e) { dates.push(e.date); });
    dates.sort();
    calMin = monthIndex(dates[0]);
    calMax = monthIndex(dates[dates.length - 1]);
    calView = monthIndex(calDay);
    showMonth(calView, now, 0);

    $("cal-prev").addEventListener("click", function () { showMonth(calView - 1, Date.now(), -1); });
    $("cal-next").addEventListener("click", function () { showMonth(calView + 1, Date.now(), 1); });
    $("cal-today").addEventListener("click", function () {
      var idx = monthIndex(todayStr(Date.now()));
      showMonth(idx, Date.now(), idx === calView ? 0 : idx > calView ? 1 : -1);
    });

    var grid = $("cal-grid");
    grid.addEventListener("click", function (ev) {
      var btn = ev.target.closest ? ev.target.closest("button.cal-day") : null;
      if (!btn) return;
      calSelected = btn.getAttribute("data-date");
      renderCalendar(Date.now(), 0);
      replay($("cal-detail"), "pop");
      var again = grid.querySelector('[data-date="' + calSelected + '"]');
      if (again) again.focus();
    });

    // Swipe left / right to change month.
    var sx = null, sy = null;
    grid.addEventListener("touchstart", function (ev) {
      if (ev.touches.length !== 1) { sx = null; return; }
      sx = ev.touches[0].clientX; sy = ev.touches[0].clientY;
    }, { passive: true });
    grid.addEventListener("touchend", function (ev) {
      if (sx === null) return;
      var dx = ev.changedTouches[0].clientX - sx, dy = ev.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        var dir = dx < 0 ? 1 : -1;
        showMonth(calView + dir, Date.now(), dir);
      }
    }, { passive: true });
  }

  // ---------- Every second ----------

  function safely(fn, now) {
    try { fn(now); } catch (err) { if (window.console) console.error(err); }
  }

  function renderAll(now) {
    safely(renderYear, now);
    safely(renderEvent, now);
    safely(renderHoliday, now);
    safely(renderAgenda, now);
  }

  function tick() {
    var now = Date.now();
    renderAll(now);
    playTick();
    // At midnight, move the calendar's "today" along.
    var today = todayStr(now);
    if (calDay && calDay !== today) {
      var wasToday = calSelected === calDay;
      calDay = today;
      safely(function (n) { if (wasToday) showMonth(monthIndex(today), n, 0); else renderCalendar(n, 0); }, now);
    }
  }

  // ---------- Smooth switches (theme and language) ----------

  // Runs `change` inside a view transition when the browser supports it.
  function transition(kind, change) {
    var root = document.documentElement;
    if (reduceMotion || !document.startViewTransition) {
      if (kind === "theme" && !reduceMotion) {
        root.classList.add("theme-fade");
        change();
        setTimeout(function () { root.classList.remove("theme-fade"); }, 500);
      } else {
        change();
      }
      return;
    }
    root.classList.add("vt-" + kind);
    var vt;
    try { vt = document.startViewTransition(change); } catch (e) { root.classList.remove("vt-" + kind); change(); return; }
    vt.finished.then(function () { root.classList.remove("vt-" + kind); }, function () { root.classList.remove("vt-" + kind); });
  }

  // ---------- Light / dark switch ----------

  function setupTheme() {
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    function isDark() {
      var set = root.getAttribute("data-theme");
      return set ? set === "dark" : !!(media && media.matches);
    }
    function sync() {
      var dark = isDark();
      show($("icon-moon"), !dark);
      show($("icon-sun"), dark);
      $("theme-toggle").setAttribute("aria-label", dark ? t("toLight") : t("toDark"));
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? "#0b0e14" : "#23539A");
    }
    try {
      var saved = localStorage.getItem("bga-theme");
      if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
    } catch (e) { /* storage blocked: keep dark */ }
    var btn = $("theme-toggle");
    btn.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      transition("theme", function () {
        root.setAttribute("data-theme", next);
        sync();
      });
      replay(next === "dark" ? $("icon-sun") : $("icon-moon"), "spin");
      try { localStorage.setItem("bga-theme", next); } catch (e) { /* ignore */ }
    });
    if (media && media.addEventListener) media.addEventListener("change", sync);
    sync();
    return sync;
  }

  // ---------- Language switch ----------

  var syncTheme = function () {};

  function applyStaticText() {
    document.documentElement.setAttribute("lang", lang);
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (typeof v === "string" && el.textContent !== v) el.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    document.documentElement.classList.remove("i18n-pending");
    var btn = $("lang-toggle");
    btn.textContent = t("langButton");
    btn.setAttribute("aria-label", t("langLabel"));
    btn.setAttribute("lang", lang === "en" ? "ka" : "en");
    syncTheme();
  }

  function renderFooter() {
    if (!cal) return;
    var updated = cal.lastUpdated && DATE_RE.test(cal.lastUpdated) ? t("updated", { date: longDate(cal.lastUpdated).replace(/^[^ ]+,? /, "") }) : "";
    if (usingSaved) updated += (updated ? " " : "") + t("offline");
    setText("updated", updated);
  }

  function setLang(next) {
    lang = WORDS[next] ? next : "en";
    try { localStorage.setItem("bga-lang", lang); } catch (e) { /* ignore */ }
    applyStaticText();
    $("share-note").textContent = "";
    if (!cal) return;
    agendaKey = "";
    var now = Date.now();
    renderAll(now);
    safely(function (n) { renderCalendar(n, 0); }, now);
    renderFooter();
  }

  function setupLang() {
    var saved = null;
    try { saved = localStorage.getItem("bga-lang"); } catch (e) { /* ignore */ }
    var guess = (navigator.language || "").toLowerCase().indexOf("ka") === 0 ? "ka" : "en";
    lang = WORDS[saved] ? saved : guess;
    applyStaticText();
    $("lang-toggle").addEventListener("click", function () {
      var next = lang === "en" ? "ka" : "en";
      transition("lang", function () { setLang(next); });
    });
  }

  // ---------- Share ----------

  // ---------- Ticking sound ----------
  // A quiet, classic clock tick each second. Browsers only allow sound after the first tap,
  // so it starts then. Made on the fly, so there is no sound file to download.

  var audio = null, tickTock = 0;

  function playTick() {
    if (!audio || audio.state !== "running" || document.hidden) return;
    var t0 = audio.currentTime;
    var len = Math.floor(audio.sampleRate * 0.012);
    var buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 8);
    var src = audio.createBufferSource(); src.buffer = buf;
    var body = audio.createBiquadFilter(); body.type = "bandpass"; body.Q.value = 9;
    body.frequency.value = (tickTock = 1 - tickTock) ? 1900 : 1600; // tick ... tock
    var vol = audio.createGain(); vol.gain.value = 0.12;
    src.connect(body); body.connect(vol); vol.connect(audio.destination);
    src.start(t0);
  }

  function setupSound() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    function unlock() {
      if (!audio) audio = new Ctx();
      if (audio.state === "suspended") audio.resume();
      ["pointerdown", "keydown", "touchstart"].forEach(function (type) { window.removeEventListener(type, unlock); });
    }
    ["pointerdown", "keydown", "touchstart"].forEach(function (type) { window.addEventListener(type, unlock, { passive: true }); });
  }

  function setupShare() {
    var note = $("share-note");
    function copyLink(url) {
      function done() { note.textContent = t("copied"); replay(note, "pop"); }
      function manual() { note.textContent = t("copyThis", { url: url }); replay(note, "pop"); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, manual);
      } else {
        manual();
      }
    }
    $("share-btn").addEventListener("click", function () {
      var url = location.href.split("#")[0];
      if (navigator.share) {
        navigator.share({ title: "BGA Calendar", text: t("shareText"), url: url })
          .catch(function (err) { if (!err || err.name !== "AbortError") copyLink(url); });
      } else {
        copyLink(url);
      }
    });
  }

  // ---------- Loading calendar.json ----------

  // Skip broken entries instead of breaking the whole page, and sort everything by date.
  function clean(data) {
    var c = data && typeof data === "object" ? data : {};
    var sd = c.schoolDay || {};
    c.schoolDay = { start: TIME_RE.test(sd.start || "") ? sd.start : "08:45", end: TIME_RE.test(sd.end || "") ? sd.end : "15:30" };
    c.utcOffset = OFFSET_RE.test(c.utcOffset || "") ? c.utcOffset : "+04:00";
    c.schoolYear = c.schoolYear || "";
    function keep(list, fields, what) {
      return (Array.isArray(list) ? list : []).filter(function (x) {
        var ok = !!x && fields.every(function (f) { return DATE_RE.test(x[f] || ""); });
        if (!ok && window.console) console.warn("calendar.json: skipped a broken " + what, x);
        if (ok && !x.name) x.name = "Untitled";
        return ok;
      });
    }
    function byStart(a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; }
    c.terms = keep(c.terms, ["start", "end"], "term").sort(byStart);
    c.holidays = keep(c.holidays, ["start", "end"], "holiday").sort(byStart);
    c.events = keep(c.events, ["date"], "event");
    if (!c.terms.length) throw new Error("calendar.json has no valid terms");
    return c;
  }

  function start(data) {
    cal = clean(data);
    offset = cal.utcOffset;
    var sign = offset[0] === "-" ? -1 : 1;
    offsetMs = sign * (parseInt(offset.slice(1, 3), 10) * 60 + parseInt(offset.slice(4, 6), 10)) * 60000;
    renderFooter();
    setInterval(tick, 1000);
    safely(setupCalendar, Date.now());
    tick();
  }

  function fail(err) {
    var why = location.protocol === "file:"
      ? t("openSite")
      : err && err.name === "SyntaxError"
        ? t("typo", { msg: err.message })
        : err && /^calendar\.json/.test(err.message || "")
          ? err.message
          : t("checkConn");
    setText("event-name", t("loadFail"));
    setText("holiday-name", t("loadFail"));
    setText("year-progress", why);
    if (window.console) console.error(err);
  }

  function load() {
    return fetch("calendar.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (txt) {
        var data = JSON.parse(txt);
        try { localStorage.setItem(SAVED_KEY, txt); } catch (e) { /* ignore */ }
        return data;
      })
      .catch(function (err) {
        if (err && err.name === "SyntaxError") throw err;
        var saved = null;
        try { saved = localStorage.getItem(SAVED_KEY); } catch (e) { /* ignore */ }
        if (!saved) throw err;
        usingSaved = true;
        return JSON.parse(saved);
      });
  }

  syncTheme = setupTheme();
  setupLang();
  setupShare();
  setupSound();
  load().then(start).catch(fail);

  // Lets the home-screen app open without internet (only on the real website).
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) { /* not available here */ }
  }
})();
