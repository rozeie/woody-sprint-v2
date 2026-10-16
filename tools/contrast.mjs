// DESIGN.md §3 토큰의 실제 인접 조합 대비 계산 (WCAG 상대 휘도). 개발 보조 도구이며 앱 번들에 포함되지 않음.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pairs = [
  ["본문 text-primary / background", "#1D2939", "#F9FAFB", 4.5],
  ["본문 text-primary / surface", "#1D2939", "#FFFFFF", 4.5],
  ["text-secondary / surface", "#475467", "#FFFFFF", 4.5],
  ["text-secondary / surface-subtle(중립 칩)", "#475467", "#F0F2F5", 4.5],
  ["text-muted / background", "#667085", "#F9FAFB", 4.5],
  ["text-muted / surface", "#667085", "#FFFFFF", 4.5],
  ["text-primary / primary(CTA 라벨)", "#1D2939", "#15B574", 4.5],
  ["text-primary / primary-hover", "#1D2939", "#15B876", 4.5],
  ["text-primary / primary-pressed", "#1D2939", "#10A66B", 4.5],
  ["primary-text / primary-tint(선택 칩)", "#067647", "#E8FAF1", 4.5],
  ["primary-text / surface(링크·활성 탭)", "#067647", "#FFFFFF", 4.5],
  ["danger-text / danger-bg", "#B42318", "#FEF3F2", 4.5],
  ["danger-text / surface", "#B42318", "#FFFFFF", 4.5],
  ["warning-text / warning-bg", "#854A0E", "#FFFAEB", 4.5],
  ["success-text / success-bg", "#067647", "#ECFDF3", 4.5],
  ["disabled-text / disabled-bg", "#667085", "#EAECF0", 4.5],
  ["[UI] border-control / surface", "#667085", "#FFFFFF", 3],
  ["[UI] border-control / background", "#667085", "#F9FAFB", 3],
  ["[UI] focus / surface", "#175CD3", "#FFFFFF", 3],
  ["[UI] focus / background", "#175CD3", "#F9FAFB", 3],
  ["[UI] primary-text(선택 경계) / primary-tint", "#067647", "#E8FAF1", 3],
  ["[UI] primary / surface (밝은 그린 단독 경계; 사용 금지 조합 확인)", "#15B574", "#FFFFFF", 3],
  ["[UI] border-subtle / surface (장식 구분선)", "#D0D5DD", "#FFFFFF", 3],
];
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  console.log(`${r >= min ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1 (기준 ${min})  ${name}`);
}
// 그린 CTA 위 흰 라벨(사용자 지시로 적용됨). 일반 텍스트 기준 4.5 대 1에 못 미치는 것을 확인했고, 색은 지시대로 두었다. 위 표의 [FAIL]과 별개로 읽는다.
console.log("");
console.log("[참고] 흰 라벨 위 그린 대비(일반 텍스트 기준 4.5)");
for (const [name, bg] of [["primary #15B574","#15B574"],["hover #15B876","#15B876"],["pressed #10A66B","#10A66B"]]) console.log(ratio("#FFFFFF", bg).toFixed(2)+" 대 1  "+name);
console.log("[참고] 버튼용 그린 조정안(같은 색조, 흰 라벨)");
for (const [name, bg] of [["기본 #108556","#108556"],["hover #0F794E","#0F794E"],["눌림 #0D6C46","#0D6C46"]]) console.log(ratio("#FFFFFF", bg).toFixed(2)+" 대 1  "+name);
