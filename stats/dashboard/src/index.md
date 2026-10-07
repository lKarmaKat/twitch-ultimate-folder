---
title: Usage statistics
toc: false
---

# Usage statistics

Each Chrome install sends at most one snapshot a week, with no identifier. Only complete weeks are counted, so every snapshot of a given week comes from a different install.

```js
const snapshots = await FileAttachment("data/snapshots.json").json();
```

```js
const LAYOUTS = ["stack", "split", "flyout", "tabs", "grid", "dock"];
const CHANNEL_BINS = [[0, 0, "0"], [1, 4, "1–4"], [5, 9, "5–9"], [10, 19, "10–19"], [20, 49, "20–49"], [50, Infinity, "50+"]];
const LEGACY = "Before statistics";

const currentWeek = d3.utcMonday.floor(new Date());
const complete = snapshots
  .map((s) => ({...s, week: d3.utcMonday.floor(new Date(s.receivedAt)), period: periodOf(s.cohort)}))
  .filter((s) => s.week < currentWeek);
const lastWeek = d3.max(complete, (s) => s.week);
const latest = complete.filter((s) => +s.week === +lastWeek);
const periods = [LEGACY, ...d3.sort(new Set(complete.map((s) => s.period).filter((p) => p !== LEGACY)))];

function periodOf(cohort) {
  if (cohort === "legacy") return LEGACY;
  const [year, month] = cohort.split("-").map(Number);
  return `${year} Q${Math.ceil(month / 3)}`;
}

function listCount(snapshot) {
  return snapshot.lists.filter((l) => l.depth > 0).length;
}

function usesLayout(snapshot, layout) {
  return snapshot.lists.some((l) => l.layout === layout);
}

function seniority(snapshot) {
  if (snapshot.cohort === "legacy") return LEGACY;
  const [year, month] = snapshot.cohort.split("-").map(Number);
  const months = (snapshot.week.getUTCFullYear() - year) * 12 + snapshot.week.getUTCMonth() + 1 - month;
  return months < 3 ? "Under 3 months since install" : "3+ months since install";
}
```

```js
display(latest.length
  ? html`<p>Latest complete week: <strong>${d3.utcFormat("%B %-d, %Y")(lastWeek)}</strong>, ${latest.length.toLocaleString("en-US")} active installs.</p>`
  : html`<p><strong>No complete week of data yet.</strong></p>`);
```

## Who makes up the active base

```js
Plot.plot({
  width,
  height: 320,
  x: {label: null},
  y: {grid: true, label: "Active installs"},
  color: {legend: true, domain: periods, range: ["#9aa5b4", ...d3.quantize(d3.interpolateBlues, Math.max(periods.length, 2)).slice(1)]},
  marks: [
    Plot.rectY(complete, Plot.binX({y: "count"}, {x: (s) => new Date(s.receivedAt), interval: d3.utcMonday, fill: "period", order: periods, tip: true})),
    Plot.ruleY([0])
  ]
})
```

The thickness of a band over time is that group's retention.

<div class="grid grid-cols-2">
<div class="card">

## Layouts in use

```js
const layoutShare = [
  ...LAYOUTS.filter((layout) => layout !== "stack").map((layout) => ({label: layout, share: d3.mean(latest, (s) => usesLayout(s, layout) ? 1 : 0)})),
  {label: "stack only", share: d3.mean(latest, (s) => s.lists.every((l) => l.layout === "stack") ? 1 : 0)}
];
display(resize((width) => Plot.plot({
  width,
  marginLeft: 80,
  x: {percent: true, grid: true, label: "% of installs with at least one list of this layout"},
  y: {label: null, domain: layoutShare.map((d) => d.label)},
  marks: [
    Plot.barX(layoutShare, {x: "share", y: "label", fill: "steelblue"}),
    Plot.text(layoutShare, {x: "share", y: "label", text: (d) => d3.format(".0%")(d.share ?? 0), dx: 18})
  ]
})));
```

</div>
<div class="card">

## Lists per install

```js
display(resize((width) => Plot.plot({
  width,
  x: {label: "Lists, root excluded (15 = 15 or more)", domain: d3.range(0, 16)},
  y: {percent: true, grid: true, label: "% of installs"},
  marks: [
    Plot.barY(latest, Plot.groupX({y: "proportion"}, {x: (s) => Math.min(listCount(s), 15), fill: "steelblue", tip: true})),
    Plot.ruleY([0])
  ]
})));
```

</div>
<div class="card">

## Channels per manual list

```js
const manualLists = latest.flatMap((s) => s.lists.filter((l) => l.source === "manual"));
display(resize((width) => Plot.plot({
  width,
  x: {label: "Channels", domain: CHANNEL_BINS.map(([, , label]) => label)},
  y: {percent: true, grid: true, label: "% of manual lists"},
  marks: [
    Plot.barY(manualLists, Plot.groupX({y: "proportion"}, {x: (l) => CHANNEL_BINS.find(([low, high]) => l.channels >= low && l.channels <= high)[2], fill: "steelblue", tip: true})),
    Plot.ruleY([0])
  ]
})));
```

</div>
<div class="card">

## Lists by install period

```js
display(resize((width) => Plot.plot({
  width,
  x: {label: null, domain: periods},
  y: {grid: true, label: "Mean lists per install"},
  marks: [
    Plot.barY(latest, Plot.groupX({y: "mean"}, {x: "period", y: listCount, fill: "steelblue"})),
    Plot.text(latest, Plot.groupX({y: "mean", text: "count"}, {x: "period", y: listCount, dy: -8})),
    Plot.ruleY([0])
  ]
})));
```

The label above each bar is the number of active installs in the group. Long-standing installs are also the ones that liked the extension enough to stay.

</div>
</div>

## Adoption of a layout by seniority

```js
const adoptionLayout = view(Inputs.select(LAYOUTS, {label: "Layout", value: "split"}));
```

```js
const adoption = d3.flatRollup(
  complete,
  (group) => ({share: d3.mean(group, (s) => usesLayout(s, adoptionLayout) ? 1 : 0), installs: group.length}),
  (s) => s.week,
  (s) => seniority(s)
).map(([week, group, {share, installs}]) => ({week, group, share, installs})).filter((d) => d.installs >= 10);

display(resize((width) => Plot.plot({
  width,
  height: 300,
  x: {label: null},
  y: {percent: true, grid: true, label: `% of installs using ${adoptionLayout}`},
  color: {legend: true},
  marks: [
    Plot.lineY(adoption, {x: "week", y: "share", stroke: "group", marker: "circle-stroke", tip: true}),
    Plot.ruleY([0])
  ]
})));
```

Groups with fewer than 10 installs in a week are left out.
