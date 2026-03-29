# WuWa Pull Calculator

Simple calculator for Wuthering Waves pulls.

Site can be found [here](https://definetlynotai.github.io/Code_DUMP/WuWa%20Pull%20Calculator)

## Inputs
- Astrites
- Afterglow Coral (optional disable)
- Radiant or Forging Tides

## Features
- LocalStorage save/load
- Coral toggle
- UI styled close to [WuWaTracker](https://wuwatracker.com)
- Info button linking to coral statistics source
- Tooltip showing formula

## Formula
pulls = floor(astrites / 160) + tides  
coral += coral + (pulls × multiplier)  
pulls += coral / 8 (if coral enabled)

Multiplier:
- Radiant Tides: 1.2
- Forging Tides: 0.75
- Statistic Estimation from this [reddit post](https://www.reddit.com/r/WutheringWaves/comments/1j6a5i6/number_of_corals_per_pull_on_each_banner/)

