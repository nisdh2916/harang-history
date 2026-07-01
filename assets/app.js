(function () {
  "use strict";

  var data = window.HISTORY_DATA;
  var app = document.getElementById("app");
  var page = document.body.getAttribute("data-page");
  var examInsights = window.EXAM_INSIGHTS && window.EXAM_INSIGHTS.concepts ? window.EXAM_INSIGHTS.concepts : {};
  var progressKey = "harang-history-progress-v1";
  var wrongKey = "harang-history-wrong-v1";
  var reviewKey = "harang-history-review-v1";

  function safeParse(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function safeSave(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  }

  function reviewStore() {
    var value = safeParse(reviewKey);
    if (!value || Array.isArray(value) || typeof value !== "object") {
      return {};
    }
    return value;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function findEra(id) {
    return data.eras.find(function (era) { return era.id === id; });
  }

  function findConcept(id) {
    var found = null;
    data.eras.some(function (era) {
      var item = era.concepts.find(function (concept) { return concept.id === id; });
      if (item) {
        found = { era: era, concept: item };
        return true;
      }
      return false;
    });
    return found;
  }

  function setColors(era) {
    document.documentElement.style.setProperty("--card-a", era.a);
    document.documentElement.style.setProperty("--card-b", era.b);
  }

  function examPriority(count) {
    if (count >= 15) { return "최우선"; }
    if (count >= 9) { return "자주 출제"; }
    if (count >= 5) { return "반복 출제"; }
    return "기본 확인";
  }

  function characterSlot(era, label) {
    if (era.character) {
      return [
        '<div class="character-slot has-image">',
        '<img src="assets/characters/', escapeHtml(era.character), '" alt="', escapeHtml(label), ' 캐릭터">',
        "</div>"
      ].join("");
    }
    return [
      '<div class="character-slot" aria-label="캐릭터 이미지 자리">',
      "<span>캐릭터<br>준비 중</span>",
      "</div>"
    ].join("");
  }

  function activeStoredValues(key) {
    var activeIds = [];
    data.eras.forEach(function (era) {
      era.concepts.forEach(function (concept) { activeIds.push(concept.id); });
    });
    if (key === wrongKey && Array.isArray(window.PDF_QUESTIONS)) {
      window.PDF_QUESTIONS.forEach(function (question) { activeIds.push(question.id); });
    }
    return safeParse(key).filter(function (id) { return activeIds.indexOf(id) !== -1; });
  }

  function allConceptCount() {
    return data.eras.reduce(function (sum, era) { return sum + era.concepts.length; }, 0);
  }

  function completedInEra(era, completed) {
    return era.concepts.filter(function (concept) { return completed.indexOf(concept.id) !== -1; }).length;
  }

  function errorPage(message) {
    app.innerHTML = [
      '<section class="error-page">',
      "<h1>페이지를 찾지 못했어요.</h1>",
      "<p>", escapeHtml(message), "</p>",
      '<a class="btn btn-primary" href="index.html">시대 목록으로</a>',
      "</section>"
    ].join("");
  }

  function renderHome() {
    var completed = activeStoredValues(progressKey);
    var total = allConceptCount();
    var percent = Math.round((completed.length / total) * 100);
    var firstUnfinished = null;

    data.eras.some(function (era) {
      var item = era.concepts.find(function (concept) { return completed.indexOf(concept.id) === -1; });
      if (item) {
        firstUnfinished = item;
        return true;
      }
      return false;
    });

    var continueHref = firstUnfinished ? "note.html?note=" + firstUnfinished.id : "quiz.html";
    var groupsHtml = data.groups.map(function (group) {
      var eras = data.eras.filter(function (era) { return era.group === group.id; });
      var cards = eras.map(function (era) {
        var done = completedInEra(era, completed);
        var thumb = era.character
          ? '<img src="assets/characters/' + escapeHtml(era.character) + '" alt="' + escapeHtml(era.title) + ' 캐릭터">'
          : '<strong>' + escapeHtml(era.short.charAt(0)) + '</strong>';
        return [
          '<a class="era-card" href="era.html?era=', era.id, '" style="--card-a:', era.a, ";--card-b:", era.b, '">',
          '<div class="era-thumb">', thumb, '<span class="card-count">', era.concepts.length, "</span></div>",
          '<div class="card-copy"><b>', escapeHtml(era.title), "</b><small>", escapeHtml(era.intro), "</small>",
          '<span class="card-progress">', done, "/", era.concepts.length, "개 학습</span></div>",
          "</a>"
        ].join("");
      }).join("");

      return [
        '<section class="era-group" style="--group-color:', group.color, ";--group-bg:", group.background, '">',
        '<div class="group-label"><b>', escapeHtml(group.id), "</b><span>", escapeHtml(group.description), "</span></div>",
        '<div class="era-grid">', cards, "</div>",
        "</section>"
      ].join("");
    }).join("");

    app.innerHTML = [
      '<section class="hero">',
      "<div>",
      '<p class="eyebrow">중3 시험 범위 · 선사부터 고려까지</p>',
      "<h1>시험 범위, <em>흐름대로</em><br>끝까지 연결해요.</h1>",
      "<p>중학교 3학년 시험에 나오는 핵심을 3줄로 정리하고, 왕 업적·사건 순서·자료 판단 문제로 확인합니다.</p>",
      '<div class="hero-actions"><a class="btn btn-primary" href="', continueHref, '">▶ 이어서 학습하기</a><a class="btn" href="quiz.html">퀴즈 풀기 →</a></div>',
      "</div>",
      characterSlot({ character: "main.png" }, "메인"),
      "</section>",
      '<div class="progress-strip"><span>나의 학습 진도</span><div class="progress-bar"><i style="width:', percent, '%"></i></div><b>', completed.length, "/", total, " · ", percent, "%</b></div>",
      '<div class="section-heading"><h2>시대별로 찾아보기</h2><p>시대 카드를 누르면 해당 시대의 개념 암기 노트가 나옵니다.</p></div>',
      groupsHtml
    ].join("");
  }

  function renderEra() {
    var era = findEra(param("era"));
    if (!era) {
      errorPage("시대 주소를 다시 확인해 주세요.");
      return;
    }

    setColors(era);
    document.title = era.title + " | 하랑의 한국사 탐험대";
    var completed = activeStoredValues(progressKey);
    var cards = era.concepts.map(function (concept, index) {
      var done = completed.indexOf(concept.id) !== -1;
      var insight = examInsights[concept.id];
      return [
        '<a class="concept-card', done ? " done" : "", '" href="note.html?note=', concept.id, '">',
        '<div class="concept-thumb"><strong>', String(index + 1).padStart(2, "0"), '</strong><span class="card-count">', index + 1, "</span></div>",
        '<div class="card-copy"><b>', escapeHtml(concept.title), "</b><small>", escapeHtml(concept.tag), "</small>",
        insight ? '<span class="exam-card-count">PDF ' + insight.count + '문항 · ' + examPriority(insight.count) + '</span>' : "",
        "</div>",
        "</a>"
      ].join("");
    }).join("");

    var done = completedInEra(era, completed);
    app.innerHTML = [
      '<div class="breadcrumbs"><a href="index.html">시대별 학습</a><span>›</span><b>', escapeHtml(era.title), "</b></div>",
      '<section class="era-hero">',
      "<div><p class=\"eyebrow\">", escapeHtml(era.group), " · ", era.concepts.length, "개 개념</p>",
      "<h1>", escapeHtml(era.title), "</h1><p>", escapeHtml(era.intro), "</p>",
      '<div class="hero-actions"><a class="btn btn-primary" href="note.html?note=', era.concepts[0].id, '">첫 개념 시작하기</a><a class="btn" href="quiz.html?era=', era.id, '">이 시대 퀴즈</a></div></div>',
      characterSlot(era, era.title),
      "</section>",
      '<div class="notice"><span class="notice-icon">ⓘ</span><div><b>카드 순서가 곧 역사의 흐름입니다.</b><p>', done, "/", era.concepts.length, "개 완료 · 개념을 읽고 암기 문장과 확인 문제까지 풀어 보세요.</p></div></div>",
      '<div class="section-heading"><h2>', escapeHtml(era.title), " 개념 암기 노트</h2><p>궁금한 카드를 눌러도 되고, 처음부터 순서대로 봐도 됩니다.</p></div>",
      '<section class="concept-grid">', cards, "</section>"
    ].join("");
  }

  function renderNote() {
    var found = findConcept(param("note"));
    if (!found) {
      errorPage("개념 노트 주소를 다시 확인해 주세요.");
      return;
    }

    var era = found.era;
    var concept = found.concept;
    var index = era.concepts.findIndex(function (item) { return item.id === concept.id; });
    var previous = era.concepts[index - 1];
    var next = era.concepts[index + 1];
    var completed = activeStoredValues(progressKey);
    var isDone = completed.indexOf(concept.id) !== -1;
    var insight = examInsights[concept.id];
    setColors(era);
    document.title = concept.title + " | 하랑의 한국사 탐험대";

    var points = concept.points.map(function (point) { return "<li>" + escapeHtml(point) + "</li>"; }).join("");
    var flow = concept.flow.map(function (item) { return '<div class="flow-item">' + escapeHtml(item) + "</div>"; }).join("");
    var answers = concept.quiz.choices.map(function (choice, choiceIndex) {
      return '<button class="answer-option" type="button" data-answer="' + choiceIndex + '">' + (choiceIndex + 1) + ". " + escapeHtml(choice) + "</button>";
    }).join("");
    var examSection = "";
    if (insight) {
      var asks = insight.asks.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("");
      examSection = [
        '<section class="note-section exam-insight" id="exam">',
        '<div class="exam-insight-head"><div><p>실제 PDF ', insight.count, '문항 분석</p><h2>시험에 이렇게 나와요</h2></div><span>', examPriority(insight.count), "</span></div>",
        '<div class="exam-format"><small>많이 나온 문제 형식</small><b>', insight.formats.map(escapeHtml).join(" · "), "</b></div>",
        '<ol class="exam-asks">', asks, "</ol>",
        '<div class="exam-trap"><b>헷갈림 방지</b><p>', escapeHtml(insight.trap), "</p></div>",
        "</section>"
      ].join("");
    }

    app.innerHTML = [
      '<div class="breadcrumbs"><a href="index.html">시대별 학습</a><span>›</span><a href="era.html?era=', era.id, '">', escapeHtml(era.title), "</a><span>›</span><b>", escapeHtml(concept.title), "</b></div>",
      '<div class="note-layout">',
      '<article class="note-main">',
      '<header class="note-title"><p class="eyebrow">', escapeHtml(concept.tag), "</p><h1>", escapeHtml(concept.title), "</h1><p>", escapeHtml(concept.summary), "</p></header>",
      '<section class="note-section" id="core"><h2>핵심 3줄</h2><ol class="three-lines">', points, "</ol></section>",
      examSection,
      '<section class="note-section" id="flow"><h2>흐름으로 연결하기</h2><div class="flow">', flow, "</div></section>",
      '<section class="note-section" id="memory"><h2>한 문장 암기</h2><div class="memory-box">“', escapeHtml(concept.memory), "”</div></section>",
      '<section class="note-section mini-quiz" id="check"><h2>30초 확인 문제</h2><h3>', escapeHtml(concept.quiz.question), '</h3><div class="answer-list">', answers, '</div><p class="answer-result" aria-live="polite"></p></section>',
      '<nav class="note-nav" aria-label="개념 이동">',
      previous ? '<a class="btn btn-small" href="note.html?note=' + previous.id + '">← ' + escapeHtml(previous.title) + "</a>" : "<span></span>",
      next ? '<a class="btn btn-small btn-primary" href="note.html?note=' + next.id + '">' + escapeHtml(next.title) + " →</a>" : '<a class="btn btn-small btn-primary" href="quiz.html?era=' + era.id + '">시대 퀴즈 →</a>',
      "</nav>",
      "</article>",
      '<aside class="note-side"><h2>이 노트의 순서</h2><a href="#core">1. 핵심 3줄</a>', insight ? '<a href="#exam">2. 출제 포인트</a>' : "", '<a href="#flow">', insight ? "3" : "2", '. 흐름 연결</a><a href="#memory">', insight ? "4" : "3", '. 한 문장 암기</a><a href="#check">', insight ? "5" : "4", '. 확인 문제</a>',
      '<button class="btn ', isDone ? "" : "btn-dark", '" id="complete-note" type="button">', isDone ? "✓ 학습 완료됨" : "학습 완료 체크", "</button>",
      '<a class="btn btn-small" href="era.html?era=', era.id, '">시대 목록으로</a></aside>',
      "</div>"
    ].join("");

    var answerButtons = app.querySelectorAll(".answer-option");
    var result = app.querySelector(".answer-result");
    answerButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (result.classList.contains("show")) {
          return;
        }
        var selected = Number(button.getAttribute("data-answer"));
        answerButtons.forEach(function (item) { item.disabled = true; });
        if (selected === concept.quiz.answer) {
          button.classList.add("correct");
          result.textContent = "정답입니다. " + concept.quiz.why;
        } else {
          button.classList.add("wrong");
          answerButtons[concept.quiz.answer].classList.add("correct");
          result.textContent = "정답은 " + (concept.quiz.answer + 1) + "번입니다. " + concept.quiz.why;
        }
        result.classList.add("show");
      });
    });

    var completeButton = document.getElementById("complete-note");
    completeButton.addEventListener("click", function () {
      var current = activeStoredValues(progressKey);
      if (current.indexOf(concept.id) === -1) {
        current.push(concept.id);
        safeSave(progressKey, current);
      }
      completeButton.textContent = "✓ 학습 완료됨";
      completeButton.classList.remove("btn-dark");
    });
  }

  function quizQuestions() {
    var questions = [];
    data.eras.forEach(function (era) {
      era.concepts.forEach(function (concept) {
        questions.push({
          id: concept.id,
          eraId: era.id,
          eraTitle: era.title,
          conceptTitle: concept.title,
          type: "choice",
          sourceType: "concept",
          question: concept.quiz.question,
          choices: concept.quiz.choices,
          answer: concept.quiz.answer,
          why: concept.quiz.why
        });
      });
    });
    if (Array.isArray(window.PDF_QUESTIONS)) {
      questions = questions.concat(window.PDF_QUESTIONS.map(function (question) {
        var matched = findConcept(question.conceptId);
        if (matched) {
          question.conceptTitle = matched.concept.title + " · PDF " + question.questionNumber + "번";
        }
        return question;
      }));
    }
    return questions;
  }

  function normalizeAnswer(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[０-９]/g, function (char) { return String.fromCharCode(char.charCodeAt(0) - 65248); })
      .replace(/[①㉠]/g, "1")
      .replace(/[②㉡]/g, "2")
      .replace(/[③㉢]/g, "3")
      .replace(/[④㉣]/g, "4")
      .replace(/[⑤㉤]/g, "5")
      .replace(/[o○ㅇ영]/g, "o")
      .replace(/[ⅹ×]/g, "x")
      .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, "");
  }

  function matchesPdfAnswer(input, question) {
    var normalizedInput = normalizeAnswer(input);
    var aliases = question.answerAliases || [];
    if (!normalizedInput) {
      return false;
    }
    if (question.answerNumber && normalizedInput === normalizeAnswer(question.answerNumber)) {
      return true;
    }
    var matchedAlias = aliases.some(function (alias) {
      var normalizedAlias = normalizeAnswer(alias);
      if (!normalizedAlias) {
        return false;
      }
      if (normalizedInput === normalizedAlias) {
        return true;
      }
      return normalizedInput.length >= 2 && normalizedAlias.indexOf(normalizedInput) !== -1;
    });
    if (aliases.length) {
      return matchedAlias;
    }
    return (
      question.checkMode === "clue" &&
      normalizedInput.length >= 2 &&
      normalizeAnswer(question.answerClue).indexOf(normalizedInput) !== -1
    );
  }

  function pdfAnswerLabel(question) {
    var displayAliases = (question.answerAliases || []).filter(function (alias) {
      var normalized = normalizeAnswer(alias);
      return normalized.length > 1 || normalized === "o" || normalized === "x";
    });
    if (displayAliases.length) {
      return displayAliases.join(", ") + (question.answerNumber ? " (" + question.answerNumber + "번)" : "");
    }
    return (question.answerClue || question.answerText || "해설을 확인해 주세요.") + (question.answerNumber ? " (" + question.answerNumber + "번)" : "");
  }

  function dailyQuestions(questions) {
    var date = new Date();
    var seed = Number(String(date.getFullYear()) + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0"));
    return questions.slice().sort(function (a, b) {
      function hash(text) {
        var value = seed;
        for (var i = 0; i < text.length; i += 1) {
          value = ((value << 5) - value + text.charCodeAt(i)) | 0;
        }
        return value;
      }
      return hash(a.id) - hash(b.id);
    }).slice(0, 10);
  }

  function renderQuiz() {
    var all = quizQuestions();
    var state = {
      mode: "daily",
      era: param("era") || "all",
      index: 0,
      correct: 0,
      answered: 0,
      locked: false
    };

    app.innerHTML = [
      '<div class="quiz-shell">',
      '<aside class="quiz-panel"><h2>오늘의 점수</h2><div class="score-number"><span id="score">0</span><small> 점</small></div>',
      '<div class="quiz-stat"><span>정답</span><b id="correct-count">0</b></div><div class="quiz-stat"><span>푼 문제</span><b id="answered-count">0</b></div>',
      '<div class="quiz-stat"><span>저장된 오답</span><b id="wrong-count">', activeStoredValues(wrongKey).length, "</b></div></aside>",
      '<section><header class="quiz-main-head"><h1>중3 한국사 실전 퀴즈</h1><p>기본 문제와 PDF 실전 문항 ', all.length, '개를 풀 수 있습니다. 틀린 문제는 오답 노트에 저장됩니다.</p></header><div id="quiz-stage"></div></section>',
      '<aside class="quiz-panel"><h2>문제 선택</h2><div class="quiz-controls">',
      '<button type="button" class="active" data-mode="daily">오늘의 10문제</button><button type="button" data-mode="all">전체 문제</button><button type="button" data-mode="pdf-objective">PDF 객관식</button><button type="button" data-mode="pdf-subjective">PDF 주관식</button><button type="button" data-mode="wrong">오답만</button>',
      '<select id="era-filter" aria-label="시대 선택"><option value="all">전체 시대</option>',
      data.eras.map(function (era) { return '<option value="' + era.id + '"' + (state.era === era.id ? " selected" : "") + ">" + escapeHtml(era.title) + "</option>"; }).join(""),
      '</select></div><h2 style="margin-top:22px">바로 복습</h2><div class="study-links">',
      data.eras.map(function (era) { return '<a class="study-link" href="era.html?era=' + era.id + '">' + escapeHtml(era.title) + " →</a>"; }).join(""),
      "</div></aside>",
      "</div>"
    ].join("");

    var stage = document.getElementById("quiz-stage");

    function selectedQuestions() {
      var base = all;
      if (state.era !== "all") {
        base = base.filter(function (item) { return item.eraId === state.era; });
      }
      if (state.mode === "daily") {
        return dailyQuestions(base);
      }
      if (state.mode === "wrong") {
        var wrong = activeStoredValues(wrongKey);
        return base.filter(function (item) { return wrong.indexOf(item.id) !== -1; });
      }
      if (state.mode === "pdf-objective") {
        return base.filter(function (item) { return item.sourceType === "objective"; });
      }
      if (state.mode === "pdf-subjective") {
        return base.filter(function (item) { return item.sourceType === "subjective"; });
      }
      return base;
    }

    function updateStats() {
      document.getElementById("score").textContent = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
      document.getElementById("correct-count").textContent = state.correct;
      document.getElementById("answered-count").textContent = state.answered;
      document.getElementById("wrong-count").textContent = activeStoredValues(wrongKey).length;
    }

    function draw() {
      var list = selectedQuestions();
      state.locked = false;
      if (!list.length) {
        stage.innerHTML = '<div class="quiz-empty"><b>풀 문제가 없습니다.</b><p>오답이 없거나 선택한 시대에 저장된 문제가 없습니다.</p></div>';
        return;
      }
      if (state.index >= list.length) {
        stage.innerHTML = [
          '<div class="quiz-empty"><h2>이번 세트를 모두 풀었습니다.</h2><p>정답 ', state.correct, "개 / ", state.answered, "문제</p>",
          '<button class="btn btn-primary" type="button" id="restart-quiz">다시 풀기</button></div>'
        ].join("");
        document.getElementById("restart-quiz").addEventListener("click", function () {
          state.index = 0;
          state.correct = 0;
          state.answered = 0;
          updateStats();
          draw();
        });
        return;
      }

      var question = list[state.index];
      if (question.type === "pdf-text") {
        stage.innerHTML = [
          '<article class="quiz-card pdf-quiz-card">',
          '<div class="question-meta"><span>', escapeHtml(question.eraTitle), " · ", escapeHtml(question.conceptTitle), '</span><span>', state.index + 1, " / ", list.length, '</span></div>',
          '<div class="pdf-source-badge">PDF ', question.sourceType === "objective" ? "객관식" : "주관식", '</div>',
          '<div class="pdf-question-text">', escapeHtml(question.questionText || ""), "</div>",
          '<form class="typed-answer" id="typed-answer"><label for="pdf-answer">답 입력</label><div><input id="pdf-answer" autocomplete="off" placeholder="예: 묘청, O, X, 무령왕"><button class="btn btn-dark" type="submit">채점하기</button></div></form>',
          '<p class="answer-result" aria-live="polite"></p>',
          '<details class="pdf-original"><summary>원문 이미지 보기</summary><img class="pdf-question-image" src="', escapeHtml(question.questionImage), '" alt="', escapeHtml(question.sourceTitle), " ", question.questionNumber, '번 원문 문제"></details>',
          '<section class="pdf-solution" id="pdf-solution" hidden><h3>정답·해설</h3><p class="solution-text">', escapeHtml(question.solutionText || question.answerClue || ""), '</p><details><summary>해설 원문 이미지 보기</summary><img src="', escapeHtml(question.solutionImage), '" alt="', escapeHtml(question.sourceTitle), " ", question.questionNumber, '번 정답과 해설"></details></section>',
          '<div class="quiz-next"><button class="btn btn-primary" id="next-question" type="button" disabled>다음 문제 →</button></div>',
          '</article>'
        ].join("");

        var answerForm = document.getElementById("typed-answer");
        var answerInput = document.getElementById("pdf-answer");
        var solution = document.getElementById("pdf-solution");
        var pdfResult = stage.querySelector(".answer-result");
        var pdfNextButton = document.getElementById("next-question");

        answerForm.addEventListener("submit", function (event) {
          event.preventDefault();
          if (state.locked) {
            return;
          }
          var typed = answerInput.value.trim();
          if (!typed) {
            pdfResult.textContent = "답을 먼저 입력해 주세요.";
            pdfResult.classList.add("show");
            return;
          }
          state.locked = true;
          state.answered += 1;
          var isCorrect = matchesPdfAnswer(typed, question);
          var wrong = activeStoredValues(wrongKey);
          if (isCorrect) {
            state.correct += 1;
            wrong = wrong.filter(function (id) { return id !== question.id; });
            pdfResult.textContent = "정답입니다. 정답 기준: " + pdfAnswerLabel(question);
          } else {
            if (wrong.indexOf(question.id) === -1) {
              wrong.push(question.id);
            }
            pdfResult.textContent = "오답입니다. 정답 기준: " + pdfAnswerLabel(question);
          }
          safeSave(wrongKey, wrong);
          answerInput.disabled = true;
          answerForm.querySelector("button").disabled = true;
          solution.hidden = false;
          pdfResult.classList.add("show");
          pdfNextButton.disabled = false;
          updateStats();
        });

        pdfNextButton.addEventListener("click", function () {
          state.index += 1;
          draw();
        });
        return;
      }

      stage.innerHTML = [
        '<article class="quiz-card">',
        '<div class="question-meta"><span>', escapeHtml(question.eraTitle), " · ", escapeHtml(question.conceptTitle), "</span><span>", state.index + 1, " / ", list.length, "</span></div>",
        "<h2>", escapeHtml(question.question), "</h2>",
        '<div class="answer-list">',
        question.choices.map(function (choice, index) {
          return '<button class="answer-option" type="button" data-answer="' + index + '">' + (index + 1) + ". " + escapeHtml(choice) + "</button>";
        }).join(""),
        '</div><p class="answer-result" aria-live="polite"></p>',
        '<div class="quiz-next"><button class="btn btn-primary" id="next-question" type="button" disabled>다음 문제 →</button></div>',
        "</article>"
      ].join("");

      var buttons = stage.querySelectorAll(".answer-option");
      var result = stage.querySelector(".answer-result");
      var nextButton = document.getElementById("next-question");
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          if (state.locked) {
            return;
          }
          state.locked = true;
          state.answered += 1;
          var selected = Number(button.getAttribute("data-answer"));
          var wrong = activeStoredValues(wrongKey);
          buttons.forEach(function (item) { item.disabled = true; });
          if (selected === question.answer) {
            state.correct += 1;
            button.classList.add("correct");
            wrong = wrong.filter(function (id) { return id !== question.id; });
            result.textContent = "정답입니다. " + question.why;
          } else {
            button.classList.add("wrong");
            buttons[question.answer].classList.add("correct");
            if (wrong.indexOf(question.id) === -1) {
              wrong.push(question.id);
            }
            result.textContent = "정답은 " + (question.answer + 1) + "번입니다. " + question.why;
          }
          safeSave(wrongKey, wrong);
          result.classList.add("show");
          nextButton.disabled = false;
          updateStats();
        });
      });

      nextButton.addEventListener("click", function () {
        state.index += 1;
        draw();
      });
    }

    app.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.mode = button.getAttribute("data-mode");
        state.index = 0;
        app.querySelectorAll("[data-mode]").forEach(function (item) { item.classList.remove("active"); });
        button.classList.add("active");
        draw();
      });
    });

    document.getElementById("era-filter").addEventListener("change", function (event) {
      state.era = event.target.value;
      state.index = 0;
      draw();
    });

    draw();
  }

  function renderReview() {
    if (!Array.isArray(window.PDF_QUESTIONS)) {
      errorPage("PDF 문제 데이터가 아직 준비되지 않았습니다.");
      return;
    }

    var state = {
      filter: param("filter") || "needs",
      query: ""
    };
    var store = reviewStore();

    function reviewEntry(id) {
      return store[id] || {};
    }

    function filteredQuestions() {
      var list = window.PDF_QUESTIONS.slice();
      if (state.filter === "needs") {
        list = list.filter(function (question) { return question.needsReview || question.checkMode === "clue"; });
      } else if (state.filter === "objective") {
        list = list.filter(function (question) { return question.sourceType === "objective"; });
      } else if (state.filter === "subjective") {
        list = list.filter(function (question) { return question.sourceType === "subjective"; });
      } else if (state.filter === "numbered") {
        list = list.filter(function (question) { return question.sourceType === "objective" && question.answerNumber; });
      } else if (state.filter === "marked") {
        list = list.filter(function (question) { return reviewEntry(question.id).status === "fix"; });
      }
      if (state.query) {
        var keyword = state.query.toLowerCase();
        list = list.filter(function (question) {
          return [
            question.id,
            question.sourceTitle,
            question.conceptTitle,
            question.questionText,
            question.answerText,
            question.answerClue,
            (question.answerAliases || []).join(" ")
          ].join(" ").toLowerCase().indexOf(keyword) !== -1;
        });
      }
      return list;
    }

    function reviewStats() {
      var total = window.PDF_QUESTIONS.length;
      var needs = window.PDF_QUESTIONS.filter(function (question) { return question.needsReview || question.checkMode === "clue"; }).length;
      var numbered = window.PDF_QUESTIONS.filter(function (question) { return question.answerNumber; }).length;
      var fixed = Object.keys(store).filter(function (id) { return store[id].status === "fix"; }).length;
      var checked = Object.keys(store).filter(function (id) { return store[id].status === "ok"; }).length;
      return { total: total, needs: needs, numbered: numbered, checked: checked, fixed: fixed };
    }

    function statsHtml() {
      var stats = reviewStats();
      return [
        '<div class="review-stats">',
        '<span><b data-review-stat="total">', stats.total, '</b><small>전체 PDF</small></span>',
        '<span><b data-review-stat="needs">', stats.needs, '</b><small>우선 검수</small></span>',
        '<span><b data-review-stat="numbered">', stats.numbered, '</b><small>번호 채점</small></span>',
        '<span><b data-review-stat="checked">', stats.checked, '</b><small>검수 완료</small></span>',
        '<span><b data-review-stat="fixed">', stats.fixed, '</b><small>수정 필요</small></span>',
        "</div>"
      ].join("");
    }

    function updateReviewStats() {
      var stats = reviewStats();
      Object.keys(stats).forEach(function (key) {
        var node = document.querySelector('[data-review-stat="' + key + '"]');
        if (node) {
          node.textContent = stats[key];
        }
      });
    }

    function questionCard(question) {
      var matched = findConcept(question.conceptId);
      var entry = reviewEntry(question.id);
      var aliases = question.answerAliases && question.answerAliases.length ? question.answerAliases.join(", ") : "없음";
      var numberButtons = ["1", "2", "3", "4", "5"].map(function (number) {
        var active = entry.number ? entry.number === number : question.answerNumber === number;
        return '<button type="button" class="' + (active ? "active" : "") + '" data-number="' + number + '">' + number + "</button>";
      }).join("");
      return [
        '<article class="review-card" data-id="', escapeHtml(question.id), '">',
        '<div class="question-meta"><span>', escapeHtml(question.sourceTitle), " · ", question.questionNumber, '번 · ', escapeHtml(matched ? matched.concept.title : question.conceptTitle), '</span><span>', question.needsReview || question.checkMode === "clue" ? "검수 필요" : "자동 채점", "</span></div>",
        '<h2>', escapeHtml(question.questionText || ""), "</h2>",
        '<div class="review-answer-grid">',
        '<div><small>정답 OCR</small><b>', escapeHtml(question.answerText || "없음"), "</b></div>",
        '<div><small>정답 별칭</small><b>', escapeHtml(aliases), "</b></div>",
        '<div><small>정답 번호</small><b>', escapeHtml(entry.number || question.answerNumber || "미확정"), "</b></div>",
        '<div><small>채점 방식</small><b>', escapeHtml(question.checkMode), "</b></div>",
        "</div>",
        question.sourceType === "objective" ? '<div class="review-number-row"><span>번호 검수</span>' + numberButtons + "</div>" : "",
        '<details class="review-detail"><summary>해설·원문 비교</summary>',
        '<p class="review-clue">', escapeHtml(question.answerClue || "해설 핵심어 없음"), "</p>",
        '<p>', escapeHtml(question.solutionText || ""), "</p>",
        '<div class="review-images"><img loading="lazy" src="', escapeHtml(question.questionImage), '" alt="원문 문제"><img loading="lazy" src="', escapeHtml(question.solutionImage), '" alt="원문 해설"></div>',
        "</details>",
        '<textarea class="review-memo" placeholder="수정할 내용 메모">', escapeHtml(entry.memo || ""), "</textarea>",
        '<div class="review-actions"><button type="button" class="btn btn-small review-ok">검수 완료</button><button type="button" class="btn btn-small review-fix">수정 필요</button><span>', entry.status === "ok" ? "검수 완료" : entry.status === "fix" ? "수정 필요" : "미검수", "</span></div>",
        "</article>"
      ].join("");
    }

    function draw() {
      var list = filteredQuestions();
      updateReviewStats();
      document.getElementById("review-count").textContent = list.length;
      document.getElementById("review-list").innerHTML = list.length
        ? list.map(questionCard).join("")
        : '<div class="quiz-empty"><b>표시할 문제가 없습니다.</b><p>필터나 검색어를 바꿔 보세요.</p></div>';

      document.querySelectorAll(".review-card").forEach(function (card) {
        var id = card.getAttribute("data-id");
        card.querySelectorAll("[data-number]").forEach(function (button) {
          button.addEventListener("click", function () {
            store[id] = store[id] || {};
            store[id].number = button.getAttribute("data-number");
            safeSave(reviewKey, store);
            draw();
          });
        });
        card.querySelector(".review-memo").addEventListener("input", function (event) {
          store[id] = store[id] || {};
          store[id].memo = event.target.value;
          safeSave(reviewKey, store);
        });
        card.querySelector(".review-ok").addEventListener("click", function () {
          store[id] = store[id] || {};
          store[id].status = "ok";
          safeSave(reviewKey, store);
          draw();
        });
        card.querySelector(".review-fix").addEventListener("click", function () {
          store[id] = store[id] || {};
          store[id].status = "fix";
          safeSave(reviewKey, store);
          draw();
        });
      });
    }

    app.innerHTML = [
      '<section class="review-head">',
      '<p class="eyebrow">PDF OCR 검수</p>',
      '<h1>문제 텍스트와 정답 기준을 빠르게 확인합니다.</h1>',
      '<p>우선 검수 필터는 자동 채점이 애매한 문항을 먼저 보여줍니다. 정답 번호 버튼과 메모는 이 브라우저에 저장됩니다.</p>',
      statsHtml(),
      "</section>",
      '<section class="review-toolbar">',
      '<label>필터 <select id="review-filter"><option value="needs">우선 검수</option><option value="all">전체</option><option value="objective">객관식</option><option value="subjective">주관식</option><option value="numbered">번호 채점 있음</option><option value="marked">수정 필요 표시</option></select></label>',
      '<label>검색 <input id="review-query" placeholder="예: 몽골, 발해, 고조선"></label>',
      '<span><b id="review-count">0</b>문항 표시</span>',
      "</section>",
      '<section class="review-list" id="review-list"></section>'
    ].join("");

    document.getElementById("review-filter").value = state.filter;
    document.getElementById("review-filter").addEventListener("change", function (event) {
      state.filter = event.target.value;
      draw();
    });
    document.getElementById("review-query").addEventListener("input", function (event) {
      state.query = event.target.value.trim();
      draw();
    });
    draw();
  }

  if (!data || !app) {
    return;
  }

  if (page === "home") {
    renderHome();
  } else if (page === "era") {
    renderEra();
  } else if (page === "note") {
    renderNote();
  } else if (page === "quiz") {
    renderQuiz();
  } else if (page === "review") {
    renderReview();
  }
}());
