# 하랑의 한국사 탐험대

중학교 3학년 시험 범위인 선사 시대부터 고려 시대까지 학습하는 개인용 한국사 사이트입니다.

## 바로가기

- 학습 사이트: https://harang-history.vercel.app/
- 예비 주소: https://nisdh2916.github.io/harang-history/
- 시대별 개념 노트 34개
- 기본 퀴즈 34문제와 OCR 텍스트 변환 PDF 실전 문항 297문제(총 331문제)
- 오늘의 10문제, 전체 문제, PDF 객관식·주관식, 시대별 문제, 오답 복습
- PDF 문항은 답을 직접 입력하면 정답 기준과 비교해 자동 채점됩니다.
- PDF 297문항 기반 개념별 출제 빈도·문제 유형·헷갈림 포인트 정리

진도와 오답은 사용하는 브라우저에 저장됩니다.

## 구성

- index.html: 시대별 메인 화면
- era.html: 시대별 개념 목록
- note.html: 개념 암기 노트
- quiz.html: 한국사 퀴즈

캐릭터 이미지는 assets/characters, 학습 내용은 assets/data.js와 assets/scope-goryeo.js에서 관리합니다.
PDF 문항 텍스트와 정답 기준은 assets/pdf-questions.js, 원문 확인용 문항·해설 이미지는 assets/questions에서 관리합니다.
개념별 출제 분석은 assets/exam-insights.js에서 관리합니다.
